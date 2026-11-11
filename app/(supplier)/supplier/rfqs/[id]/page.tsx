"use client"

import { use } from "react"
import Link from "next/link"
import { ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"
import { PageFrame, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { StatusBadge, VerifiedChip } from "@/components/bm"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { getRfqBuyerName, getRfqBuyerSummary } from "@/lib/buyer-display"
import { ContactPerson } from "@/components/company/contact-person"
import { useCategoryOptions } from "@/hooks/use-category-options"
import { OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import {
  buyerRfqBadgeLabel,
  buyerRfqBadgeStatus,
} from "@/lib/buyer-rfq-display"
import { formatIsoDate, formatRfqNo } from "@/lib/format"
import { isApiEnabled } from "@/lib/api/config"
import { useQueryClient } from "@tanstack/react-query"
import {
  supplierRfqKeys,
  useSubmitSupplierProposalMutation,
  useSupplierProposalsQuery,
  useSupplierRfqQuery,
  useUpdateSupplierProposalMutation,
  useWithdrawProposalMutation,
} from "@/hooks/api/use-supplier-rfqs-query"
import {
  RfqPositionsCard,
  RfqTermsCard,
} from "@/components/rfq/rfq-v5-detail-cards"
import { SupplierLeadAside } from "@/components/supplier/rfq/supplier-lead-aside"
import { RfqAttachmentsSection } from "@/components/rfq/rfq-attachments-section"
import type { Currency } from "@/types"
import type { ProposalFormValues } from "@/components/supplier/proposal-form"

type PageProps = {
  params: Promise<{ id: string }>
}

export default function SupplierRfqDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const { getRfqCategoryLabel } = useCategoryOptions()
  const getRfqWithRelations = useRfqsStore((s) => s.getRfqWithRelations)
  const getProposalForRfq = useProposalsStore((s) => s.getProposalForRfq)
  const submitProposalLocal = useProposalsStore((s) => s.submitProposal)
  const patchProposalLocal = useProposalsStore((s) => s.patchProposal)
  const updateProposalStatus = useProposalsStore((s) => s.updateProposalStatus)
  const getContractByRfqId = useContractsStore((s) => s.getContractByRfqId)
  const getCompany = useCompaniesStore((s) => s.getCompany)

  const useApi = isApiEnabled()
  const queryClient = useQueryClient()
  const { data: apiRfq, isLoading } = useSupplierRfqQuery(id, hydrated && useApi)
  const { data: apiProposals } = useSupplierProposalsQuery(hydrated && useApi)
  const submitProposalMutation = useSubmitSupplierProposalMutation()
  const updateProposalMutation = useUpdateSupplierProposalMutation()
  const withdrawMutation = useWithdrawProposalMutation()

  const localRfq = hydrated ? getRfqWithRelations(id) : undefined
  const rfq = useApi ? apiRfq : localRfq
  const myProposal = (() => {
    if (useApi) {
      return apiProposals?.items?.find(
        (p) => p.rfq_id === id && p.status !== "withdrawn",
      )
    }
    if (!rfq) return undefined
    const found = getProposalForRfq(rfq.id, actorId)
    return found && found.status !== "withdrawn" ? found : undefined
  })()
  const buyer = rfq ? getRfqBuyerSummary(rfq, getCompany) : undefined
  const buyerName = rfq ? getRfqBuyerName(rfq, getCompany) : "Покупатель"
  const verified = buyer?.verification_status === "verified"

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-8 w-1/3 rounded-xl bg-secondary" />
        <div className="h-48 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  if (!rfq) {
    return (
      <PageFrame>
        <PageHeader
          title="Заявка не найдена"
          backHref="/supplier/rfqs"
          backLabel="Заявки покупателей"
        />
      </PageFrame>
    )
  }

  const localContract = useApi ? undefined : getContractByRfqId(rfq.id)
  const contractId = useApi
    ? rfq.my_contract_id ?? null
    : localContract?.supplier_actor_id === actorId
      ? localContract.id
      : null
  const isRfqOpen = OPEN_RFQ_STATUSES.includes(rfq.status)
  const deadlineLabel = formatIsoDate(rfq.deadline)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: supplierRfqKeys.all })
    void queryClient.invalidateQueries({ queryKey: supplierRfqKeys.detail(id) })
    void queryClient.invalidateQueries({ queryKey: supplierRfqKeys.proposals() })
  }

  const handleSubmit = (values: ProposalFormValues) => {
    if (useApi) {
      void submitProposalMutation.mutateAsync({
        rfqId: rfq.id,
        data: {
          price: values.price,
          currency: rfq.currency,
          delivery_time: values.delivery_time,
          message: values.message,
        },
      })
      return
    }
    submitProposalLocal({
      rfq_id: rfq.id,
      supplier_actor_id: actorId,
      price: values.price,
      currency: rfq.currency as Currency,
      delivery_time: values.delivery_time,
      message: values.message,
    })
  }

  const handleUpdate = (proposalId: number, values: ProposalFormValues) => {
    if (useApi) {
      void updateProposalMutation.mutateAsync({
        id: proposalId,
        data: {
          price: values.price,
          currency: rfq.currency as Currency,
          delivery_time: values.delivery_time,
          message: values.message,
        },
      })
      return
    }
    patchProposalLocal(proposalId, {
      price: values.price,
      currency: rfq.currency as Currency,
      delivery_time: values.delivery_time,
      message: values.message,
    })
  }

  const handleWithdraw = (proposalId: number) => {
    if (useApi) {
      void withdrawMutation.mutateAsync(proposalId)
      return
    }
    updateProposalStatus(proposalId, "withdrawn")
  }

  const description = [
    getRfqCategoryLabel(rfq.category_id),
    `приём КП до ${deadlineLabel}`,
  ].join(" · ")

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
        backHref="/supplier/rfqs"
        backLabel="Заявки покупателей"
        actions={
          <StatusBadge
            status={buyerRfqBadgeStatus(rfq.status)}
            label={buyerRfqBadgeLabel(rfq.status)}
          />
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-5">
          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="text-[12.5px] font-medium text-mute">
              Покупатель
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-[14px] font-semibold text-ink">
                {buyerName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <b className="text-ink">{buyerName}</b>
                <div className="mt-0.5">
                  <VerifiedChip verified={verified} />
                </div>
                <ContactPerson
                  name={rfq.buyer?.kind === "company" ? rfq.created_by : null}
                  role={rfq.contact_role}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="mt-3 text-[13px] text-mute">
              Контакты покупателя откроются после выбора вашего КП. Вопросы — в
              чате площадки.
            </p>
            {myProposal ? (
              <div className="mt-3">
                <Button asChild variant="outline" size="sm" className="h-9">
                  <Link href={`/supplier/messages?proposal=${myProposal.id}`}>
                    <MessageSquare size={15} /> Задать вопрос
                  </Link>
                </Button>
              </div>
            ) : null}
          </section>

          <RfqPositionsCard rfq={rfq} />
          <RfqTermsCard
            rfq={rfq}
            paymentLabel={
              rfq.payment_mode === "direct"
                ? "Сразу вам: деньги приходят в момент оплаты"
                : "С гарантией: покупатель оплачивает до отгрузки, деньги придут после приёмки"
            }
          />
          {rfq.attachments?.length ? (
            <RfqAttachmentsSection attachments={rfq.attachments} />
          ) : null}
        </div>

        <SupplierLeadAside
          isRfqOpen={isRfqOpen}
          deadlineLabel={deadlineLabel}
          buyerName={buyerName}
          myProposal={myProposal}
          myProposalStatus={myProposal?.status ?? rfq.my_proposal_status}
          contractId={contractId}
          currency={rfq.currency}
          budgetType={rfq.budget_type}
          budgetFrom={rfq.budget_from}
          budgetTo={rfq.budget_to}
          onSubmit={handleSubmit}
          onUpdate={handleUpdate}
          onWithdraw={handleWithdraw}
          onOfferResolved={invalidate}
        />
      </div>
    </PageFrame>
  )
}
