"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CaretRightIcon as ChevronRight, ChatCircleIcon as MessageCircle, MinusIcon as Minus, PlusIcon as Plus, ArrowsClockwiseIcon as RefreshCw, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import type { ItemAttribute, ItemPricing, PublicSupplier } from "@/types"
import { guaranteeUrl, loginRedirect, performerUrl } from "@/lib/marketplace-routes"
import { formatCurrency } from "@/lib/format"
import {
  baseUnitPrice,
  findAttrValue,
  formatItemPricing,
  getPricingMoq,
  priceForQty,
} from "@/lib/item-display"
import {
  MAX_NUMERIC_INPUT,
  MAX_NUMERIC_INPUT_LENGTH,
  parseBoundedInt,
} from "@/lib/bounded-number-input"
import {
  CatalogBuyOfferDialog,
  CatalogNegotiateOfferDialog,
} from "@/components/marketplace/catalog-item-detail/catalog-item-offer-dialogs"

type CatalogItemBuyCardProps = {
  itemId: number
  itemTitle: string
  pricing: ItemPricing | null
  attributes: ItemAttribute[]
  supplier: PublicSupplier
  isAuthenticated: boolean
  canUseApiOffers: boolean
  unit?: string
  qty: number
  onQtyChange: (qty: number) => void
}

export const CatalogItemBuyCard = ({
  itemId,
  itemTitle,
  pricing,
  attributes,
  supplier,
  isAuthenticated,
  canUseApiOffers,
  unit = "шт",
  qty,
  onQtyChange,
}: CatalogItemBuyCardProps) => {
  const moq = getPricingMoq(pricing)
  const [buyOpen, setBuyOpen] = useState(false)
  const [negotiateOpen, setNegotiateOpen] = useState(false)

  const currency = pricing?.currency ?? "TJS"
  const unitPrice = priceForQty(pricing, qty)
  const base = baseUnitPrice(pricing)
  const total = unitPrice != null ? unitPrice * qty : null
  const baseTotal = base != null ? base * qty : null
  const savings =
    total != null && baseTotal != null && baseTotal > total
      ? baseTotal - total
      : 0
  const priceLabel = formatItemPricing(pricing)
  const req = unitPrice == null

  const lead =
    findAttrValue(attributes, ["срок", "доставка", "отгрузк", "lead"]) ?? "—"
  const city = supplier.city ?? "—"

  const loginHref = loginRedirect(`/services/${itemId}`)
  const askHref = performerUrl(supplier.actor_id)

  const offerMessage = useMemo(() => {
    if (unitPrice == null || total == null) return undefined
    return `Количество: ${qty} ${unit}. Цена за единицу: ${formatCurrency(unitPrice, currency)}. Итого: ${formatCurrency(total, currency)}.`
  }, [qty, unit, unitPrice, total, currency])

  const clampQty = (next: number) =>
    Math.min(MAX_NUMERIC_INPUT, Math.max(moq, Math.floor(next) || moq))

  return (
    <aside className="grid content-start gap-4 self-start lg:sticky lg:top-[88px] lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <div className="grid gap-5 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
        <div id="pbuy" className="grid scroll-mt-32 gap-4">
          {!req && (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[14px] font-semibold">
                  Количество, {unit}
                </span>
                <div className="flex h-11 rounded-lg border border-line bg-card">
                  <button
                    type="button"
                    className="grid w-11 place-items-center rounded-l-[10px] hover:bg-canvas disabled:opacity-40"
                    aria-label="Меньше"
                    disabled={qty <= moq}
                    onClick={() => onQtyChange(clampQty(qty - 1))}
                  >
                    <Minus size={16} aria-hidden />
                  </button>
                  <input
                    maxLength={MAX_NUMERIC_INPUT_LENGTH}
                    type="text"
                    inputMode="numeric"
                    value={qty}
                    aria-label="Количество"
                    className="w-16 text-center text-[16px] font-bold tnum outline-none"
                    onChange={(e) => {
                      const next = parseBoundedInt(e.currentTarget.value, {
                        min: moq,
                        emptyAs: moq,
                      })
                      if (next === null) return
                      onQtyChange(clampQty(next))
                    }}
                  />
                  <button
                    type="button"
                    className="grid w-11 place-items-center rounded-r-[10px] hover:bg-canvas"
                    aria-label="Больше"
                    onClick={() => onQtyChange(clampQty(qty + 1))}
                  >
                    <Plus size={16} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3">
                <span className="text-[14px] text-mute">Итого</span>
                <span className="text-right">
                  <b className="block text-[24px] font-bold leading-none tnum">
                    {total != null ? formatCurrency(total, currency) : "—"}
                  </b>
                  {savings > 0 && (
                    <span className="text-[12.5px] font-semibold text-brand-700">
                      экономия {formatCurrency(savings, currency)}
                    </span>
                  )}
                </span>
              </div>
            </>
          )}
          {req && (
            <div>
              <b className="block text-[24px] font-bold leading-none tnum">
                Цена по запросу
              </b>
              <span className="mt-1 block text-[13px] text-mute">
                Мин. заказ: {moq} {unit}
              </span>
            </div>
          )}
          {!req && (
            <p className="text-[13px] text-mute">
              {priceLabel} · мин. {moq} {unit}
            </p>
          )}
        </div>

        <div className="grid gap-2.5">
          {canUseApiOffers ? (
            <>
              {!req &&
                (isAuthenticated ? (
                  <Button
                    type="button"
                    className="h-12 w-full rounded-full text-[16px]"
                    onClick={() => setBuyOpen(true)}
                  >
                    <ShieldCheck className="size-5" aria-hidden />
                    Купить с гарантией
                  </Button>
                ) : (
                  <Button asChild className="h-12 w-full rounded-full text-[16px]">
                    <Link href={loginHref}>
                      <ShieldCheck className="size-5" aria-hidden />
                      Купить с гарантией
                    </Link>
                  </Button>
                ))}
              {isAuthenticated ? (
                <Button
                  type="button"
                  variant={req ? "default" : "outline"}
                  className="h-12 w-full rounded-full text-[16px]"
                  onClick={() => setNegotiateOpen(true)}
                >
                  Запросить цену
                </Button>
              ) : (
                <Button
                  asChild
                  variant={req ? "default" : "outline"}
                  className="h-12 w-full rounded-full text-[16px]"
                >
                  <Link href={loginHref}>Запросить цену</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="h-12 w-full rounded-full">
                <Link href={isAuthenticated ? askHref : loginHref}>
                  <MessageCircle className="size-4" aria-hidden />
                  Начать чат
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-center text-[12px] text-mute">
              Запросы доступны при подключении API.
            </p>
          )}
        </div>

        <div className="grid gap-1.5 border-t border-line pt-4">
          <b className="text-[16px] font-bold">Доставка</b>
          <p className="text-[14px]">
            {city} · отгрузка {lead}
          </p>
          <p className="text-[13px] text-mute">по договорённости</p>
        </div>

        <div className="grid gap-3 border-t border-line pt-4">
          <Link
            href={guaranteeUrl()}
            className="flex items-center justify-between text-left"
          >
            <b className="text-[16px] font-bold">Защита заказа Brend Market</b>
            <ChevronRight className="size-4 text-mute" aria-hidden />
          </Link>
          <div className="grid gap-1">
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <ShieldCheck className="size-[18px] text-brand-600" aria-hidden />
              Безопасные платежи
            </span>
            <span className="flex flex-wrap gap-1.5 pl-[26px]">
              {["Корти Милли", "Visa", "Mastercard", "Alif", "По счёту"].map(
                (x) => (
                  <span
                    key={x}
                    className="grid h-5 place-items-center rounded border border-line px-1.5 text-[10.5px] font-bold text-mute"
                  >
                    {x}
                  </span>
                ),
              )}
            </span>
            <span className="pl-[26px] text-[13px] text-mute">
              Деньги удерживает банк‑партнёр до вашей приёмки
            </span>
          </div>
          <div className="grid gap-1">
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <RefreshCw className="size-[18px] text-brand-600" aria-hidden />
              Возврат денег
            </span>
            <span className="pl-[26px] text-[13px] text-mute">
              Если товар не отгружен, потерян или не соответствует договору
            </span>
          </div>
        </div>
        <p className="text-[12.5px] text-mute">
          Защищены только заказы, оформленные и оплаченные через Brend Market.
        </p>
      </div>

      {canUseApiOffers && unitPrice != null && (
        <CatalogBuyOfferDialog
          open={buyOpen}
          onOpenChange={setBuyOpen}
          itemId={itemId}
          itemTitle={itemTitle}
          price={unitPrice}
          currency={currency}
          presetMessage={offerMessage}
          qtyLabel={`${qty} ${unit}`}
          total={total ?? undefined}
        />
      )}
      {canUseApiOffers && (
        <CatalogNegotiateOfferDialog
          open={negotiateOpen}
          onOpenChange={setNegotiateOpen}
          itemId={itemId}
          itemTitle={itemTitle}
          listPrice={unitPrice}
          currency={currency}
          presetMessage={offerMessage}
        />
      )}
    </aside>
  )
}
