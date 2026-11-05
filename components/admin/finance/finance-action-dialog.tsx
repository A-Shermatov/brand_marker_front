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
import { Textarea } from "@/components/ui/textarea"
import { useAdminFinanceActionMutation } from "@/hooks/api/use-admin-finance-query"
import type { AdminFinanceAction } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminFinanceAction,
  {
    title: string
    description: string
    success: string
    reasonRequired: boolean
    destructive?: boolean
  }
> = {
  mark_paid: {
    title: "Отметить оплаченным?",
    description:
      "Деньги отсюда не отправляются: отметьте платёж оплаченным только после подтверждения банка. Связанный счёт или выплата будут синхронизированы.",
    success: "Платёж отмечен оплаченным",
    reasonRequired: false,
  },
  refund: {
    title: "Отметить возврат, сделанный вручную?",
    description:
      "Деньги отсюда не отправляются: отметьте возврат только после того, как он прошёл через банк. Платёж получит статус «Возвращён», связанный счёт будет отменён. Укажите номер операции в причине.",
    success: "Возврат отмечен",
    reasonRequired: true,
    destructive: true,
  },
}

type FinanceActionDialogProps = {
  paymentId: number
  paymentTitle: string
  action: AdminFinanceAction | null
  onOpenChange: (open: boolean) => void
}

export const FinanceActionDialog = ({
  paymentId,
  paymentTitle,
  action,
  onOpenChange,
}: FinanceActionDialogProps) => {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const actionMutation = useAdminFinanceActionMutation()
  const metadata = action ? actionMetadata[action] : null

  useEffect(() => {
    if (!action) setReason("")
  }, [action])

  const handleSubmit = async () => {
    if (!action || !metadata) return
    if (metadata.reasonRequired && !reason.trim()) {
      toast.error("Укажите причину действия")
      return
    }

    try {
      await actionMutation.mutateAsync({
        paymentId,
        action,
        reason: reason.trim() || undefined,
      })
      toast.success(metadata.success)
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
              {paymentTitle}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="finance-action-reason" className="text-sm font-semibold">
            Причина{metadata?.reasonRequired ? "" : " (необязательно)"}
          </label>
          <Textarea
            id="finance-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Опишите причину"
            className="mt-2 min-h-28"
            aria-required={metadata?.reasonRequired}
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
