"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRightIcon as ArrowRight, CheckCircleIcon as CheckCircle2, CircleNotchIcon as Loader2, LockIcon as Lock, ChatTextIcon as MessageSquare, PaperPlaneRightIcon as Send, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import type { Proposal, ProposalStatus } from "@/types"
import { formatDeliveryTime, formatMoneyDisplay } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { supplierProposalsApi } from "@/lib/api/supplier/proposals"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"

type RfqSubmitProposalCardProps = {
  myProposal: Proposal | undefined
  myProposalStatus?: ProposalStatus | null
  contractId?: number | null
  isRfqOpen: boolean
  buyerName: string
  onSubmit: () => void
  onOfferResolved?: () => void
}

const cardClassName =
  "bg-card border border-border rounded-xl p-6 lg:sticky lg:top-[calc(6rem+280px)]"

type ClosedStateProps = {
  icon: React.ReactNode
  title: string
  text: string
}

const ClosedState = ({ icon, title, text }: ClosedStateProps) => (
  <section className={cardClassName}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
    <p className="text-sm text-muted-foreground">{text}</p>
  </section>
)

export const RfqSubmitProposalCard = ({
  myProposal,
  myProposalStatus,
  contractId,
  isRfqOpen,
  buyerName,
  onSubmit,
  onOfferResolved,
}: RfqSubmitProposalCardProps) => {
  const router = useRouter()
  const [pending, setPending] = useState<"accept" | "reject" | null>(null)

  if (contractId) {
    return (
      <section className={cardClassName}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Предложение принято</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {buyerName} выбрал вас поставщиком. Работа по заявке продолжается в сделке.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href={`/supplier/contracts/${contractId}`}>
            Перейти к сделке <ArrowRight />
          </Link>
        </Button>
      </section>
    )
  }

  if (myProposalStatus === "archived") {
    return (
      <ClosedState
        icon={<Lock size={18} className="text-muted-foreground" />}
        title="Покупатель выбрал другого поставщика"
        text="Приём предложений по этой заявке завершён. Спасибо за участие."
      />
    )
  }

  if (myProposalStatus === "rejected") {
    return (
      <ClosedState
        icon={<XCircle size={18} className="text-muted-foreground" />}
        title="Предложение отклонено"
        text="Покупатель отклонил ваше предложение по этой заявке."
      />
    )
  }

  if (myProposal && (myProposalStatus === "pending_supplier" || myProposal.status === "pending_supplier")) {
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
      <section className={cardClassName}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Запрос от покупателя</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          {buyerName} предлагает условия из каталога. Примите — и сразу откроется сделка.
        </p>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 space-y-2">
          <div className="flex justify-between gap-3 text-sm min-w-0">
            <span className="text-muted-foreground shrink-0">Цена</span>
            <span
              className="font-bold text-foreground truncate text-right"
              title={formatMoneyDisplay(myProposal.price, myProposal.currency)}
            >
              {formatMoneyDisplay(myProposal.price, myProposal.currency)}
            </span>
          </div>
          {myProposal.message && (
            <p className="text-sm text-foreground/90 whitespace-pre-wrap pt-1 border-t border-primary/20">
              {myProposal.message}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={pending != null}
            onClick={() => void handleAccept()}
          >
            {pending === "accept" ? <Loader2 className="animate-spin" /> : null}
            Принять и открыть сделку
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full"
            disabled={pending != null}
            onClick={() => void handleReject()}
          >
            {pending === "reject" ? <Loader2 className="animate-spin" /> : null}
            Отклонить
          </Button>
          <Link
            href={`/supplier/messages?proposal=${myProposal.id}`}
            aria-label="Обсудить проект"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-colors"
          >
            <MessageSquare size={16} /> Обсудить
          </Link>
        </div>
      </section>
    )
  }

  if (myProposal) {
    return (
      <section className={cardClassName}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Вы отправили предложение</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Ваше предложение отправлено покупателю и ожидает рассмотрения.
        </p>
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 space-y-2">
          <div className="flex justify-between gap-3 text-sm min-w-0">
            <span className="text-muted-foreground shrink-0">Цена</span>
            <span className="font-bold text-foreground truncate text-right" title={formatMoneyDisplay(myProposal.price, myProposal.currency)}>
              {formatMoneyDisplay(myProposal.price, myProposal.currency)}
            </span>
          </div>
          {myProposal.delivery_time && (
            <div className="flex justify-between gap-3 text-sm min-w-0">
              <span className="text-muted-foreground shrink-0">Срок</span>
              <span className="font-semibold text-foreground truncate text-right" title={formatDeliveryTime(myProposal.delivery_time)}>
                {formatDeliveryTime(myProposal.delivery_time)}
              </span>
            </div>
          )}
        </div>
        <Link
          href={`/supplier/messages?proposal=${myProposal.id}`}
          aria-label="Обсудить проект"
          className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-colors"
        >
          <MessageSquare size={16} /> Обсудить проект
        </Link>
      </section>
    )
  }

  if (!isRfqOpen) {
    return (
      <ClosedState
        icon={<Lock size={18} className="text-muted-foreground" />}
        title="Приём предложений закрыт"
        text="Покупатель больше не принимает предложения по этой заявке."
      />
    )
  }

  return (
    <section className={cardClassName}>
      <h2 className="text-sm font-semibold text-foreground mb-2">Отправить предложение</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Укажите цену, срок и сообщение покупателю. Предложение будет видно в списке предложений.
      </p>
      <button
        type="button"
        onClick={onSubmit}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors"
      >
        <Send size={16} /> Отправить предложение
      </button>
    </section>
  )
}
