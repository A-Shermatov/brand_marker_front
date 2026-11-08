"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
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
import { PaymentModeChoice } from "@/components/payments/payment-mode-choice"
import { rfqKeys } from "@/hooks/api/use-rfqs-query"
import { catalogApi } from "@/lib/api/catalog"
import { getApiErrorMessage } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import type { PaymentMode } from "@/types"

type BuyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: number
  itemTitle: string
  /** Unit price for this amount. */
  unitPrice: number
  qty: number
  unit: string
  currency: string
}

/**
 * Buy one item right away, without the cart: the amount, the total and how to
 * pay. The supplier confirms, then the deal opens for payment.
 */
export const CatalogBuyOfferDialog = ({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  unitPrice,
  qty,
  unit,
  currency,
}: BuyDialogProps) => {
  const router = useRouter()
  const qc = useQueryClient()
  const [message, setMessage] = useState("")
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("escrow")
  const [pending, setPending] = useState(false)
  const total = unitPrice * qty

  const handleSubmit = async () => {
    setPending(true)
    try {
      const offer = await catalogApi.createOffer(itemId, {
        kind: "buy",
        qty,
        payment_mode: paymentMode,
        message: message.trim() || undefined,
      })
      void qc.invalidateQueries({ queryKey: rfqKeys.all })
      toast.success("Заказ отправлен поставщику — он подтвердит наличие и сроки")
      setMessage("")
      onOpenChange(false)
      router.push(`/customer/rfqs/${offer.rfq_id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось оформить заказ"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Купить сейчас</DialogTitle>
          <DialogDescription>
            {itemTitle}. Поставщик подтвердит заказ, после этого откроется сделка для оплаты.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5">
          <dl className="grid gap-1.5 rounded-xl bg-surface-muted px-4 py-3 text-[14px]">
            <div className="flex justify-between gap-3">
              <dt className="text-mute">Количество</dt>
              <dd className="font-semibold tnum">
                {qty} {unit}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-mute">Цена за единицу</dt>
              <dd className="font-semibold tnum">{formatCurrency(unitPrice, currency)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-2">
              <dt className="font-semibold text-ink">Итого</dt>
              <dd className="text-[20px] font-bold text-ink tnum">{formatCurrency(total, currency)}</dd>
            </div>
          </dl>

          <PaymentModeChoice value={paymentMode} onChange={setPaymentMode} stacked />

          <div className="grid gap-2">
            <label htmlFor="buy-offer-message" className="text-sm font-semibold">
              Комментарий поставщику (необязательно)
            </label>
            <Textarea
              id="buy-offer-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Адрес доставки, сроки, упаковка"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" disabled={pending} onClick={() => void handleSubmit()}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Оформить за {formatCurrency(total, currency)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
