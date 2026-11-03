"use client"

import { useState } from "react"
import { WarningIcon as AlertTriangle } from "@phosphor-icons/react/dist/ssr"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"

interface DisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
}

const presets = [
  "Работа не выполнена в срок",
  "Результат не соответствует требованиям",
  "Исполнитель перестал выходить на связь",
  "Товар не доставлен / повреждён",
]

export default function DisputeDialog({ open, onOpenChange, onConfirm }: DisputeDialogProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      setError("Опишите причину подробнее (от 10 символов)")
      return
    }
    onConfirm(reason.trim())
    setReason("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-1">
            <AlertTriangle size={18} className="text-destructive" />
          </div>
          <DialogTitle>Открыть спор по заказу</DialogTitle>
          <DialogDescription>
            Деньги по безопасной сделке будут заморожены до разрешения спора. Опишите проблему — мы
            рассмотрим обращение.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 py-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setReason(p)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors font-medium"
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Опишите, что пошло не так"
          className="w-full px-4 py-3 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />
        {error && <p className="text-xs text-destructive -mt-2">{error}</p>}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-10 px-5 rounded-xl bg-destructive hover:opacity-90 text-white text-sm font-bold transition-opacity"
          >
            Открыть спор
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
