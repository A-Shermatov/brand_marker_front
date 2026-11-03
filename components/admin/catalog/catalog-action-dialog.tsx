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
import { useAdminCatalogActionMutation } from "@/hooks/api/use-admin-catalog-query"
import type { AdminCatalogAction } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminCatalogAction,
  {
    title: string
    description: string
    success: string
    confirm: string
    destructive?: boolean
    reasonPlaceholder?: string
  }
> = {
  approve: {
    title: "Одобрить позицию?",
    description: "Позиция станет активной и появится в публичном каталоге.",
    success: "Позиция одобрена",
    confirm: "Одобрить",
  },
  hide: {
    title: "Скрыть позицию?",
    description: "Позиция исчезнет из публичного каталога до повторного одобрения.",
    success: "Позиция скрыта",
    confirm: "Скрыть",
    destructive: true,
    reasonPlaceholder: "Почему позиция скрыта из каталога",
  },
  reject: {
    title: "Отклонить позицию?",
    description:
      "Исполнитель увидит причину отклонения и сможет исправить карточку, затем отправить её снова на модерацию.",
    success: "Позиция отклонена, исполнитель уведомлён",
    confirm: "Отклонить",
    destructive: true,
    reasonPlaceholder: "Опишите причину отклонения для исполнителя",
  },
  delete: {
    title: "Удалить позицию?",
    description: "Позиция будет мягко удалена и скрыта из всех очередей.",
    success: "Позиция удалена",
    confirm: "Удалить",
    destructive: true,
    reasonPlaceholder: "Почему позиция удалена",
  },
  restore: {
    title: "Восстановить позицию?",
    description: "Позиция снова станет активной и появится в публичном каталоге.",
    success: "Позиция восстановлена",
    confirm: "Восстановить",
  },
}

const actionsRequiringReason = new Set<AdminCatalogAction>([
  "hide",
  "reject",
  "delete",
])

type CatalogActionDialogProps = {
  itemId: number
  itemTitle: string
  action: AdminCatalogAction | null
  onOpenChange: (open: boolean) => void
}

export const CatalogActionDialog = ({
  itemId,
  itemTitle,
  action,
  onOpenChange,
}: CatalogActionDialogProps) => {
  const [reason, setReason] = useState("")
  const actionMutation = useAdminCatalogActionMutation()
  const metadata = action ? actionMetadata[action] : null
  const reasonRequired = action ? actionsRequiringReason.has(action) : false

  useEffect(() => {
    if (!action) setReason("")
  }, [action])

  const handleSubmit = async () => {
    if (!action || !metadata) return
    if (reasonRequired && !reason.trim()) {
      toast.error("Укажите причину действия")
      return
    }

    try {
      await actionMutation.mutateAsync({
        itemId,
        action,
        reason: reason.trim() || undefined,
      })
      toast.success(metadata.success)
      onOpenChange(false)
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
            {itemTitle}. {metadata?.description}
          </DialogDescription>
        </DialogHeader>
        {reasonRequired && (
          <div className="space-y-2">
            <label htmlFor="catalog-action-reason" className="text-sm font-semibold">
              Причина для исполнителя <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="catalog-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                metadata?.reasonPlaceholder || "Опишите причину для исполнителя"
              }
              rows={5}
              maxLength={2000}
            />
          </div>
        )}
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
            disabled={actionMutation.isPending || (reasonRequired && !reason.trim())}
            onClick={handleSubmit}
          >
            {actionMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {metadata?.confirm ?? "Подтвердить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
