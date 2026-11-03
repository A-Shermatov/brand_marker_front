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
import { useAdminRfqActionMutation } from "@/hooks/api/use-admin-rfqs-query"
import type { AdminRfqAction } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminRfqAction,
  { title: string; description: string; success: string; destructive?: boolean }
> = {
  hide: {
    title: "Скрыть заявку?",
    description: "Заявка будет перенесена в архив и скрыта с доски исполнителей.",
    success: "Заявка скрыта",
    destructive: true,
  },
  close: {
    title: "Закрыть заявку?",
    description: "Статус заявки станет «Отменён». Приём предложений прекратится.",
    success: "Заявка закрыта",
    destructive: true,
  },
  delete: {
    title: "Удалить заявку?",
    description: "Черновик удаляется безвозвратно. Опубликованные заявки архивируются.",
    success: "Заявка удалена",
    destructive: true,
  },
  warn_buyer: {
    title: "Предупредить покупателя?",
    description: "Покупатель получит системное уведомление с указанной причиной.",
    success: "Предупреждение отправлено",
  },
}

type RfqActionDialogProps = {
  rfqId: string
  rfqTitle: string
  action: AdminRfqAction | null
  onOpenChange: (open: boolean) => void
}

export const RfqActionDialog = ({
  rfqId,
  rfqTitle,
  action,
  onOpenChange,
}: RfqActionDialogProps) => {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const actionMutation = useAdminRfqActionMutation()
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
        rfqId,
        action,
        reason: reason.trim(),
      })
      toast.success(metadata.success)
      onOpenChange(false)
      if (result.status === "deleted") {
        router.push("/admin/rfqs")
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
            {rfqTitle}. {metadata?.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="rfq-action-reason" className="text-sm font-semibold">
            Причина <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="rfq-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Опишите причину для покупателя и журнала аудита"
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
