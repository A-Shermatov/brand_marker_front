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
import { useAdminCatalogBulkActionMutation } from "@/hooks/api/use-admin-catalog-query"
import type { AdminCatalogBulkAction } from "@/lib/api/admin"

const bulkMetadata: Record<
  AdminCatalogBulkAction,
  { title: string; description: string; confirm: string; destructive?: boolean }
> = {
  approve: {
    title: "Одобрить выбранные позиции?",
    description: "Позиции станут активными и появятся в публичном каталоге.",
    confirm: "Одобрить",
  },
  hide: {
    title: "Скрыть выбранные позиции?",
    description: "Позиции исчезнут из публичного каталога. Поставщики получат уведомление.",
    confirm: "Скрыть",
    destructive: true,
  },
  reject: {
    title: "Отклонить выбранные позиции?",
    description: "Поставщики увидят причину и смогут исправить карточки.",
    confirm: "Отклонить",
    destructive: true,
  },
  delete: {
    title: "Удалить выбранные позиции?",
    description: "Позиции будут мягко удалены; их можно восстановить через фильтр «Удалённые».",
    confirm: "Удалить",
    destructive: true,
  },
  restore: {
    title: "Восстановить выбранные позиции?",
    description: "Скрытые, архивные и удалённые позиции снова станут активными.",
    confirm: "Восстановить",
  },
}

const actionsRequiringReason = new Set<AdminCatalogBulkAction>(["hide", "reject", "delete"])

type CatalogBulkActionDialogProps = {
  ids: number[]
  action: AdminCatalogBulkAction | null
  onOpenChange: (open: boolean) => void
  onDone: (failedIds: number[]) => void
}

export const CatalogBulkActionDialog = ({
  ids,
  action,
  onOpenChange,
  onDone,
}: CatalogBulkActionDialogProps) => {
  const [reason, setReason] = useState("")
  const mutation = useAdminCatalogBulkActionMutation()
  const metadata = action ? bulkMetadata[action] : null
  const reasonRequired = action ? actionsRequiringReason.has(action) : false

  useEffect(() => {
    if (!action) setReason("")
  }, [action])

  const handleSubmit = async () => {
    if (!action) return
    try {
      const result = await mutation.mutateAsync({
        ids,
        action,
        reason: reason.trim() || undefined,
      })
      if (result.failed.length === 0) {
        toast.success(`Готово: ${result.succeeded.length}`)
      } else {
        toast.warning(
          `Выполнено: ${result.succeeded.length}, с ошибкой: ${result.failed.length}`,
          {
            description: result.failed
              .slice(0, 5)
              .map((failure) => `#${failure.id}: ${failure.error}`)
              .join("; "),
          },
        )
      }
      onDone(result.failed.map((failure) => failure.id))
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
            Выбрано позиций: {ids.length}. {metadata?.description}
          </DialogDescription>
        </DialogHeader>
        {reasonRequired && (
          <div className="space-y-2">
            <label htmlFor="catalog-bulk-reason" className="text-sm font-semibold">
              Причина для поставщиков <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="catalog-bulk-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Причина будет отправлена каждому поставщику"
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
            variant={metadata?.destructive ? "destructive" : "default"}
            disabled={mutation.isPending || (reasonRequired && !reason.trim())}
            onClick={handleSubmit}
          >
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {metadata?.confirm ?? "Подтвердить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
