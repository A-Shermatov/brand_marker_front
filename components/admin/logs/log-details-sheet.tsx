"use client"

import { CircleNotchIcon as Loader2, ArrowsCounterClockwiseIcon as RefreshCcw } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LogEventDetailsBody, LogResourceLink } from "@/components/admin/logs/log-event-details"
import { useAdminLogQuery } from "@/hooks/api/use-admin-logs-query"
import {
  getLogEventCategoryLabel,
  getLogEventLabel,
  getLogFieldLabel,
  getLogUserRoleLabel,
  LOG_KIND_LABELS,
  LOG_SECTION_LABELS,
  LOG_STATUS_META,
} from "@/lib/admin-log-labels"
import type { AdminLogEventDetail, AdminLogUser } from "@/lib/api/admin"

type LogDetailsSheetProps = {
  logId: number | null
  onClose: () => void
}

export const formatLogDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 wrap-break-word text-foreground">{children}</dd>
  </div>
)

const LogUserCell = ({ user, guestEmail }: { user: AdminLogUser | null; guestEmail?: string | null }) =>
  user ? (
    <>
      <p className="font-semibold">{user.name}</p>
      <p className="text-muted-foreground">{user.email}</p>
      <p className="text-muted-foreground">{getLogUserRoleLabel(user.role)}</p>
    </>
  ) : (
    <>
      <p className="font-semibold">{guestEmail === undefined ? "Система" : "Гость"}</p>
      {guestEmail && <p className="text-muted-foreground">Указан email: {guestEmail}</p>}
    </>
  )

const EventLogDetails = ({ log }: { log: AdminLogEventDetail }) => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border p-4">
      <p className="text-base font-bold text-foreground">{getLogEventLabel(log.action)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {getLogEventCategoryLabel(log.category)} · <code className="text-xs">{log.action}</code>
      </p>
    </div>

    <dl className="divide-y divide-border">
      <DetailRow label="Когда">{formatLogDateTime(log.created_at)}</DetailRow>
      <DetailRow label="Кто">
        <LogUserCell user={log.user} />
        {log.actor_id && <p className="text-muted-foreground">Профиль № {log.actor_id}</p>}
      </DetailRow>
      <DetailRow label="Объект">
        <LogResourceLink resourceType={log.resource_type} resourceId={log.resource_id} />
      </DetailRow>
      {log.company_id && (
        <DetailRow label="Компания">
          <LogResourceLink resourceType="company" resourceId={String(log.company_id)} />
        </DetailRow>
      )}
      <DetailRow label="IP-адрес">{log.ip_address || "—"}</DetailRow>
      <DetailRow label="Браузер">
        {log.user_agent ? <span className="text-xs">{log.user_agent}</span> : "—"}
      </DetailRow>
    </dl>

    <LogEventDetailsBody details={log.details} />
  </div>
)

export const LogDetailsSheet = ({ logId, onClose }: LogDetailsSheetProps) => {
  const logQuery = useAdminLogQuery(logId)
  const log = logQuery.data

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Sheet open={Boolean(logId)} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Подробности записи</SheetTitle>
          <SheetDescription>Кто, когда и что сделал на платформе</SheetDescription>
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

          {log && log.source === "event" && <EventLogDetails log={log} />}

          {log && log.source !== "event" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-border p-4">
                <Badge variant="outline" className={LOG_STATUS_META[log.status].className}>
                  {LOG_STATUS_META[log.status].label}
                </Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  {LOG_STATUS_META[log.status].hint}
                </p>
              </div>

              <dl className="divide-y divide-border">
                <DetailRow label="Когда">{formatLogDateTime(log.created_at)}</DetailRow>
                <DetailRow label="Кто">
                  <LogUserCell user={log.user} guestEmail={log.guest_email} />
                </DetailRow>
                <DetailRow label="Действие">{LOG_KIND_LABELS[log.kind]}</DetailRow>
                <DetailRow label="Раздел">{LOG_SECTION_LABELS[log.section]}</DetailRow>
                <DetailRow label="Объект">{log.object_id ? `№ ${log.object_id}` : "—"}</DetailRow>
                <DetailRow label="IP-адрес">{log.ip_address || "—"}</DetailRow>
              </dl>

              <section aria-labelledby="log-fields-title">
                <h3 id="log-fields-title" className="text-sm font-bold text-foreground">
                  Переданные данные
                </h3>
                {log.fields.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Данные не передавались</p>
                ) : (
                  <dl className="mt-2 divide-y divide-border rounded-xl border border-border px-4">
                    {log.fields.map((field) => (
                      <DetailRow key={field.key} label={getLogFieldLabel(field.key)}>
                        {field.hidden ? (
                          <span className="text-muted-foreground italic">скрыто</span>
                        ) : (
                          field.value || "—"
                        )}
                      </DetailRow>
                    ))}
                  </dl>
                )}
              </section>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
