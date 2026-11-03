"use client"

import { use, useState } from "react"
import Link from "next/link"
import { WarningIcon as AlertTriangle, ClipboardTextIcon as ClipboardList, EyeSlashIcon as EyeOff, ArrowsCounterClockwiseIcon as RefreshCcw, TrashIcon as Trash2, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { RfqActionDialog } from "@/components/admin/rfqs/rfq-action-dialog"
import { AdminRfqDetailSections } from "@/components/admin/rfqs/rfq-detail-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminRfqQuery } from "@/hooks/api/use-admin-rfqs-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminRfqAction } from "@/lib/api/admin"
import { rfqStatusMeta, rfqTypeLabel } from "@/lib/rfq-display"
import type { RfqStatus, RfqType } from "@/types"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"

const sections = [
  ["requirements", "Требования"],
  ["buyer", "Покупатель"],
  ["proposals", "Предложения"],
  ["messages", "Сообщения"],
  ["reports", "Жалобы"],
] as const

const DetailSkeleton = () => (
  <PageFrame className="animate-pulse space-y-5">
    <div className="h-5 w-36 rounded bg-muted" />
    <div className="h-56 rounded-xl bg-muted" />
    <div className="h-14 rounded-xl bg-muted" />
    <div className="h-80 rounded-xl bg-muted" />
  </PageFrame>
)

type PageProps = {
  params: Promise<{ id: string }>
}

export default function AdminRfqDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const rfqQuery = useAdminRfqQuery(id)
  const [selectedAction, setSelectedAction] = useState<AdminRfqAction | null>(null)
  const canUpdate = useAdminPermission("admin_rfqs.update")
  const canDelete = useAdminPermission("admin_rfqs.delete")

  if (!id) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID заявки</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/rfqs">Вернуться к заявкам</Link>
        </Button>
      </div>
    )
  }

  if (rfqQuery.isLoading) return <DetailSkeleton />

  if (rfqQuery.isError || !rfqQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <ClipboardList className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Заявка не найдена</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/rfqs">К списку</Link>
            </Button>
            <Button type="button" onClick={() => rfqQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const rfq = rfqQuery.data
  const statusMeta = rfqStatusMeta[rfq.status as RfqStatus] || {
    label: rfq.status,
    className: "bg-muted text-muted-foreground",
  }
  const canClose = !["completed", "cancelled", "expired", "archived"].includes(rfq.status)

  return (
    <PageFrame>
      <PageHeader
        title={rfq.title}
        description={
          <>
            {rfq.buyer?.company_title || rfq.buyer?.name || "Без покупателя"}
            {rfq.category_id ? ` · ${rfq.category_id}` : ""}
          </>
        }
        backHref="/admin/rfqs"
        backLabel="Все заявки"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              {rfqTypeLabel[rfq.type as RfqType] || rfq.type} · {rfq.id.slice(0, 8)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
              {rfq.open_reports_count > 0 && (
                <Badge variant="outline">Жалоб: {rfq.open_reports_count}</Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
            {canUpdate && rfq.status !== "archived" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("hide")}
              >
                <EyeOff aria-hidden="true" />
                Скрыть
              </Button>
            )}
            {canUpdate && canClose && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("close")}
              >
                <XCircle aria-hidden="true" />
                Закрыть
              </Button>
            )}
            {canUpdate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("warn_buyer")}
              >
                <AlertTriangle aria-hidden="true" />
                Предупредить покупателя
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setSelectedAction("delete")}
              >
                <Trash2 aria-hidden="true" />
                Удалить
              </Button>
            )}
          </div>
        </div>
      </PageSurface>

      <nav
        className="sticky top-17 z-20 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-2 backdrop-blur"
        aria-label="Разделы карточки заявки"
      >
        {sections.map(([sectionId, label]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <AdminRfqDetailSections rfq={rfq} />

      <RfqActionDialog
        rfqId={rfq.id}
        rfqTitle={rfq.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
