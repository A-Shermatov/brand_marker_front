"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CaretRightIcon as ChevronRight,
  ChatCircleIcon as MessageCircle,
  LightningIcon,
  MinusIcon as Minus,
  PlusIcon as Plus,
  ArrowsClockwiseIcon as RefreshCw,
  ShieldCheckIcon as ShieldCheck,
  ShoppingCartIcon,
  TagIcon,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { CatalogItemWithRelations, ItemAttribute, ItemPricing, PublicSupplier } from "@/types"
import { guaranteeUrl, loginRedirect } from "@/lib/marketplace-routes"
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
import { CatalogBuyOfferDialog } from "@/components/marketplace/catalog-item-detail/catalog-item-offer-dialogs"
import { useOpenDirectChatMutation } from "@/hooks/api/use-direct-chats-query"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"

type CatalogItemBuyCardProps = {
  item: CatalogItemWithRelations
  pricing: ItemPricing | null
  attributes: ItemAttribute[]
  supplier: PublicSupplier
  isAuthenticated: boolean
  canUseApiOffers: boolean
  /** The page to come back to after signing in. */
  returnTo: string
  unit?: string
  qty: number
  onQtyChange: (qty: number) => void
}

export const CatalogItemBuyCard = ({
  item,
  pricing,
  attributes,
  supplier,
  isAuthenticated,
  canUseApiOffers,
  returnTo,
  unit = "шт",
  qty,
  onQtyChange,
}: CatalogItemBuyCardProps) => {
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const addToCart = useAddToCart()
  const openChat = useOpenDirectChatMutation("buyer")
  const inCart = useCartStore((s) => s.items.find((line) => line.listingId === String(item.id)))
  const moq = getPricingMoq(pricing)
  const [buyOpen, setBuyOpen] = useState(false)

  const currency = pricing?.currency ?? "TJS"
  const unitPrice = priceForQty(pricing, qty)
  const base = baseUnitPrice(pricing)
  const total = unitPrice != null ? unitPrice * qty : null
  const baseTotal = base != null ? base * qty : null
  const savings = total != null && baseTotal != null && baseTotal > total ? baseTotal - total : 0
  const priceLabel = formatItemPricing(pricing)
  const req = unitPrice == null

  const lead = findAttrValue(attributes, ["срок", "доставка", "отгрузк", "lead"]) ?? "—"
  const city = supplier.city ?? "—"

  const loginHref = loginRedirect(returnTo)
  const isBuyer = Boolean(user && (user.role === "customer" || user.capabilities?.buyer))
  const signedIn = hydrated && isAuthenticated

  const clampQty = (next: number) =>
    Math.min(MAX_NUMERIC_INPUT, Math.max(moq, Math.floor(next) || moq))

  /** Runs the action for a buyer; others are sent to sign in or told where to buy. */
  const asBuyer = (action: () => void) => {
    if (!signedIn) {
      router.push(loginHref)
      return
    }
    if (!isBuyer) {
      toast.error("Покупать можно из кабинета покупателя")
      return
    }
    action()
  }

  const writeToSupplier = () =>
    asBuyer(() => {
      const href = `/customer/messages?supplier=${supplier.actor_id}`
      openChat.mutate(supplier.actor_id, {
        onSuccess: () => router.push(href),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Не удалось открыть чат"),
      })
    })

  return (
    <aside className="grid content-start gap-4 self-start lg:sticky lg:top-[88px] lg:col-start-2 lg:row-span-2 lg:row-start-1">
      <div className="grid gap-5 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
        <div id="pbuy" className="grid scroll-mt-32 gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[14px] font-semibold">Количество, {unit}</span>
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
                className="w-16 bg-transparent text-center text-[16px] font-bold tnum outline-none"
                onChange={(e) => {
                  const next = parseBoundedInt(e.currentTarget.value, { min: moq, emptyAs: moq })
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
          {!req ? (
            <>
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
              <p className="text-[13px] text-mute">
                {priceLabel} · мин. {moq} {unit}
              </p>
            </>
          ) : (
            <div>
              <b className="block text-[22px] font-bold leading-none">Цена по запросу</b>
              <span className="mt-1.5 block text-[13px] text-mute">
                Добавьте в корзину запрос — поставщик назовёт цену за {qty} {unit}.
              </span>
            </div>
          )}
        </div>

        {canUseApiOffers ? (
          <div className="grid gap-2.5">
            {!req ? (
              <>
                <Button
                  type="button"
                  className="h-12 w-full rounded-full text-[16px]"
                  onClick={() =>
                    asBuyer(() =>
                      addToCart(item, { qty, mode: "buy", supplierName: supplier.display_name }),
                    )
                  }
                >
                  <ShoppingCartIcon className="size-5" aria-hidden />
                  {inCart && hydrated ? "Добавить ещё в корзину" : "В корзину"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-full text-[16px]"
                  onClick={() => asBuyer(() => setBuyOpen(true))}
                >
                  <LightningIcon className="size-5" aria-hidden />
                  Купить сейчас
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant={req ? "default" : "outline"}
              className="h-12 w-full rounded-full text-[16px]"
              onClick={() =>
                asBuyer(() =>
                  addToCart(item, { qty, mode: "quote", supplierName: supplier.display_name }),
                )
              }
            >
              <TagIcon className="size-5" aria-hidden />
              Запросить цену
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-full"
              disabled={openChat.isPending}
              onClick={writeToSupplier}
            >
              <MessageCircle className="size-4" aria-hidden />
              Написать поставщику
            </Button>
            {inCart && hydrated ? (
              <Link
                href="/customer/cart"
                className="text-center text-[13.5px] font-semibold text-brand-700 hover:underline"
              >
                В корзине: {inCart.qty} {unit} · перейти в корзину
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-center text-[12px] text-mute">Запросы доступны при подключении API.</p>
        )}

        <div className="grid gap-1.5 border-t border-line pt-4">
          <b className="text-[16px] font-bold">Доставка</b>
          <p className="text-[14px]">
            {city} · отгрузка {lead}
          </p>
          <p className="text-[13px] text-mute">по договорённости</p>
        </div>

        <div className="grid gap-3 border-t border-line pt-4">
          <Link href={guaranteeUrl()} className="flex items-center justify-between text-left">
            <b className="text-[16px] font-bold">Как можно оплатить</b>
            <ChevronRight className="size-4 text-mute" aria-hidden />
          </Link>
          <div className="grid gap-1">
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <ShieldCheck className="size-[18px] text-safe-500" aria-hidden />С гарантией
            </span>
            <span className="pl-[26px] text-[13px] text-mute">
              Деньги держит банк‑партнёр и переводит поставщику после вашей приёмки
            </span>
          </div>
          <div className="grid gap-1">
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <LightningIcon className="size-[18px] text-amber-600" aria-hidden />
              Сразу поставщику
            </span>
            <span className="pl-[26px] text-[13px] text-mute">
              Для проверенных партнёров: деньги приходят поставщику в момент оплаты
            </span>
          </div>
          <span className="flex flex-wrap gap-1.5 pl-[26px]">
            {["Корти Милли", "Visa", "Mastercard", "Alif", "По счёту"].map((x) => (
              <span
                key={x}
                className="grid h-5 place-items-center rounded border border-line px-1.5 text-[10.5px] font-bold text-mute"
              >
                {x}
              </span>
            ))}
          </span>
          <div className="grid gap-1">
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              <RefreshCw className="size-[18px] text-brand-600" aria-hidden />
              Возврат денег
            </span>
            <span className="pl-[26px] text-[13px] text-mute">
              При оплате с гарантией — если товар не отгружен, потерян или не соответствует договору
            </span>
          </div>
        </div>
      </div>

      {canUseApiOffers && unitPrice != null && (
        <CatalogBuyOfferDialog
          open={buyOpen}
          onOpenChange={setBuyOpen}
          itemId={item.id}
          itemTitle={item.title}
          unitPrice={unitPrice}
          qty={qty}
          unit={unit}
          currency={currency}
        />
      )}
    </aside>
  )
}
