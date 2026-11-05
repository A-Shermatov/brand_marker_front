"use client"

import { use, useState } from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { CheckCircleIcon as CheckCircle2, CurrencyCircleDollarIcon as CircleDollarSign, DownloadSimpleIcon as Download, ArrowsCounterClockwiseIcon as RefreshCcw, ArrowUUpLeftIcon as Undo2 } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { FinanceActionDialog } from "@/components/admin/finance/finance-action-dialog"
import { AdminFinanceDetailSections } from "@/components/admin/finance/finance-detail-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminFinancePaymentQuery } from "@/hooks/api/use-admin-finance-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import { adminApi } from "@/lib/api/admin"
import type { AdminFinanceAction } from "@/lib/api/admin"
import { getApiErrorMessage } from "@/lib/api/client"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import {
  adminFinanceStatusMeta,
  adminFinanceTypeLabels,
  adminLabel,
} from "@/lib/admin-display"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sections = [
  ["transaction", "Транзакция"],
  ["gateway", "Шлюз"],
  ["status", "Статус"],
  ["commission", "Комиссия"],
  ["invoice", "Счёт"],
  ["history", "История"],
] as const

const DetailSkeleton = () => (
  <PageFrame className="animate-pulse space-y-5">
    <div className="h-5 w-36 rounded bg-muted" />
    <div className="h-56 rounded-xl bg-muted" />
    <div className="h-14 rounded-xl bg-muted" />
    <div className="h-80 rounded-xl bg-muted" />
  </PageFrame>
)


const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function AdminFinanceDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const paymentId = Number(id)
  const paymentQuery = useAdminFinancePaymentQuery(paymentId)
  const [selectedAction, setSelectedAction] = useState<AdminFinanceAction | null>(null)
  const [exporting, setExporting] = useState(false)
  const canManage = useAdminPermission("admin_finance.update")

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID платежа</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/finance">Вернуться к финансам</Link>
        </Button>
      </div>
    )
  }

  if (paymentQuery.isLoading) return <DetailSkeleton />

  if (paymentQuery.isError || !paymentQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <CircleDollarSign className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Платёж не найден</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/finance">К списку</Link>
            </Button>
            <Button type="button" onClick={() => paymentQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const payment = paymentQuery.data
  const statusMeta = adminFinanceStatusMeta[payment.status] || {
    label: payment.status,
    className: "bg-muted text-muted-foreground",
  }
  const canMarkPaid = canManage && ["pending", "processing"].includes(payment.status)
  // Refund only records a refund made outside the platform; payouts to suppliers
  // are reconciled with the bank instead.
  const canRefund =
    canManage &&
    payment.status === "paid" &&
    payment.type !== "refund" &&
    payment.type !== "payout"

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await adminApi.exportFinanceCsv({
        view: "platform_revenue",
        paymentId: payment.id,
      })
      downloadBlob(result.blob, result.filename)
      toast.success("Запись экспортирована")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось экспортировать"))
    } finally {
      setExporting(false)
    }
  }

  return (
    <PageFrame>
      <PageHeader
        title={payment.title}
        description={
          <>
            {formatMoney(payment.amount, payment.currency)}
            {" · комиссия "}
            {formatMoney(payment.commission, payment.currency)}
          </>
        }
        backHref="/admin/finance"
        backLabel="Все платежи"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              {adminLabel(adminFinanceTypeLabels, payment.type)} · #{payment.id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download aria-hidden="true" />
              Экспорт
            </Button>
            {canMarkPaid && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("mark_paid")}
              >
                <CheckCircle2 aria-hidden="true" />
                Отметить оплаченным
              </Button>
            )}
            {canRefund && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("refund")}
              >
                <Undo2 aria-hidden="true" />
                Отметить возврат
              </Button>
            )}
          </div>
        </div>
      </PageSurface>

      <nav
        className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2"
        aria-label="Секции платежа"
      >
        {sections.map(([sectionId, label]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            className="shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <AdminFinanceDetailSections payment={payment} />

      <FinanceActionDialog
        paymentId={payment.id}
        paymentTitle={payment.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
