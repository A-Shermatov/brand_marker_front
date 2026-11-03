"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAdminDisputeActionMutation } from "@/hooks/api/use-admin-disputes-query"
import type { AdminDisputeAction } from "@/lib/api/admin"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"

const actionMetadata: Record<
  AdminDisputeAction,
  {
    title: string
    description: string
    success: string
    needsAmount?: boolean
    destructive?: boolean
  }
> = {
  release_funds: {
    title: "Выплатить средства исполнителю?",
    description:
      "Held и disputed этапы будут переведены в «Выплачен», спор закрыт, контракт завершён.",
    success: "Средства выплачены",
  },
  refund_buyer: {
    title: "Вернуть средства покупателю?",
    description:
      "Оплаченные и disputed этапы будут возвращены покупателю, неоплаченные отменены, спор закрыт, контракт отменён.",
    success: "Средства возвращены",
    destructive: true,
  },
  partial_refund: {
    title: "Частичный возврат?",
    description:
      "Укажите сумму возврата покупателю. Возврат выполняется целыми этапами: этап возвращается, только если помещается в сумму полностью. Остальные этапы будут выплачены исполнителю.",
    success: "Частичный возврат выполнен",
    needsAmount: true,
    destructive: true,
  },
  request_evidence: {
    title: "Запросить доказательства?",
    description: "Спор перейдёт в статус «На рассмотрении». Стороны получат уведомление.",
    success: "Доказательства запрошены",
  },
  close_case: {
    title: "Закрыть дело?",
    description:
      "Закрыть дело можно только при пустом escrow. Если средства ещё удерживаются, сначала выплатите, верните или частично верните их — иначе сервер отклонит закрытие. Контракт станет завершённым.",
    success: "Спор закрыт",
  },
}

type DisputeActionDialogProps = {
  disputeId: number
  contractTitle: string
  action: AdminDisputeAction | null
  onOpenChange: (open: boolean) => void
}

export const DisputeActionDialog = ({
  disputeId,
  contractTitle,
  action,
  onOpenChange,
}: DisputeActionDialogProps) => {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [amount, setAmount] = useState("")
  const actionMutation = useAdminDisputeActionMutation()
  const metadata = action ? actionMetadata[action] : null

  useEffect(() => {
    if (!action) {
      setReason("")
      setAmount("")
    }
  }, [action])

  const handleSubmit = async () => {
    if (!action || !metadata) return
    if (!reason.trim()) {
      toast.error("Укажите причину решения")
      return
    }
    let partialBuyerAmount: number | undefined
    if (metadata.needsAmount) {
      partialBuyerAmount = Number(amount)
      if (!Number.isFinite(partialBuyerAmount) || partialBuyerAmount <= 0) {
        toast.error("Укажите корректную сумму возврата")
        return
      }
    }

    try {
      const result = await actionMutation.mutateAsync({
        disputeId,
        action,
        reason: reason.trim(),
        partialBuyerAmount,
      })
      toast.success(
        action === "partial_refund" && result?.partial_buyer_amount != null
          ? `${metadata.success}. Фактически возвращено: ${result.partial_buyer_amount}`
          : metadata.success,
      )
      onOpenChange(false)
      router.refresh()
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{metadata?.title}</DialogTitle>
          <DialogDescription>
            {metadata?.description}
            <span className="mt-2 block font-medium text-foreground">
              {contractTitle}
            </span>
          </DialogDescription>
        </DialogHeader>
        {metadata?.needsAmount && (
          <div>
            <label htmlFor="dispute-partial-amount" className="text-sm font-semibold">
              Сумма возврата покупателю
            </label>
            <Input
              maxLength={MAX_NUMERIC_INPUT_LENGTH}
              id="dispute-partial-amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(event) => {
                const next = sanitizeDigitInput(event.currentTarget.value)
                if (next === null) return
                setAmount(next)
              }}
              className="mt-2"
              aria-required="true"
            />
          </div>
        )}
        <div>
          <label htmlFor="dispute-action-reason" className="text-sm font-semibold">
            Причина
          </label>
          <Textarea
            id="dispute-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Опишите решение"
            className="mt-2 min-h-28"
            aria-required="true"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={actionMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant={metadata?.destructive ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={actionMutation.isPending}
          >
            {actionMutation.isPending && (
              <Loader2 className="animate-spin" aria-hidden="true" />
            )}
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
