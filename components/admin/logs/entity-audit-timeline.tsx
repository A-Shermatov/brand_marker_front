"use client"

import { useId, useState } from "react"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ClockCounterClockwiseIcon as History, CircleNotchIcon as Loader2, ArrowsCounterClockwiseIcon as RefreshCcw } from "@phosphor-icons/react/dist/ssr"
import { formatLogDateTime, LogDetailsSheet } from "@/components/admin/logs/log-details-sheet"
import { LogChangesSummary } from "@/components/admin/logs/log-event-details"
import { Button } from "@/components/ui/button"
import { useAdminEntityLogsQuery } from "@/hooks/api/use-admin-logs-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import { getLogEventCategoryLabel, getLogEventLabel } from "@/lib/admin-log-labels"
import type { AdminLogEventItem } from "@/lib/api/admin"
import { cn } from "@/lib/utils"

type EntityAuditTimelineProps = {
  /** `audit_logs.resource_type`: company, user, catalog_item, rfq, proposal, contract, dispute… */
  resourceType: string
  resourceId: string | number
  title?: string
  pageSize?: number
  className?: string
}

const actorName = (log: AdminLogEventItem) => {
  if (log.user) return log.user.name
  return log.actor_id ? `Профиль № ${log.actor_id}` : "Система"
}

/**
 * Journal of semantic events for one object (plus events whose details reference it,
 * e.g. milestone payments inside a contract). Renders nothing without `audit_logs.view`.
 */
export const EntityAuditTimeline = ({
  resourceType,
  resourceId,
  title = "Журнал действий",
  pageSize = 10,
  className,
}: EntityAuditTimelineProps) => {
  const titleId = useId()
  const canView = useAdminPermission("audit_logs.view")
  const [page, setPage] = useState(1)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const logsQuery = useAdminEntityLogsQuery({ resourceType, resourceId, page, pageSize }, canView)

  if (!canView) return null

  const data = logsQuery.data

  return (
    <section
      aria-labelledby={titleId}
      className={cn("rounded-xl border border-border bg-card p-5", className)}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold">
          <History className="size-5 text-muted-foreground" aria-hidden="true" />
          {title}
        </h2>
        {data && data.total > 0 && (
          <span className="text-sm text-muted-foreground">Всего: {data.total}</span>
        )}
      </div>

      {logsQuery.isLoading && (
        <div className="flex min-h-24 items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Загрузка журнала" />
        </div>
      )}

      {logsQuery.isError && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">Не удалось загрузить журнал</p>
          <Button type="button" variant="outline" size="sm" onClick={() => logsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">Событий пока нет</p>
      )}

      {data && data.items.length > 0 && (
        <ol className={cn("relative space-y-1 border-l border-border pl-5", logsQuery.isFetching && "opacity-70")}>
          {data.items.map((log) => (
            <li key={log.id} className="relative">
              <span
                className="absolute top-3.5 -left-[25px] size-2.5 rounded-full border-2 border-card bg-primary"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setSelectedLogId(log.id)}
                className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-primary"
              >
                <p className="text-sm font-medium text-foreground">{getLogEventLabel(log.action)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatLogDateTime(log.created_at)} · {actorName(log)} ·{" "}
                  {getLogEventCategoryLabel(log.category)}
                </p>
                <LogChangesSummary details={log.details} />
              </button>
            </li>
          ))}
        </ol>
      )}

      {data && data.pages > 1 && (
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Страницы журнала">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Новее
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} из {data.pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= data.pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Старее
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      )}

      <LogDetailsSheet logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </section>
  )
}
