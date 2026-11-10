"use client"

import { use, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { MoneyIcon as Banknote, CheckCircleIcon as CheckCircle2, FileMagnifyingGlassIcon as FileSearch, GavelIcon as Gavel, ArrowsCounterClockwiseIcon as RefreshCcw, ArrowUUpLeftIcon as Undo2, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { DisputeActionDialog } from "@/components/admin/disputes/dispute-action-dialog"
import { AdminDisputeDetailSections } from "@/components/admin/disputes/dispute-detail-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminSendChatMessageMutation } from "@/hooks/api/use-admin-chats-query"
import {
  adminDisputeKeys,
  useAdminDisputeQuery,
  useAdminUploadDisputeEvidenceMutation,
} from "@/hooks/api/use-admin-disputes-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminDisputeAction } from "@/lib/api/admin"
import { adminDisputeStatusMeta } from "@/lib/admin-display"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sections = [
  ["overview", "Обзор"],
  ["buyer-statement", "Заявление покупателя"],
  ["supplier-statement", "Заявление поставщика"],
  ["evidence", "Доказательства"],
  ["files", "Файлы"],
  ["chat", "Чат"],
  ["escrow", "Гарантия"],
  ["timeline", "Хронология"],
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

export default function AdminDisputeDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const disputeId = Number(id)
  const disputeQuery = useAdminDisputeQuery(disputeId)
  const [selectedAction, setSelectedAction] = useState<AdminDisputeAction | null>(null)
  const canManage = useAdminPermission("admin_disputes.update")
  const canChatDisputes = useAdminPermission("admin_disputes.update")
  const canChatContracts = useAdminPermission("admin_contracts.update")
  const canChatProposals = useAdminPermission("admin_proposals.update")
  const canChat = canChatDisputes || canChatContracts || canChatProposals
  const queryClient = useQueryClient()
  const uploadEvidenceMutation = useAdminUploadDisputeEvidenceMutation()
  const sendChatMutation = useAdminSendChatMessageMutation()

  const handleUploadEvidence = async (file: File) => {
    try {
      await uploadEvidenceMutation.mutateAsync({ disputeId, file })
    } catch {
      // error toast comes from the mutation meta
    }
  }

  const handleSendChat = async (chatId: string, text: string) => {
    await sendChatMutation.mutateAsync({ chatId, text })
    await queryClient.invalidateQueries({
      queryKey: adminDisputeKeys.detail(disputeId),
    })
  }

  if (!Number.isInteger(disputeId) || disputeId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID спора</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/disputes">Вернуться к спорам</Link>
        </Button>
      </div>
    )
  }

  if (disputeQuery.isLoading) return <DetailSkeleton />

  if (disputeQuery.isError || !disputeQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <Gavel className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Спор не найден</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/disputes">К списку</Link>
            </Button>
            <Button type="button" onClick={() => disputeQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const dispute = disputeQuery.data
  const statusMeta = adminDisputeStatusMeta[dispute.status] || {
    label: dispute.status,
    className: "bg-muted text-muted-foreground",
  }
  const isResolved = dispute.status === "resolved"
  const escrowPool = dispute.escrow.held + dispute.escrow.disputed
  const canCloseCase = escrowPool <= 0
  const buyerName =
    dispute.buyer?.company_title ||
    dispute.buyer?.name ||
    dispute.buyer?.display_name ||
    "Без покупателя"
  const supplierName =
    dispute.supplier?.company_title ||
    dispute.supplier?.name ||
    dispute.supplier?.display_name ||
    "Без поставщика"

  return (
    <PageFrame>
      <PageHeader
        title={dispute.contract.title}
        description={
          <>
            {buyerName} → {supplierName}
            {" · "}
            {formatMoney(dispute.contract.agreed_amount, dispute.contract.currency)}
          </>
        }
        backHref="/admin/disputes"
        backLabel="Все споры"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              Спор · #{dispute.id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
              <Badge variant="outline">
                На гарантии:{" "}
                {formatMoney(escrowPool, dispute.escrow.currency)}
              </Badge>
            </div>
          </div>

          {!isResolved && canManage && (
            <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("release_funds")}
              >
                <Banknote aria-hidden="true" />
                Выплатить
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("refund_buyer")}
              >
                <Undo2 aria-hidden="true" />
                Вернуть покупателю
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("partial_refund")}
              >
                <CheckCircle2 aria-hidden="true" />
                Частичный возврат
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("request_evidence")}
              >
                <FileSearch aria-hidden="true" />
                Запросить доказательства
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canCloseCase}
                title={
                  canCloseCase
                    ? undefined
                    : "Сначала урегулируйте escrow: выплата, возврат или частичный возврат"
                }
                onClick={() => setSelectedAction("close_case")}
              >
                <XCircle aria-hidden="true" />
                Закрыть дело
              </Button>
            </div>
          )}
        </div>
      </PageSurface>

      <nav
        className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2"
        aria-label="Секции спора"
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

      <AdminDisputeDetailSections
        dispute={dispute}
        onUploadEvidence={canManage ? handleUploadEvidence : undefined}
        uploadingEvidence={uploadEvidenceMutation.isPending}
        canSendChat={canChat}
        sendingChat={sendChatMutation.isPending}
        onSendChat={
          dispute.chat_id ? (text) => handleSendChat(dispute.chat_id as string, text) : undefined
        }
      />

      <DisputeActionDialog
        disputeId={dispute.id}
        contractTitle={dispute.contract.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
