"use client"

import { useState } from "react"
import { CheckIcon as Check, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import { availableSchemes, paymentSchemeMeta } from "@/lib/order-display"
import { TermHint } from "@/components/ui/term-hint"
import type { OrderKind, PaymentScheme } from "@/types"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  kind: OrderKind
  amount: number
  defaultScheme?: PaymentScheme
  onConfirm: (scheme: PaymentScheme) => void
}

export default function PaymentDialog({
  open, onOpenChange, kind, amount, defaultScheme, onConfirm,
}: PaymentDialogProps) {
  const schemes = availableSchemes(kind)
  const initial = defaultScheme && schemes.includes(defaultScheme) ? defaultScheme : schemes[0]
  const [scheme, setScheme] = useState<PaymentScheme>(initial)

  const upfront =
    scheme === "prepay" ? amount : scheme === "half" ? Math.round(amount / 2) : 0

  const handleConfirm = () => {
    onConfirm(scheme)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            Безопасная оплата заказа
            <TermHint term="escrow" iconOnly />
          </DialogTitle>
          <DialogDescription>
            Оплата после приёмки. Деньги переводятся поставщику только после того,
            как вы примете работу.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 py-1">
          {schemes.map((s) => {
            const meta = paymentSchemeMeta[s]
            const active = scheme === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setScheme(s)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-3.5 transition-all relative",
                  active ? "border-primary bg-secondary" : "border-border hover:border-primary/40",
                )}
              >
                {active && (
                  <span className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </span>
                )}
                <div className="text-sm font-bold text-foreground pr-6">{meta.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{meta.desc}</div>
              </button>
            )
          })}
        </div>

        <div className="rounded-xl bg-secondary p-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Сумма заказа</span>
            <span className="font-bold text-foreground">{formatPrice(amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">К оплате сейчас</span>
            <span className="font-bold text-primary">{formatPrice(upfront)}</span>
          </div>
          {scheme !== "prepay" && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span>После приёмки</span>
              <span>{formatPrice(amount - upfront)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck size={14} className="text-primary flex-shrink-0" />
          Демо-оплата: реальное списание не выполняется.
        </div>

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
            className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors"
          >
            {upfront > 0 ? `Оплатить ${formatPrice(upfront)}` : "Оформить заказ"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
