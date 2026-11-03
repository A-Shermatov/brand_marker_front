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
import { useAdminProposalActionMutation } from "@/hooks/api/use-admin-proposals-query"
import type { AdminProposalAction } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminProposalAction,
  { title: string; description: string; success: string; destructive?: boolean }
> = {
  delete: {
    title: "Удалить предложение?",
    description: "Предложение без контракта будет удалено безвозвратно.",
    success: "Предложение удалено",
    destructive: true,
  },
  investigate: {
    title: "Завершить расследование?",
    description: "Открытые жалобы будут отмечены как рассмотренные.",
    success: "Жалобы закрыты",
  },
  block_supplier: {
    title: "Заблокировать исполнителя?",
    description: "Компания исполнителя будет заблокирована на платформе.",
    success: "Исполнитель заблокирован",
    destructive: true,
  },
}

type ProposalActionDialogProps = {
  proposalId: number
  proposalTitle: string
  action: AdminProposalAction | null
  onOpenChange: (open: boolean) => void
}

export const ProposalActionDialog = ({
  proposalId,
  proposalTitle,
  action,
  onOpenChange,
}: ProposalActionDialogProps) => {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const actionMutation = useAdminProposalActionMutation()
  const metadata = action ? actionMetadata[action] : null

  useEffect(() => {
    if (!action) setReason("")
  }, [action])

  const handleSubmit = async () => {
    if (!action || !metadata) return
    if (!reason.trim()) {
      toast.error("Укажите причину действия")
      return
    }

    try {
      const result = await actionMutation.mutateAsync({
        proposalId,
        action,
        reason: reason.trim(),
      })
      toast.success(metadata.success)
      onOpenChange(false)
      if (result.status === "deleted") {
        router.push("/admin/proposals")
      }
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
            {proposalTitle}. {metadata?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="proposal-action-reason" className="text-sm font-semibold">
            Причина <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="proposal-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Опишите причину для журнала аудита"
            rows={5}
            maxLength={2000}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={actionMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant={metadata?.destructive ? "destructive" : "default"}
            disabled={actionMutation.isPending || !reason.trim()}
            onClick={handleSubmit}
          >
            {actionMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
