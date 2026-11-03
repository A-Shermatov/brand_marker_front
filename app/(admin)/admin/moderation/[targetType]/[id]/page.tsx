"use client"

import { use } from "react"
import { useState } from "react"
import Link from "next/link"
import { WarningIcon as AlertTriangle, ProhibitIcon as Ban, CheckCircleIcon as CheckCircle2, ArrowsCounterClockwiseIcon as RefreshCcw, ShieldCheckIcon as ShieldCheck, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { ReportActionDialog } from "@/components/admin/moderation/report-action-dialog"
import { AdminReportDetailSections } from "@/components/admin/moderation/report-detail-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminReportQuery } from "@/hooks/api/use-admin-reports-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminReportAction, AdminReportTargetType } from "@/lib/api/admin"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import {
  adminLabel,
  adminReportReasonLabels,
  adminReportStatusLabels,
  adminReportTargetLabels,
} from "@/lib/admin-display"

const sections = [
  ["reporter", "Заявитель"],
  ["reported-object", "Объект"],
  ["evidence", "Доказательства"],
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

const isTargetType = (value: string): value is AdminReportTargetType =>
  value === "catalog" || value === "rfq" || value === "proposal"

type PageProps = {
  params: Promise<{ targetType: string; id: string }>
}

export default function AdminReportDetailPage({ params }: PageProps) {
  const { targetType: rawTargetType, id } = use(params)
  const reportId = Number(id)
  const targetType = isTargetType(rawTargetType) ? rawTargetType : ""
  const reportQuery = useAdminReportQuery(targetType, reportId)
  const [selectedAction, setSelectedAction] = useState<AdminReportAction | null>(
    null,
  )
  const canUpdate = useAdminPermission("admin_reports.update")
  const canSuspend = useAdminPermission("admin_reports.suspend")
  const canDelete = useAdminPermission("admin_reports.delete")

  if (!isTargetType(rawTargetType) || !Number.isInteger(reportId) || reportId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID жалобы</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/moderation">Вернуться к жалобам</Link>
        </Button>
      </div>
    )
  }

  if (reportQuery.isLoading) return <DetailSkeleton />

  if (reportQuery.isError || !reportQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Жалоба не найдена</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/moderation">К списку</Link>
            </Button>
            <Button type="button" onClick={() => reportQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const report = reportQuery.data
  const isOpen = report.status === "open"

  return (
    <PageFrame>
      <PageHeader
        title={report.reported_object.title}
        description={
          <>
            {report.reporter.name || report.reporter.email}
            {" · "}
            {adminLabel(adminReportReasonLabels, report.reason)}
          </>
        }
        backHref="/admin/moderation"
        backLabel="Все жалобы"
      />

      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              Жалоба · {adminLabel(adminReportTargetLabels, report.target_type)} · #
              {report.id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">
                {adminLabel(adminReportStatusLabels, report.status)}
              </Badge>
              <Badge variant="outline">
                {adminLabel(adminReportReasonLabels, report.reason)}
              </Badge>
            </div>
          </div>

          {isOpen && (canUpdate || canSuspend || canDelete) && (
            <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
              {canUpdate && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAction("dismiss")}
                  >
                    <CheckCircle2 aria-hidden="true" />
                    Отклонить
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAction("warn")}
                  >
                    <AlertTriangle aria-hidden="true" />
                    Предупредить
                  </Button>
                </>
              )}
              {canSuspend && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAction("suspend")}
                >
                  <Ban aria-hidden="true" />
                  Заблокировать
                </Button>
              )}
              {canDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAction("delete")}
                >
                  <Trash2 aria-hidden="true" />
                  Удалить
                </Button>
              )}
            </div>
          )}
        </div>

        <nav
          className="mt-6 flex gap-2 overflow-x-auto border-t border-border pt-4"
          aria-label="Секции жалобы"
        >
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </PageSurface>

      <AdminReportDetailSections report={report} />

      <ReportActionDialog
        targetType={report.target_type}
        reportId={report.id}
        objectTitle={report.reported_object.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
