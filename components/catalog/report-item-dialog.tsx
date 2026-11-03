"use client"

import { useState } from "react"
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
import { catalogApi } from "@/lib/api/catalog"
import { getApiErrorMessage } from "@/lib/api/client"
import { catalogReportReasonLabels } from "@/lib/item-display"
import type { CatalogReportReason } from "@/types"
import { CATALOG_REPORT_REASONS } from "@/types"

type ReportItemDialogProps = {
  itemId: number
  itemTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ReportItemDialog = ({
  itemId,
  itemTitle,
  open,
  onOpenChange,
}: ReportItemDialogProps) => {
  const [reason, setReason] = useState<CatalogReportReason>("spam")
  const [details, setDetails] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async () => {
    setPending(true)
    try {
      await catalogApi.reportItem(itemId, {
        reason,
        details: details.trim() || undefined,
      })
      toast.success("Жалоба отправлена")
      setDetails("")
      onOpenChange(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось отправить жалобу"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на позицию</DialogTitle>
          <DialogDescription>
            {itemTitle}. Укажите причину — модераторы проверят карточку.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="report-reason" className="text-sm font-semibold">
              Причина
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value as CatalogReportReason)}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {CATALOG_REPORT_REASONS.map((value) => (
                <option key={value} value={value}>
                  {catalogReportReasonLabels[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="report-details" className="text-sm font-semibold">
              Комментарий
            </label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Опишите проблему подробнее"
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
