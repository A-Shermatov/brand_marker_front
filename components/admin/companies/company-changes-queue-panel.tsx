"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BuildingsIcon as Building2, CheckIcon as Check, CircleNotchIcon as Loader2, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { PageEmptyState, PageSurface, SegmentedControl } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdminCompanyChangeRequestActionMutation,
  useAdminCompanyChangeRequestsQuery,
} from "@/hooks/api/use-admin-companies-query"
import type { AdminCompanyChangeRequest } from "@/lib/api/admin"
import { cn } from "@/lib/utils"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const DiffRow = ({
  label,
  before,
  after,
}: {
  label: string
  before: string | null | undefined
  after: string | null | undefined
}) => (
  <div className="rounded-lg border border-border p-3">
    <p className="text-[12.5px] font-medium text-muted-foreground">
      {label}
    </p>
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <div>
        <p className="text-[11px] text-muted-foreground">Сейчас</p>
        <p className="text-sm font-medium text-foreground">{before || "—"}</p>
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">Запрошено</p>
        <p className="text-sm font-medium text-primary">{after || "—"}</p>
      </div>
    </div>
  </div>
)

type CompanyChangesQueuePanelProps = {
  embedded?: boolean
}

type ChangeRequestStatus = "pending" | "approved" | "rejected"

const STATUS_OPTIONS: Array<{ value: ChangeRequestStatus; label: string }> = [
  { value: "pending", label: "Ожидают" },
  { value: "approved", label: "Одобренные" },
  { value: "rejected", label: "Отклонённые" },
]

const EMPTY_DESCRIPTIONS: Record<ChangeRequestStatus, string> = {
  pending: "Смена названия, ИНН или адреса появится здесь после подачи заявки.",
  approved: "Одобренных заявок пока нет.",
  rejected: "Отклонённых заявок пока нет.",
}

export const CompanyChangesQueuePanel = ({
  embedded = false,
}: CompanyChangesQueuePanelProps) => {
  const [status, setStatus] = useState<ChangeRequestStatus>("pending")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectOpen, setRejectOpen] = useState(false)

  const listQuery = useAdminCompanyChangeRequestsQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
  })
  const actionMutation = useAdminCompanyChangeRequestActionMutation()

  const items = listQuery.data?.items ?? []
  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  )

  useEffect(() => {
    if (!selectedId && items[0]) setSelectedId(items[0].id)
  }, [items, selectedId])

  const handleApprove = async (request: AdminCompanyChangeRequest) => {
    try {
      await actionMutation.mutateAsync({ requestId: request.id, action: "approve" })
      toast.success("Изменения применены")
      setSelectedId(null)
    } catch {
      /* meta toast */
    }
  }

  const handleReject = async (request: AdminCompanyChangeRequest) => {
    if (!rejectReason.trim()) {
      toast.error("Укажите причину отклонения")
      return
    }
    try {
      await actionMutation.mutateAsync({
        requestId: request.id,
        action: "reject",
        reason: rejectReason.trim(),
      })
      toast.success("Заявка отклонена")
      setRejectOpen(false)
      setRejectReason("")
      setSelectedId(null)
    } catch {
      /* meta toast */
    }
  }

  const handleStatusChange = (next: ChangeRequestStatus) => {
    setStatus(next)
    setPage(1)
    setSelectedId(null)
    setRejectOpen(false)
    setRejectReason("")
  }

  const queue = (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <PageSurface className="p-0 overflow-hidden">
        {listQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <PageEmptyState
            icon={<Building2 />}
            title="Изменений нет"
            description={EMPTY_DESCRIPTIONS[status]}
          />
        ) : (
          <ul className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors",
                    selected?.id === item.id ? "bg-secondary" : "hover:bg-secondary/60",
                  )}
                >
                  <p className="truncate font-bold text-foreground">
                    {item.company_title || `Компания #${item.company_id}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {Object.keys(item.proposed).length} полей · {formatDate(item.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {(listQuery.data?.total_pages ?? 0) > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Назад
            </Button>
            <span className="text-xs text-muted-foreground">
              {page} / {listQuery.data?.total_pages}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= (listQuery.data?.total_pages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Далее
            </Button>
          </div>
        ) : null}
      </PageSurface>

      <PageSurface>
        {!selected ? (
          <PageEmptyState
            icon={<Building2 />}
            title="Выберите заявку"
            description="Слева список заявок на изменение реквизитов."
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {selected.company_title || `Компания #${selected.company_id}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Заявка от {formatDate(selected.created_at)}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/companies/${selected.company_id}`}>
                  Карточка компании
                </Link>
              </Button>
            </div>

            {selected.reason_from_user ? (
              <p className="rounded-lg bg-secondary/60 px-3 py-2 text-sm text-foreground">
                Комментарий: {selected.reason_from_user}
              </p>
            ) : null}

            <div className="grid gap-3">
              {Object.keys(selected.proposed).map((key) => (
                <DiffRow
                  key={key}
                  label={selected.field_labels?.[key] || key}
                  before={selected.current_snapshot[key]}
                  after={selected.proposed[key]}
                />
              ))}
            </div>

            {selected.status !== "pending" ? (
              <div className="space-y-1 rounded-xl border border-border p-4 text-sm">
                <p className="font-semibold">
                  {selected.status === "approved" ? "Заявка одобрена" : "Заявка отклонена"}
                  {selected.reviewed_at ? ` · ${formatDate(selected.reviewed_at)}` : ""}
                </p>
                {selected.admin_reason ? (
                  <p className="text-muted-foreground">Причина: {selected.admin_reason}</p>
                ) : null}
              </div>
            ) : rejectOpen ? (
              <div className="space-y-3 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">Причина отклонения</p>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Например: ИНН не совпадает с документами"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={actionMutation.isPending}
                    onClick={() => void handleReject(selected)}
                  >
                    Отклонить
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setRejectOpen(false)
                      setRejectReason("")
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={actionMutation.isPending}
                  onClick={() => void handleApprove(selected)}
                >
                  <Check size={16} className="mr-1.5" />
                  Одобрить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={actionMutation.isPending}
                  onClick={() => setRejectOpen(true)}
                >
                  <X size={16} className="mr-1.5" />
                  Отклонить
                </Button>
              </div>
            )}
          </div>
        )}
      </PageSurface>
    </div>
  )

  const body = (
    <div className="space-y-4">
      <SegmentedControl
        value={status}
        options={STATUS_OPTIONS}
        onChange={handleStatusChange}
        ariaLabel="Статус заявок"
      />
      {queue}
    </div>
  )

  if (embedded) return body
  return body
}
