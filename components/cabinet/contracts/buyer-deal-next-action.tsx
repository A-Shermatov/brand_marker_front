"use client"

import { useState } from "react"
import { WarningIcon as AlertTriangle, CheckIcon as Check, ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"
import type { ContractWithRelations } from "@/types"
import { Button } from "@/components/ui/button"
import { NextActionCard } from "@/components/process"
import ReviewDialog, { type ReviewAxisRatings } from "@/components/cabinet/review-dialog"
import {
  AlifCurrencyWarning,
  AlifPaymentNote,
  isAlifCurrencySupported,
} from "@/components/cabinet/payments/alif-payment-note"
import {
  normalizeSubmissionAssets,
  SubmissionAssetsList,
} from "@/components/contracts/submission-assets-list"
import {
  DEAL_NEXT_STEP,
  getDealPhase,
  getFundedMilestone,
  getUnpaidMilestone,
} from "@/lib/process/deal-stages"
import { formatCurrency, formatIsoDate } from "@/lib/format"

type BuyerDealNextActionProps = {
  contract: ContractWithRelations
  supplierName: string
  hasReview: boolean
  busy?: boolean
  viaAlif?: boolean
  alifCurrency?: string | null
  onFund: (milestoneId: number) => void
  onRelease: (milestoneId: number) => void
  onAcceptSubmission: (submissionId: number) => void
  onRequestChanges: (submissionId: number) => void
  onOpenDispute: () => void
  onOpenTab: (tab: "messages" | "dispute") => void
  onSubmitReview: (payload: ReviewAxisRatings) => void
  onUploadReviewPhoto?: (file: File) => Promise<{ file_name: string; file_url: string }>
}

const getPendingSubmission = (contract: ContractWithRelations) =>
  [...(contract.submissions ?? [])]
    .filter((s) => s.status === "pending")
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]

export const BuyerDealNextAction = ({
  contract,
  supplierName,
  hasReview,
  busy = false,
  viaAlif = false,
  alifCurrency = null,
  onFund,
  onRelease,
  onAcceptSubmission,
  onRequestChanges,
  onOpenDispute,
  onOpenTab,
  onSubmitReview,
  onUploadReviewPhoto,
}: BuyerDealNextActionProps) => {
  const [reviewOpen, setReviewOpen] = useState(false)
  const phase = getDealPhase(contract)
  const title = DEAL_NEXT_STEP.buyer[phase]
  const money = (amount: number) => formatCurrency(amount, contract.currency)

  if (phase === "prepay" || phase === "postpay") {
    const milestone = getUnpaidMilestone(contract)
    const currencySupported = isAlifCurrencySupported(viaAlif, alifCurrency, contract.currency)
    return (
      <NextActionCard
        hot
        title={title}
        text={
          phase === "prepay"
            ? viaAlif
              ? "Оплата через Alif: средства сразу резервируются и уйдут исполнителю только после того, как вы примете работу."
              : "Деньги будут храниться на гарантии площадки и уйдут исполнителю только после того, как вы примете работу."
            : viaAlif
              ? "Работа принята. Оплатите через Alif — средства поступят в резерв, затем подтвердите выплату исполнителю."
              : "Работа принята. Оплатите её — деньги поступят на гарантию площадки, а затем вы подтвердите выплату исполнителю."
        }
        actions={
          milestone ? (
            <Button onClick={() => onFund(milestone.id)} disabled={busy || !currencySupported}>
              Оплатить {money(milestone.amount)}
              {viaAlif ? " через Alif" : ""}
            </Button>
          ) : null
        }
      >
        {viaAlif && milestone ? (
          currencySupported ? (
            <AlifPaymentNote />
          ) : (
            <AlifCurrencyWarning currency={alifCurrency ?? ""} />
          )
        ) : null}
      </NextActionCard>
    )
  }

  if (phase === "release") {
    const milestone = getFundedMilestone(contract)
    return (
      <NextActionCard
        hot
        title={title}
        text={
          milestone
            ? viaAlif
              ? `${money(milestone.amount)} в резерве Alif. Подтвердите выплату — средства получит ${supplierName}.`
              : `${money(milestone.amount)} на гарантии площадки. После подтверждения деньги получит ${supplierName}.`
            : undefined
        }
        actions={
          milestone ? (
            <Button onClick={() => onRelease(milestone.id)} disabled={busy}>
              <Check /> Подтвердить выплату
            </Button>
          ) : null
        }
      />
    )
  }

  if (phase === "acceptance") {
    const submission = getPendingSubmission(contract)
    return (
      <NextActionCard
        hot
        title={title}
        text={
          submission
            ? viaAlif
              ? `${supplierName} сдал работу. «Принять работу» подтверждает результат и отправляет зарезервированные средства исполнителю.`
              : `${supplierName} сдал работу. Проверьте результат: если всё в порядке — примите, если нет — отправьте на доработку.`
            : viaAlif
              ? `${supplierName} сообщил, что работа выполнена. После приёмки зарезервированные средства уйдут исполнителю.`
              : `${supplierName} сообщил, что работа выполнена. Проверьте результат.`
        }
        actions={
          submission ? (
            <>
              <Button onClick={() => onAcceptSubmission(submission.id)} disabled={busy}>
                <Check /> Принять работу
              </Button>
              <Button
                variant="outline"
                onClick={() => onRequestChanges(submission.id)}
                disabled={busy}
              >
                Есть замечания
              </Button>
              <Button variant="ghost" className="text-destructive" onClick={onOpenDispute}>
                <AlertTriangle /> Открыть спор
              </Button>
            </>
          ) : null
        }
      >
        {submission ? (
          <div className="grid gap-2 rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Сдано {formatIsoDate(submission.submitted_at.split("T")[0] ?? submission.submitted_at)}
            </p>
            {submission.note ? (
              <p className="text-sm whitespace-pre-line">{submission.note}</p>
            ) : null}
            <SubmissionAssetsList assets={normalizeSubmissionAssets(submission)} />
          </div>
        ) : null}
      </NextActionCard>
    )
  }

  if (phase === "work") {
    return (
      <NextActionCard
        title={title}
        text={
          <>
            Срок сдачи — <b>{formatIsoDate(contract.due_date)}</b>. Когда исполнитель сдаст работу,
            здесь появится кнопка приёмки.
            {getUnpaidMilestone(contract)
              ? " Принять работу можно после оплаты: банк удержит деньги до вашей приёмки."
              : " Оплата удерживается банком и уйдёт исполнителю после вашей приёмки."}
          </>
        }
        actions={
          <Button variant="outline" onClick={() => onOpenTab("messages")}>
            <MessageSquare /> Написать исполнителю
          </Button>
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
            ? "Спасибо за отзыв! Он поможет другим заказчикам выбрать исполнителя."
            : `Расскажите, как прошла работа с ${supplierName} — отзыв поможет другим заказчикам.`
        }
        actions={
          hasReview ? null : (
            <Button onClick={() => setReviewOpen(true)}>Оставить отзыв</Button>
          )
        }
      >
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          counterpartName={supplierName}
          counterpartLabel="исполнителем"
          onUploadPhoto={onUploadReviewPhoto}
          onConfirm={onSubmitReview}
        />
      </NextActionCard>
    )
  }

  return <NextActionCard title={title} />
}
