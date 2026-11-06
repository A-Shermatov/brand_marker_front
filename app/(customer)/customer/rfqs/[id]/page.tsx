"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ProhibitIcon } from "@phosphor-icons/react/dist/ssr"
import { useRouter } from "next/navigation"
import { ArrowRightIcon as ArrowRight, PencilSimpleIcon as Pencil, PlusIcon as Plus, PaperPlaneRightIcon as Send } from "@phosphor-icons/react/dist/ssr"
import { PageFrame, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/bm"
import { useAuthStore } from "@/lib/store/auth-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { usePublicSuppliersByActor } from "@/hooks/api/use-supplier-name"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useCloseRfqMutation,
  usePublishRfqMutation,
  useRfqQuery,
} from "@/hooks/api/use-rfqs-query"
import {
  useAcceptProposalMutation,
  useProposalsForRfqQuery,
} from "@/hooks/api/use-proposals-query"
import { useContractsQuery } from "@/hooks/api/use-contracts-query"
import { useCategoryOptions } from "@/hooks/use-category-options"
import {
  buyerRfqBadgeLabel,
  buyerRfqBadgeStatus,
  isModeratedRfq,
} from "@/lib/buyer-rfq-display"
import { formatCurrency, formatIsoDate, formatRfqNo } from "@/lib/format"
import { DEAL_NEXT_STEP, getDealPhase } from "@/lib/process/deal-stages"
import { ConfirmActionDialog } from "@/components/process"
import { ProposalsCompareTable } from "@/components/cabinet/rfq/proposals-compare-table"
import { AcceptProposalDialog } from "@/components/cabinet/rfq/accept-proposal-dialog"
import {
  RfqPositionsCard,
  RfqTermsCard,
} from "@/components/rfq/rfq-v5-detail-cards"
import type { Proposal, ProposalAcceptInput, RfqWithRelations } from "@/types"

type PageProps = {
  params: Promise<{ id: string }>
}

const MANAGE_PROPOSAL_STATUSES = ["published", "receiving_proposals"] as const

export default function BuyerRfqDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const useApi = isApiEnabled()
  const { getRfqCategoryLabel } = useCategoryOptions()

  const getRfqWithRelations = useRfqsStore((s) => s.getRfqWithRelations)
  const publishRfqLocal = useRfqsStore((s) => s.publishRfq)
  const closeRfqLocal = useRfqsStore((s) => s.closeRfq)
  const getProposalsForRfq = useProposalsStore((s) => s.getProposalsForRfq)
  const acceptProposalLocal = useProposalsStore((s) => s.acceptProposal)
  const getContractByRfqId = useContractsStore((s) => s.getContractByRfqId)

  const { data: apiRfq, isLoading } = useRfqQuery(id, hydrated && useApi)
  const { data: apiProposalsPage } = useProposalsForRfqQuery(id, hydrated && useApi)
  const apiProposals = apiProposalsPage?.items ?? []
  const { data: apiContractsPage } = useContractsQuery(hydrated && useApi)
  const apiContracts = apiContractsPage?.items ?? []

  const publishMutation = usePublishRfqMutation()
  const closeMutation = useCloseRfqMutation()
  const acceptMutation = useAcceptProposalMutation()

  const [acceptTarget, setAcceptTarget] = useState<Proposal | null>(null)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  const localRfq = hydrated ? getRfqWithRelations(id) : undefined
  const rfq: RfqWithRelations | undefined = useApi ? apiRfq : localRfq
  const proposals = useApi
    ? apiProposals
    : rfq
      ? getProposalsForRfq(rfq.id)
      : []
  const contract = useApi
    ? apiContracts.find((c) => c.rfq_id === id)
    : rfq
      ? getContractByRfqId(rfq.id)
      : undefined
  const { getSupplier, getName: getSupplierName } = usePublicSuppliersByActor([
    ...proposals.map((p) => p.supplier_actor_id),
    ...(contract ? [contract.supplier_actor_id] : []),
  ])

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-8 w-1/3 rounded-xl bg-secondary" />
        <div className="h-48 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  if (!rfq || rfq.actor_id !== String(actorId)) {
    return (
      <PageFrame>
        <PageHeader
          title="Заявка не найдена"
          backHref="/customer/rfqs"
          backLabel="Заявки"
        />
      </PageFrame>
    )
  }

  const canManageProposals = MANAGE_PROPOSAL_STATUSES.includes(
    rfq.status as (typeof MANAGE_PROPOSAL_STATUSES)[number],
  )
  const visibleProposals = proposals.filter(
    (p) => !["withdrawn", "archived"].includes(p.status),
  )

  const handleAccept = async (proposalId: number, terms: ProposalAcceptInput) => {
    if (useApi) {
      const result = await acceptMutation.mutateAsync({ id: proposalId, terms })
      router.push(`/customer/contracts/${result.contract_id}`)
      return
    }
    const contractId = acceptProposalLocal(proposalId, rfq.id, actorId, terms)
    if (contractId) {
      router.push(`/customer/contracts/${contractId}`)
    }
  }

  const handlePublish = () => {
    if (useApi) {
      publishMutation.mutate(rfq.id)
      return
    }
    publishRfqLocal(rfq.id)
  }

  const handleClose = () => {
    if (useApi) {
      closeMutation.mutate(rfq.id)
      return
    }
    closeRfqLocal(rfq.id)
  }

  const publishedLabel = formatIsoDate(rfq.created_at)
  const description = [
    getRfqCategoryLabel(rfq.category_id),
    rfq.status === "draft" ? "черновик" : `опубликована ${publishedLabel}`,
    rfq.status !== "draft" ? `приём КП до ${formatIsoDate(rfq.deadline)}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <PageFrame>
      <PageHeader
        title={
          <>
            <span className="mono mr-2 text-[18px] font-semibold text-mute">
              {formatRfqNo(rfq.id)}
            </span>
            {rfq.title}
          </>
        }
        description={description}
        backHref="/customer/rfqs"
        backLabel="Заявки"
        actions={
          <StatusBadge
            status={buyerRfqBadgeStatus(rfq.status)}
            label={buyerRfqBadgeLabel(rfq.status)}
          />
        }
      />

      <div className="grid gap-6">
        {isModeratedRfq(rfq) ? (
          <div role="status" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] text-red-900">
            <ProhibitIcon className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
            <div>
              <b className="font-semibold">Заявку снял модератор, она перенесена в архив</b>
              {rfq.moderation_reason ? <p className="mt-0.5">Причина: {rfq.moderation_reason}</p> : null}
              <p className="mt-0.5 text-red-800/80">
                Если не согласны, напишите в поддержку. Можно создать новую заявку с исправлениями.
              </p>
            </div>
          </div>
        ) : null}

        {rfq.status === "draft" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <span className="flex-1 text-[14px] text-brand-900">
              Черновик не виден поставщикам. Проверьте описание и опубликуйте заявку.
            </span>
            <Button onClick={handlePublish} disabled={publishMutation.isPending}>
              <Send size={16} /> Опубликовать
            </Button>
            <Button asChild variant="outline">
              <Link href={`/customer/rfqs/${rfq.id}/edit`}>
                <Pencil size={16} /> Изменить
              </Link>
            </Button>
          </div>
        ) : null}

        {rfq.status === "expired" ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <span className="flex-1 text-[14px] text-amber-800">
              Срок приёма КП истёк — поставщики больше не могут ответить.
            </span>
            <Button asChild variant="outline" size="sm" className="h-9">
              <Link href="/customer/rfqs/new">
                <Plus size={16} /> Новая заявка
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => setCloseConfirmOpen(true)}
            >
              Закрыть заявку
            </Button>
          </div>
        ) : null}

        {contract ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4">
            <span className="flex-1 text-[14px] text-ink">
              По заявке идёт сделка с{" "}
              <b>{getSupplierName(contract.supplier_actor_id)}</b>
              {": "}
              {DEAL_NEXT_STEP.buyer[getDealPhase(contract)].toLowerCase()}.{" "}
              <span className="mono">
                {formatCurrency(contract.agreed_amount, contract.currency)}
              </span>
            </span>
            <Button asChild size="sm" className="h-9">
              <Link href={`/customer/contracts/${contract.id}`}>
                Открыть сделку <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        ) : null}

        {rfq.status !== "draft" ? (
          <section>
            <ProposalsCompareTable
              rfq={rfq}
              proposals={visibleProposals}
              canManage={canManageProposals}
              getSupplier={getSupplier}
              getSupplierName={getSupplierName}
              onAccept={(proposalId) => {
                const target = proposals.find((p) => p.id === proposalId)
                if (target) setAcceptTarget(target)
              }}
            />
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          <RfqPositionsCard rfq={rfq} />
          <RfqTermsCard
            rfq={rfq}
            footer={
              canManageProposals || rfq.status === "draft" ? (
                <>
                  <Button asChild variant="outline" size="sm" className="h-9">
                    <Link href={`/customer/rfqs/${rfq.id}/edit`}>Изменить</Link>
                  </Button>
                  {canManageProposals ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9"
                      disabled={closeMutation.isPending}
                      onClick={() => setCloseConfirmOpen(true)}
                    >
                      Закрыть заявку
                    </Button>
                  ) : null}
                </>
              ) : undefined
            }
          />
        </section>
      </div>

      <ConfirmActionDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        title="Закрыть заявку?"
        description="Исполнители больше не смогут присылать предложения. Вернуть заявку в работу будет нельзя."
        confirmLabel="Закрыть заявку"
        cancelLabel="Не закрывать"
        destructive
        onConfirm={handleClose}
      />

      {acceptTarget && (
        <AcceptProposalDialog
          open={!!acceptTarget}
          onOpenChange={(open) => !open && setAcceptTarget(null)}
          supplierName={getSupplierName(acceptTarget.supplier_actor_id)}
          price={acceptTarget.price}
          currency={acceptTarget.currency}
          onConfirm={(terms) => void handleAccept(acceptTarget.id, terms)}
        />
      )}
    </PageFrame>
  )
}
