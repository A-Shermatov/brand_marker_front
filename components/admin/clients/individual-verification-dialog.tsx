"use client"

import { useEffect, useState } from "react"
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
import { useAdminIndividualVerificationMutation } from "@/hooks/api/use-client-verification-query"

export type IndividualDecision = "approve" | "reject" | "request_documents" | "revoke"

const DECISIONS: Record<
  IndividualDecision,
  { title: string; description: string; success: string; destructive?: boolean; reason: boolean }
> = {
  approve: {
    title: "Подтвердить личность?",
    description: "Профиль получит отметку «Проверен», уровень доверия повысится.",
    success: "Личность подтверждена",
    reason: false,
  },
  request_documents: {
    title: "Запросить документы?",
    description: "Укажите, какие документы нужно загрузить. Клиент получит уведомление.",
    success: "Запрос документов отправлен",
    reason: true,
  },
  reject: {
    title: "Отклонить проверку?",
    description: "Клиент получит уведомление с указанной причиной.",
    success: "Проверка отклонена",
    destructive: true,
    reason: true,
  },
  revoke: {
    title: "Отозвать подтверждение?",
    description: "Отметка «Проверен» будет снята, уровень доверия понизится.",
    success: "Подтверждение отозвано",
    destructive: true,
    reason: true,
  },
}

type IndividualVerificationDialogProps = {
  userId: number
  userName: string
  decision: IndividualDecision | null
  onOpenChange: (open: boolean) => void
}

export const IndividualVerificationDialog = ({
  userId,
  userName,
  decision,
  onOpenChange,
}: IndividualVerificationDialogProps) => {
  const [reason, setReason] = useState("")
  const mutation = useAdminIndividualVerificationMutation()
  const meta = decision ? DECISIONS[decision] : null

  useEffect(() => {
    if (!decision) setReason("")
  }, [decision])

  const handleSubmit = async () => {
    if (!decision || !meta) return
    if (meta.reason && !reason.trim()) {
      toast.error("Укажите причину")
      return
    }
    try {
      await mutation.mutateAsync(
        decision === "revoke"
          ? { userId, action: "set", status: "rejected", reason }
          : { userId, action: decision, reason },
      )
      toast.success(meta.success)
      onOpenChange(false)
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <Dialog open={Boolean(decision)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meta?.title}</DialogTitle>
          <DialogDescription>
            {userName}. {meta?.description}
          </DialogDescription>
        </DialogHeader>
        {meta?.reason && (
          <div className="space-y-2">
            <label htmlFor="individual-decision-reason" className="text-sm font-semibold">
              Причина <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="individual-decision-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Комментарий для клиента и журнала аудита"
              rows={5}
              maxLength={2000}
            />
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant={meta?.destructive ? "destructive" : "default"}
            disabled={mutation.isPending || (Boolean(meta?.reason) && !reason.trim())}
            onClick={() => void handleSubmit()}
          >
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
