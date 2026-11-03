"use client"

import { use, useState } from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { FileArrowUpIcon as FileInput, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, ShieldSlashIcon as ShieldBan, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { ProposalActionDialog } from "@/components/admin/proposals/proposal-action-dialog"
import { AdminProposalDetailSections } from "@/components/admin/proposals/proposal-detail-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminProposalQuery } from "@/hooks/api/use-admin-proposals-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminProposalAction } from "@/lib/api/admin"
import { proposalStatusMeta } from "@/lib/proposal-display"
import type { ProposalStatus } from "@/types"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sections = [
  ["supplier", "Исполнитель"],
  ["buyer", "Покупатель"],
  ["price", "Цена"],
  ["attachments", "Вложения"],
  ["messages", "Сообщения"],
  ["contract", "Контракт"],
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

export default function AdminProposalDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const proposalId = Number(id)
  const proposalQuery = useAdminProposalQuery(proposalId)
  const [selectedAction, setSelectedAction] = useState<AdminProposalAction | null>(null)
  const canUpdate = useAdminPermission("admin_proposals.update")
  const canDelete = useAdminPermission("admin_proposals.delete")

  if (!Number.isInteger(proposalId) || proposalId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID предложения</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/proposals">Вернуться к предложениям</Link>
        </Button>
      </div>
    )
  }

  if (proposalQuery.isLoading) return <DetailSkeleton />

  if (proposalQuery.isError || !proposalQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <FileInput className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Предложение не найдено</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/proposals">К списку</Link>
            </Button>
            <Button type="button" onClick={() => proposalQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const proposal = proposalQuery.data
  const statusMeta = proposalStatusMeta[proposal.status as ProposalStatus] || {
    label: proposal.status,
    className: "bg-muted text-muted-foreground",
  }

  return (
    <PageFrame>
      <PageHeader
        title={proposal.rfq_title || `RFQ ${proposal.rfq_id.slice(0, 8)}`}
        description={
          <>
            {formatMoney(proposal.price, proposal.currency)}
            {" · "}
            {proposal.supplier?.company_title || proposal.supplier?.name || "Исполнитель"}
          </>
        }
        backHref="/admin/proposals"
        backLabel="Все предложения"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              Предложение #{proposal.id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
              {proposal.open_reports_count > 0 && (
                <Badge variant="outline">Жалоб: {proposal.open_reports_count}</Badge>
              )}
              {proposal.has_contract && <Badge variant="outline">Есть контракт</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
            {canUpdate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("investigate")}
              >
                <Search aria-hidden="true" />
                Расследовать
              </Button>
            )}
            {canDelete && proposal.supplier?.company_id && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("block_supplier")}
              >
                <ShieldBan aria-hidden="true" />
                Заблокировать исполнителя
              </Button>
            )}
            {canDelete && !proposal.has_contract && (
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
        aria-label="Разделы карточки предложения"
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

      <AdminProposalDetailSections proposal={proposal} />

      <ProposalActionDialog
        proposalId={proposal.id}
        proposalTitle={proposal.rfq_title || `Proposal #${proposal.id}`}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
