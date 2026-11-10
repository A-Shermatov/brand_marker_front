"use client"

import { useState } from "react"
import Link from "next/link"
import { ChatTextIcon as MessageSquare, UploadSimpleIcon as Upload } from "@phosphor-icons/react/dist/ssr"
import type { ContractWithRelations } from "@/types"
import { Button } from "@/components/ui/button"
import { NextActionCard } from "@/components/process"
import ReviewDialog, { type ReviewAxisRatings } from "@/components/cabinet/review-dialog"
import {
  DEAL_NEXT_STEP,
  getDealPhase,
  getFundedMilestone,
  isPostpaymentDeal,
} from "@/lib/process/deal-stages"
import { formatCurrency, formatIsoDate } from "@/lib/format"

type SupplierDealTab = "messages" | "dispute" | "submission"

type SupplierDealNextActionProps = {
  contract: ContractWithRelations
  buyerName: string
  hasReview?: boolean
  onOpenTab: (tab: SupplierDealTab) => void
  onSubmitReview?: (payload: ReviewAxisRatings) => void
  onUploadReviewPhoto?: (file: File) => Promise<{ file_name: string; file_url: string }>
}

const getLatestSubmission = (contract: ContractWithRelations) =>
  [...(contract.submissions ?? [])].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )[0]

export const SupplierDealNextAction = ({
  contract,
  buyerName,
  hasReview = false,
  onOpenTab,
  onSubmitReview,
  onUploadReviewPhoto,
}: SupplierDealNextActionProps) => {
  const [reviewOpen, setReviewOpen] = useState(false)
  const phase = getDealPhase(contract)
  const title = DEAL_NEXT_STEP.supplier[phase]

  const messageButton = (
    <Button variant="outline" onClick={() => onOpenTab("messages")}>
      <MessageSquare /> Написать покупателю
    </Button>
  )

  if (phase === "work") {
    const latest = getLatestSubmission(contract)
    const returned = latest?.status === "rejected"
    return (
      <NextActionCard
        hot
        title={returned ? "Доработайте и сдайте работу снова" : title}
        text={
          <>
            {returned ? "Покупатель вернул работу с замечаниями — подробности в сообщениях. " : null}
            Срок сдачи — <b>{formatIsoDate(contract.due_date)}</b>. Когда будет готово, прикрепите
            результат: покупатель проверит и примет работу.
            {isPostpaymentDeal(contract) ? " Оплата придёт после приёмки." : null}
          </>
        }
        actions={
          <>
            <Button onClick={() => onOpenTab("submission")}>
              <Upload /> Сдать работу
            </Button>
            {messageButton}
          </>
        }
      />
    )
  }

  if (phase === "prepay") {
    return (
      <NextActionCard
        title={title}
        text="Покупатель оплачивает сделку на гарантию площадки. Начинайте работу после оплаты — так ваши деньги защищены."
        actions={messageButton}
      />
    )
  }

  if (phase === "acceptance") {
    const latest = getLatestSubmission(contract)
    return (
      <NextActionCard
        title={title}
        text={
          latest
            ? `Работа сдана ${formatIsoDate(latest.submitted_at.split("T")[0] ?? latest.submitted_at)}. Покупатель проверит результат и примет работу или вернёт с замечаниями.`
            : "Покупатель проверит результат и примет работу или вернёт с замечаниями."
        }
        actions={messageButton}
      />
    )
  }

  if (phase === "postpay") {
    return (
      <NextActionCard
        title={title}
        text="Покупатель принял работу. После оплаты деньги поступят на гарантию площадки, а затем — на ваш баланс."
      />
    )
  }

  if (phase === "release") {
    const funded = getFundedMilestone(contract)
    return (
      <NextActionCard
        title={title}
        text={
          funded
            ? `${formatCurrency(funded.amount, contract.currency)} уже на гарантии площадки. Деньги поступят на баланс, когда покупатель подтвердит выплату.`
            : "Деньги поступят на баланс, когда покупатель подтвердит выплату."
        }
      />
    )
  }

  if (phase === "disputed") {
    return (
      <NextActionCard
        tone="danger"
        title={title}
        text="Деньги остаются на гарантии площадки, пока администратор разбирается в ситуации. Решение и переписка — во вкладке «Спор»."
        actions={
          <Button variant="outline" onClick={() => onOpenTab("dispute")}>
            Перейти к спору
          </Button>
        }
      />
    )
  }

  if (phase === "done") {
    return (
      <NextActionCard
        title={title}
        text={
          hasReview
            ? "Спасибо за отзыв! Оплата по сделке зачислена на ваш баланс."
            : `Оцените покупателя ${buyerName} — отзыв поможет другим поставщикам.`
        }
        actions={
          <>
            {!hasReview && onSubmitReview ? (
              <Button onClick={() => setReviewOpen(true)}>Оставить отзыв</Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/supplier/finance">Перейти в финансы</Link>
            </Button>
          </>
        }
      >
        {onSubmitReview ? (
          <ReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            counterpartName={buyerName}
            counterpartLabel="покупателем"
            variant="about_buyer"
            onUploadPhoto={onUploadReviewPhoto}
            onConfirm={onSubmitReview}
          />
        ) : null}
      </NextActionCard>
    )
  }

  return <NextActionCard title={title} />
}
