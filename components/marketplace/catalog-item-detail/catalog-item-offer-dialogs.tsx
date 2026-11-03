"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { catalogApi } from "@/lib/api/catalog"
import { getApiErrorMessage } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"

type BuyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: number
  itemTitle: string
  price: number
  currency: string
  presetMessage?: string
  qtyLabel?: string
  total?: number
}

export const CatalogBuyOfferDialog = ({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  price,
  currency,
  presetMessage,
  qtyLabel,
  total,
}: BuyDialogProps) => {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async () => {
    setPending(true)
    try {
      const parts = [presetMessage, message.trim()].filter(Boolean)
      const offer = await catalogApi.createOffer(itemId, {
        kind: "buy",
        price,
        message: parts.length ? parts.join("\n") : undefined,
      })
      toast.success("Запрос на покупку отправлен исполнителю")
      setMessage("")
      onOpenChange(false)
      router.push(`/customer/rfqs/${offer.rfq_id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось отправить запрос"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Купить с гарантией</DialogTitle>
          <DialogDescription>
            {itemTitle}. Запрос уйдёт исполнителю по опубликованной цене. После
            принятия откроется сделка с оплатой через гарантию площадки.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-brand-50/60 px-4 py-3 text-sm">
            <p className="text-mute">
              {qtyLabel ? `Цена за единицу · ${qtyLabel}` : "Цена"}
            </p>
            <p className="mt-0.5 text-lg font-bold text-ink">
              {formatCurrency(price, currency)}
            </p>
            {total != null && (
              <p className="mt-1 text-[13px] text-mute">
                Итого:{" "}
                <span className="font-semibold text-ink">
                  {formatCurrency(total, currency)}
                </span>
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="buy-offer-message" className="text-sm font-semibold">
              Комментарий (необязательно)
            </label>
            <Textarea
              id="buy-offer-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Уточнения по объёму или срокам"
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
            Отправить запрос
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type NegotiateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: number
  itemTitle: string
  listPrice: number | null
  currency: string
  presetMessage?: string
}

export const CatalogNegotiateOfferDialog = ({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  listPrice,
  currency,
  presetMessage,
}: NegotiateDialogProps) => {
  const router = useRouter()
  const [price, setPrice] = useState(listPrice != null ? String(listPrice) : "")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)

  const handleSubmit = async () => {
    const parsed = Number(price.replace(",", "."))
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Укажите корректную цену")
      return
    }
    if (!message.trim()) {
      toast.error("Укажите текст предложения")
      return
    }
    setPending(true)
    try {
      const parts = [presetMessage, message.trim()].filter(Boolean)
      const offer = await catalogApi.createOffer(itemId, {
        kind: "negotiate",
        price: parsed,
        message: parts.join("\n"),
      })
      toast.success("Предложение отправлено исполнителю")
      setMessage("")
      onOpenChange(false)
      router.push(`/customer/rfqs/${offer.rfq_id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось отправить предложение"))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Запросить цену у поставщика</DialogTitle>
          <DialogDescription>
            {itemTitle}. Назовите свою цену и кратко опишите условия. Если
            исполнитель согласится, сразу откроется сделка.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="negotiate-price" className="text-sm font-semibold">
              Ваша цена ({currency})
            </label>
            <Input
              maxLength={MAX_NUMERIC_INPUT_LENGTH}
              id="negotiate-price"
              type="text"
              inputMode="numeric"
              value={price}
              onChange={(event) => {
                const next = sanitizeDigitInput(event.currentTarget.value)
                if (next === null) return
                setPrice(next)
              }}
              placeholder={listPrice != null ? String(listPrice) : "0"}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="negotiate-message" className="text-sm font-semibold">
              Текст предложения
            </label>
            <Textarea
              id="negotiate-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Почему такая цена и что входит в заказ"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button type="button" disabled={pending} onClick={() => void handleSubmit()}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Отправить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
