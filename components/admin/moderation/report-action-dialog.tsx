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
import { useAdminReportActionMutation } from "@/hooks/api/use-admin-reports-query"
import type { AdminReportAction, AdminReportTargetType } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminReportAction,
  {
    title: string
    description: string
    success: string
    requiresReason?: boolean
    destructive?: boolean
  }
> = {
  dismiss: {
    title: "Отклонить жалобу?",
    description: "Жалоба будет закрыта без санкций к объекту или владельцу.",
    success: "Жалоба отклонена",
  },
  warn: {
    title: "Отправить предупреждение?",
    description: "Владелец объекта получит уведомление. Жалоба будет закрыта.",
    success: "Предупреждение отправлено",
    requiresReason: true,
  },
  suspend: {
    title: "Приостановить владельца?",
    description:
      "Пользователь или компания владельца будут заблокированы. Жалоба закроется.",
    success: "Владелец приостановлен",
    requiresReason: true,
    destructive: true,
  },
  delete: {
    title: "Удалить объект?",
    description: "Сообщённый объект будет удалён или скрыт. Жалоба закроется.",
    success: "Объект удалён",
    requiresReason: true,
    destructive: true,
  },
}

type ReportActionDialogProps = {
  targetType: AdminReportTargetType
  reportId: number
  objectTitle: string
  action: AdminReportAction | null
  onOpenChange: (open: boolean) => void
}

export const ReportActionDialog = ({
  targetType,
  reportId,
  objectTitle,
  action,
  onOpenChange,
}: ReportActionDialogProps) => {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const actionMutation = useAdminReportActionMutation()
  const metadata = action ? actionMetadata[action] : null

  useEffect(() => {
    if (!action) setReason("")
  }, [action])

  const handleSubmit = async () => {
    if (!action || !metadata) return
    if (metadata.requiresReason && !reason.trim()) {
      toast.error("Укажите причину")
      return
    }

    try {
      await actionMutation.mutateAsync({
        targetType,
        reportId,
        action,
        reason: reason.trim() || undefined,
      })
      toast.success(metadata.success)
      onOpenChange(false)
      router.push("/admin/moderation")
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
              {objectTitle}
            </span>
          </DialogDescription>
        </DialogHeader>
        {metadata?.requiresReason !== false && action !== "dismiss" && (
          <div>
            <label htmlFor="report-action-reason" className="text-sm font-semibold">
              Причина
            </label>
            <Textarea
              id="report-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Опишите решение"
              className="mt-2 min-h-28"
              aria-required={metadata?.requiresReason}
            />
          </div>
        )}
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
