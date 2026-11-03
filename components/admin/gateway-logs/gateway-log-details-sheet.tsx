"use client"

import { useState } from "react"
import { CheckIcon as Check, CopyIcon as Copy, CircleNotchIcon as Loader2, ArrowsCounterClockwiseIcon as RefreshCcw } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAdminGatewayLogQuery } from "@/hooks/api/use-admin-gateway-logs-query"
import type {
  AdminGatewayLogDetail,
  AdminGatewayLogDirection,
  AdminGatewayPaymentKind,
} from "@/lib/api/admin"

type GatewayLogDetailsSheetProps = {
  logId: number | null
  onClose: () => void
}

export const GATEWAY_DIRECTION_LABELS: Record<AdminGatewayLogDirection, string> = {
  outbound: "Исходящий",
  inbound: "Входящий",
}

export const GATEWAY_OPERATION_LABELS: Record<string, string> = {
  create_payment: "Создание платежа",
  checktxn: "Проверка транзакции",
  confirm_delivery: "Подтверждение доставки",
  cancel_marketplace: "Отмена платежа",
  callback: "Уведомление банка",
}

const PAYMENT_KIND_LABELS: Record<AdminGatewayPaymentKind, string> = {
  milestone: "Этап контракта",
  subscription: "Подписка",
  unknown: "Не определён",
}

export const getGatewayOperationLabel = (operation: string) =>
  GATEWAY_OPERATION_LABELS[operation] ?? operation

export const formatGatewayDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))

export const formatGatewayMoney = (amount: number | null, currency: string | null) => {
  if (amount === null || amount === undefined) return "—"
  const code = currency?.toUpperCase() || "TJS"
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount} ${code}`
  }
}

export const GatewayStatusBadge = ({ status }: { status: number | null }) => {
  if (status === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Нет ответа
      </Badge>
    )
  }
  const ok = status >= 200 && status < 300
  return (
    <Badge
      variant="outline"
      className={
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }
    >
      {status}
    </Badge>
  )
}

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 wrap-break-word text-foreground">{children}</dd>
  </div>
)

const formatJson = (value: unknown) => JSON.stringify(value, null, 2)

const hasContent = (value: unknown) =>
  value !== null &&
  value !== undefined &&
  !(typeof value === "object" && Object.keys(value as object).length === 0)

const JsonBlock = ({ id, title, value }: { id: string; title: string; value: unknown }) => (
  <section aria-labelledby={id}>
    <h3 id={id} className="text-sm font-bold text-foreground">
      {title}
    </h3>
    {hasContent(value) ? (
      <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-border bg-muted/35 p-3 text-xs whitespace-pre-wrap break-all">
        {typeof value === "string" ? value : formatJson(value)}
      </pre>
    ) : (
      <p className="mt-2 text-sm text-muted-foreground">Нет данных</p>
    )}
  </section>
)

/** Compact pack for bank developers — IDs + HTTP bodies without UI noise. */
export const buildBankReconPack = (log: AdminGatewayLogDetail) => ({
  log_id: log.id,
  created_at: log.created_at,
  responded_at: log.responded_at,
  gateway: log.gateway,
  direction: log.direction,
  operation: log.operation,
  order_id: log.order_id,
  external_transaction_id: log.external_transaction_id,
  amount: log.amount,
  currency: log.currency,
  gateway_txn_status: log.gateway_txn_status,
  paid_at: log.paid_at,
  method: log.method,
  url: log.url,
  response_status: log.response_status,
  error: log.error,
  request_headers: log.request_headers,
  request_body: log.request_body,
  response_body: log.response_body,
  response_raw: log.response_raw,
  payment_kind: log.payment_kind,
  milestone_id: log.milestone_id,
  contract_id: log.contract_id,
})

export const GatewayLogDetailsSheet = ({ logId, onClose }: GatewayLogDetailsSheetProps) => {
  const logQuery = useAdminGatewayLogQuery(logId)
  const log = logQuery.data
  const [copied, setCopied] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  const handleCopyPack = async () => {
    if (!log) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildBankReconPack(log), null, 2))
      setCopied(true)
      toast.success("Пакет для банка скопирован")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  return (
    <Sheet open={Boolean(logId)} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Лог банка</SheetTitle>
          <SheetDescription>
            HTTP-обмен с шлюзом — для сверки с разработчиками банка
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {logQuery.isLoading && (
            <div className="flex min-h-60 items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin" aria-label="Загрузка записи" />
            </div>
          )}

          {logQuery.isError && (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Не удалось загрузить запись</p>
              <Button type="button" variant="outline" size="sm" onClick={() => logQuery.refetch()}>
                <RefreshCcw aria-hidden="true" />
                Повторить
              </Button>
            </div>
          )}

          {log && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopyPack}>
                  {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied ? "Скопировано" : "Копировать для банка"}
                </Button>
              </div>

              <dl className="divide-y divide-border">
                <DetailRow label="Отправлено">{formatGatewayDateTime(log.created_at)}</DetailRow>
                <DetailRow label="Ответ получен">
                  {log.responded_at ? formatGatewayDateTime(log.responded_at) : "—"}
                </DetailRow>
                <DetailRow label="Шлюз">{log.gateway}</DetailRow>
                <DetailRow label="Направление">{GATEWAY_DIRECTION_LABELS[log.direction]}</DetailRow>
                <DetailRow label="Операция">{getGatewayOperationLabel(log.operation)}</DetailRow>
                <DetailRow label="Заказ">
                  <span className="font-mono text-xs">{log.order_id || "—"}</span>
                </DetailRow>
                <DetailRow label="ID в банке">
                  <span className="font-mono text-xs">{log.external_transaction_id || "—"}</span>
                </DetailRow>
                <DetailRow label="Сумма">
                  {formatGatewayMoney(log.amount, log.currency)}
                </DetailRow>
                <DetailRow label="Статус в шлюзе">{log.gateway_txn_status || "—"}</DetailRow>
                <DetailRow label="Оплачено">
                  {log.paid_at ? formatGatewayDateTime(log.paid_at) : "—"}
                </DetailRow>
                <DetailRow label="Тип платежа">{PAYMENT_KIND_LABELS[log.payment_kind]}</DetailRow>
                {log.milestone_id !== null && (
                  <DetailRow label="Этап">№ {log.milestone_id}</DetailRow>
                )}
                {log.contract_id !== null && (
                  <DetailRow label="Контракт">№ {log.contract_id}</DetailRow>
                )}
                {log.subscription_user_id !== null && (
                  <DetailRow label="Пользователь">№ {log.subscription_user_id}</DetailRow>
                )}
                {log.plan && <DetailRow label="Тариф">{log.plan}</DetailRow>}
                <DetailRow label="Запрос">
                  {log.method || log.url ? `${log.method ?? ""} ${log.url ?? ""}`.trim() : "—"}
                </DetailRow>
                <DetailRow label="Статус ответа">
                  <GatewayStatusBadge status={log.response_status} />
                </DetailRow>
                {log.error && (
                  <DetailRow label="Ошибка">
                    <span className="text-destructive">{log.error}</span>
                  </DetailRow>
                )}
              </dl>

              <JsonBlock id="gw-request-headers" title="Заголовки запроса" value={log.request_headers} />
              <JsonBlock id="gw-request-body" title="Тело запроса" value={log.request_body} />
              <JsonBlock id="gw-response-body" title="Тело ответа" value={log.response_body} />
              <JsonBlock id="gw-response-raw" title="Ответ как есть" value={log.response_raw} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
