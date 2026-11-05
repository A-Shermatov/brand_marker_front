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
import { useAdminContractActionMutation } from "@/hooks/api/use-admin-contracts-query"
import type { AdminContractAction } from "@/lib/api/admin"

const actionMetadata: Record<
  AdminContractAction,
  {
    title: string
    description: string
    success: string
    reasonRequired: boolean
    destructive?: boolean
  }
> = {
  freeze: {
    title: "Заморозить деньги по сделке?",
    description:
      "Оплаченные этапы будут заморожены: покупатель не сможет принять работу и выплатить деньги, пока вы не снимете заморозку.",
    success: "Деньги на гарантии заморожены",
    reasonRequired: false,
    destructive: true,
  },
  unfreeze: {
    title: "Снять заморозку?",
    description:
      "Замороженные этапы снова станут оплаченными, покупатель сможет принять работу.",
    success: "Заморозка снята",
    reasonRequired: false,
  },
  cancel: {
    title: "Отменить контракт?",
    description: "Контракт получит статус «Отменён». Это действие необратимо.",
    success: "Контракт отменён",
    reasonRequired: true,
    destructive: true,
  },
  force_complete: {
    title: "Принудительно завершить?",
    description:
      "Контракт будет завершён, а деньги по оплаченным и замороженным этапам уйдут поставщику. Если по сделке открыт спор, сначала решите его.",
    success: "Контракт завершён",
    reasonRequired: true,
  },
  open_investigation: {
    title: "Открыть расследование?",
    description: "Контракт получит статус «Спор» и будет доступен в спорах.",
    success: "Расследование открыто",
    reasonRequired: true,
    destructive: true,
  },
}

type ContractActionDialogProps = {
  contractId: number
  contractTitle: string
  action: AdminContractAction | null
  onOpenChange: (open: boolean) => void
}

export const ContractActionDialog = ({
  contractId,
  contractTitle,
  action,
  onOpenChange,
}: ContractActionDialogProps) => {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const actionMutation = useAdminContractActionMutation()
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
        contractId,
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
              {contractTitle}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div>
          <label htmlFor="contract-action-reason" className="text-sm font-semibold">
            Причина{metadata?.reasonRequired ? "" : " (необязательно)"}
          </label>
          <Textarea
            id="contract-action-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Опишите причину действия"
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
