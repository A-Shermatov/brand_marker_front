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
import { useAdminCompanyActionMutation } from "@/hooks/api/use-admin-companies-query"
import type { AdminCompanyAction } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminCompanyAction,
  { title: string; description: string; success: string; destructive?: boolean }
> = {
  approve: {
    title: "Подтвердить компанию?",
    description: "Компания получит статус верифицированной.",
    success: "Компания верифицирована",
  },
  reject: {
    title: "Отклонить верификацию?",
    description: "Владелец получит уведомление с указанной причиной.",
    success: "Верификация отклонена",
    destructive: true,
  },
  request_documents: {
    title: "Запросить документы?",
    description: "Укажите, какие документы или сведения нужно добавить.",
    success: "Запрос документов отправлен",
  },
  block: {
    title: "Заблокировать компанию?",
    description: "Все акторы компании потеряют доступ к операциям платформы.",
    success: "Компания заблокирована",
    destructive: true,
  },
  deactivate: {
    title: "Деактивировать компанию?",
    description: "Компания и связанные акторы станут неактивными до восстановления.",
    success: "Компания деактивирована",
    destructive: true,
  },
  reactivate: {
    title: "Активировать компанию?",
    description: "Доступ связанных акторов будет восстановлен.",
    success: "Компания активирована",
  },
}

const actionsRequiringReason = new Set<AdminCompanyAction>([
  "reject",
  "request_documents",
  "block",
  "deactivate",
])

type CompanyActionDialogProps = {
  companyId: number
  companyTitle: string
  action: AdminCompanyAction | null
  onOpenChange: (open: boolean) => void
}

export const CompanyActionDialog = ({
  companyId,
  companyTitle,
  action,
  onOpenChange,
}: CompanyActionDialogProps) => {
  const [reason, setReason] = useState("")
  const actionMutation = useAdminCompanyActionMutation()
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
        companyId,
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
            {companyTitle}. {metadata?.description}
          </DialogDescription>
        </DialogHeader>
        {reasonRequired && (
          <div className="space-y-2">
            <label htmlFor="company-action-reason" className="text-sm font-semibold">
              Причина <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="company-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Опишите причину для владельца и журнала аудита"
              rows={5}
              maxLength={2000}
            />
            <p className="text-right text-xs text-muted-foreground">
              {reason.length}/2000
            </p>
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
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
