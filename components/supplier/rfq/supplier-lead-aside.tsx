"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircleIcon as CheckCircle2, CircleNotchIcon as Loader2, ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import type { BudgetType, Currency, Proposal, ProposalStatus } from "@/types"
import { StatusBadge } from "@/components/bm"
import { Button } from "@/components/ui/button"
import {
  ProposalForm,
  type ProposalFormValues,
} from "@/components/supplier/proposal-form"
import { proposalBadgeStatus } from "@/lib/proposal-display"
import { isPendingCatalogOffer } from "@/lib/rfq-board"
import { formatDeliveryTime, formatMoneyDisplay } from "@/lib/format"
import { supplierProposalsApi } from "@/lib/api/supplier/proposals"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"

type SupplierLeadAsideProps = {
  isRfqOpen: boolean
  deadlineLabel: string
  buyerName: string
  myProposal: Proposal | undefined
  myProposalStatus?: ProposalStatus | null
  contractId?: number | null
  currency: Currency | string
  budgetType: BudgetType
  budgetFrom: number | null
  budgetTo: number | null
  onSubmit: (values: ProposalFormValues) => void
  onUpdate: (proposalId: number, values: ProposalFormValues) => void
  onWithdraw: (proposalId: number) => void
  onOfferResolved?: () => void
}

export const SupplierLeadAside = ({
  isRfqOpen,
  deadlineLabel,
  buyerName,
  myProposal,
  myProposalStatus,
  contractId,
  currency,
  budgetType,
  budgetFrom,
  budgetTo,
  onSubmit,
  onUpdate,
  onWithdraw,
  onOfferResolved,
}: SupplierLeadAsideProps) => {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState<"accept" | "reject" | null>(null)
  const status = myProposal?.status ?? myProposalStatus
  const pendingOffer = isPendingCatalogOffer(status)

  if (contractId) {
    return (
      <section className="rounded-xl border border-line bg-card p-5 lg:sticky lg:top-20">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-brand-700" />
          <h2 className="text-[12.5px] font-medium text-mute">
            Сделка
          </h2>
        </div>
        <p className="text-[14px] text-mute">
          {buyerName} выбрал вас. Перейдите в сделку, чтобы продолжить.
        </p>
        <Button asChild className="mt-4 w-full">
          <Link href={`/supplier/contracts/${contractId}`}>Открыть сделку</Link>
        </Button>
      </section>
    )
  }

  if (myProposal && pendingOffer) {
    const handleAccept = async () => {
      if (!isApiEnabled()) {
        toast.error("Принятие запроса доступно только через API")
        return
      }
      setPending("accept")
      try {
        const result = await supplierProposalsApi.accept(myProposal.id)
        toast.success("Запрос принят — сделка открыта")
        onOfferResolved?.()
        router.push(`/supplier/contracts/${result.contract_id}`)
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось принять запрос"))
      } finally {
        setPending(null)
      }
    }

    const handleReject = async () => {
      if (!isApiEnabled()) {
        toast.error("Отклонение запроса доступно только через API")
        return
      }
      setPending("reject")
      try {
        await supplierProposalsApi.reject(myProposal.id)
        toast.success("Запрос отклонён")
        onOfferResolved?.()
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Не удалось отклонить запрос"))
      } finally {
        setPending(null)
      }
    }

    return (
      <section className="rounded-xl border border-line bg-card p-5 lg:sticky lg:top-20">
        <h2 className="text-[12.5px] font-medium text-mute">
          Запрос от заказчика
        </h2>
        <p className="mt-2 text-[14px] text-mute">
          {buyerName} предлагает условия из каталога.
        </p>
        <div className="mono mt-3 text-[26px] font-semibold text-ink">
          {formatMoneyDisplay(myProposal.price, myProposal.currency)}
        </div>
        <div className="mt-4 grid gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={pending != null}
            onClick={() => void handleAccept()}
          >
            {pending === "accept" ? <Loader2 className="animate-spin" /> : null}
            Принять и открыть сделку
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending != null}
            onClick={() => void handleReject()}
          >
            Отклонить
          </Button>
        </div>
      </section>
    )
  }

  if (myProposal && !editing) {
    const badge = proposalBadgeStatus(myProposal.status)
    const canEdit = ["submitted", "viewed", "shortlisted"].includes(
      myProposal.status,
    )
    return (
      <section className="rounded-xl border border-line bg-card p-5 lg:sticky lg:top-20">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[12.5px] font-medium text-mute">
            Ваше КП
          </h2>
          <StatusBadge status={badge.status} label={badge.label} />
        </div>
        <div className="mono mt-2 text-[26px] font-semibold text-ink">
          {formatMoneyDisplay(myProposal.price, myProposal.currency)}
        </div>
        <dl className="mt-3 grid gap-1.5 text-[13.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-mute">Срок</dt>
            <dd>{formatDeliveryTime(myProposal.delivery_time)}</dd>
          </div>
          {myProposal.message ? (
            <div className="pt-1">
              <dt className="text-mute">Комментарий</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ink">
                {myProposal.message}
              </dd>
            </div>
          ) : null}
        </dl>
        {canEdit ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setEditing(true)}
            >
              Изменить КП
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9"
              onClick={() => onWithdraw(myProposal.id)}
            >
              Отозвать
            </Button>
          </div>
        ) : null}
        <Link
          href={`/supplier/messages?proposal=${myProposal.id}`}
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700"
        >
          <MessageSquare size={14} /> Обсудить
        </Link>
      </section>
    )
  }

  if (!isRfqOpen) {
    return (
      <section className="rounded-xl border border-line bg-card p-5 lg:sticky lg:top-20">
        <b className="text-[15px] text-ink">Приём КП закрыт</b>
        <p className="mt-1 text-[14px] text-mute">
          Срок истёк {deadlineLabel}.
        </p>
      </section>
    )
  }

  return (
    <div className="lg:sticky lg:top-20">
      <ProposalForm
        variant="panel"
        active
        currency={currency}
        budgetType={budgetType}
        budgetFrom={budgetFrom}
        budgetTo={budgetTo}
        defaultPrice={
          myProposal?.price ?? budgetFrom ?? budgetTo ?? undefined
        }
        defaultDeliveryTime={myProposal?.delivery_time}
        defaultMessage={myProposal?.message}
        submitLabel={editing ? "Сохранить КП" : "Отправить КП"}
        onCancel={editing ? () => setEditing(false) : undefined}
        onSubmit={(values) => {
          if (editing && myProposal) {
            onUpdate(myProposal.id, values)
            setEditing(false)
            return
          }
          onSubmit(values)
        }}
      />
    </div>
  )
}
