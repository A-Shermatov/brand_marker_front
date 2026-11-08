"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  BriefcaseIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  ShoppingCartIcon,
  StorefrontIcon,
  TagIcon,
  TrashIcon,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { useCartCheckoutMutation } from "@/hooks/api/use-approvals-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { cartLineTotal, cartUnitPrice, isPurchase } from "@/lib/cart"
import { formatCurrency } from "@/lib/format"
import { useCartStore } from "@/lib/store/cart-store"
import { cn } from "@/lib/utils"
import { PaymentModeChoice } from "@/components/payments/payment-mode-choice"
import { Button } from "@/components/ui/button"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import type { CartItem, PaymentMode } from "@/types"

/**
 * The cart: items to buy at the published price and items whose price the
 * buyer wants to ask, grouped by supplier. One checkout sends every purchase
 * to its supplier and every price request as a personal request.
 */
export default function CartPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const items = useCartStore((s) => s.items)
  const setQty = useCartStore((s) => s.setQty)
  const setMode = useCartStore((s) => s.setMode)
  const remove = useCartStore((s) => s.remove)
  const clear = useCartStore((s) => s.clear)
  const checkout = useCartCheckoutMutation()
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("escrow")

  const lines = hydrated ? items : []
  const purchases = lines.filter(isPurchase)
  const requests = lines.filter((line) => !isPurchase(line))
  const total = purchases.reduce((sum, line) => sum + cartLineTotal(line), 0)
  const currency = purchases[0]?.currency ?? lines[0]?.currency ?? "TJS"

  const groups = useMemo(() => {
    const bySupplier = new Map<number, { name: string; lines: CartItem[] }>()
    for (const line of lines) {
      const group = bySupplier.get(line.supplierId) ?? {
        name: line.supplierName || "Поставщик",
        lines: [],
      }
      group.lines.push(line)
      bySupplier.set(line.supplierId, group)
    }
    return [...bySupplier.entries()]
  }, [lines])

  const placeOrder = async () => {
    if (!useApi) {
      toast.success("Заказ оформлен")
      clear()
      return
    }
    try {
      const idempotency_key =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const result = await checkout.mutateAsync({
        items: lines.map((line) => ({
          item_id: Number(line.listingId),
          qty: line.qty,
          mode: isPurchase(line) ? "buy" : "quote",
        })),
        payment_mode: paymentMode,
        idempotency_key,
      })
      clear()
      if (!result.offers_created || result.approval.status === "wait") {
        toast.success("Корзина отправлена руководителю на согласование")
        router.push("/customer/approvals")
        return
      }
      toast.success(
        requests.length && purchases.length
          ? "Заказы отправлены поставщикам, запросы цены — тоже"
          : requests.length
            ? "Запросы цены отправлены поставщикам"
            : "Заказы отправлены поставщикам",
      )
      router.push("/customer/rfqs?status=all")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось оформить корзину"))
    }
  }

  if (hydrated && lines.length === 0) {
    return (
      <PageFrame>
        <PageHeader title="Корзина" description="Товары и услуги к оформлению" />
        <PageSurface>
          <PageEmptyState
            icon={<ShoppingCartIcon size={26} />}
            title="Корзина пуста"
            description="Добавьте товары из каталога или запросите цену — всё оформится одним заказом."
          />
          <div className="flex justify-center pb-10">
            <Button asChild size="lg">
              <Link href="/customer/catalog">Перейти в каталог</Link>
            </Button>
          </div>
        </PageSurface>
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader title="Корзина" description="Товары и услуги к оформлению" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          {groups.map(([supplierId, group]) => (
            <section
              key={supplierId}
              className="overflow-hidden rounded-2xl border border-line bg-card"
              aria-label={`Поставщик ${group.name}`}
            >
              <header className="flex items-center gap-2 border-b border-line bg-surface-muted px-4 py-2.5">
                <StorefrontIcon className="size-[18px] text-brand-600" aria-hidden />
                <Link
                  href={`/customer/suppliers/${supplierId}`}
                  className="text-[14px] font-semibold text-ink hover:text-brand-700"
                >
                  {group.name}
                </Link>
              </header>
              <ul className="divide-y divide-line">
                {group.lines.map((line) => (
                  <CartLine
                    key={line.listingId}
                    line={line}
                    onQty={(qty) => setQty(line.listingId, qty)}
                    onMode={(mode) => setMode(line.listingId, mode)}
                    onRemove={() => remove(line.listingId)}
                  />
                ))}
              </ul>
            </section>
          ))}

          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 justify-self-start text-[14px] text-mute transition-colors hover:text-red-600"
          >
            <TrashIcon size={15} aria-hidden /> Очистить корзину
          </button>
        </div>

        <aside className="grid gap-5 rounded-2xl border border-line bg-card p-5 lg:sticky lg:top-[84px]">
          <h2 className="text-[17px] font-bold text-ink">Ваш заказ</h2>
          <dl className="grid gap-2 text-[14px]">
            <div className="flex justify-between gap-3">
              <dt className="text-mute">Покупки</dt>
              <dd className="font-semibold tnum">{purchases.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-mute">Запросы цены</dt>
              <dd className="font-semibold tnum">{requests.length}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <dt className="font-semibold text-ink">К оплате</dt>
              <dd className="text-[22px] font-bold text-ink tnum">{formatCurrency(total, currency)}</dd>
            </div>
          </dl>
          {requests.length > 0 ? (
            <p className="rounded-xl bg-surface-muted px-3 py-2.5 text-[13px] text-ink-soft">
              По запросам цены поставщики пришлют предложения — сумма появится, когда вы его примете.
            </p>
          ) : null}

          {purchases.length > 0 || requests.length > 0 ? (
            <PaymentModeChoice value={paymentMode} onChange={setPaymentMode} stacked />
          ) : null}

          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={checkout.isPending || lines.length === 0}
            onClick={() => void placeOrder()}
          >
            {checkout.isPending ? "Оформляем…" : "Оформить заказ"}
          </Button>
          <p className="text-[12.5px] leading-snug text-mute">
            Поставщик подтвердит наличие и сроки, после этого откроется сделка для оплаты. Если вашей
            роли нужно согласование, корзина сначала уйдёт руководителю.
          </p>
        </aside>
      </div>
    </PageFrame>
  )
}

function CartLine({
  line,
  onQty,
  onMode,
  onRemove,
}: {
  line: CartItem
  onQty: (qty: number) => void
  onMode: (mode: "buy" | "quote") => void
  onRemove: () => void
}) {
  const purchase = isPurchase(line)
  const priced = line.price > 0
  const unit = line.unit ?? "шт"
  const currency = line.currency ?? "TJS"
  const min = line.minQty ?? 1
  const Icon = line.kind === "service" ? BriefcaseIcon : PackageIcon

  return (
    <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[72px_minmax(0,1fr)_auto]">
      <Link
        href={`/customer/catalog/${line.listingId}`}
        className="relative size-16 overflow-hidden rounded-xl border border-line bg-white sm:size-[72px]"
        aria-label={line.title}
      >
        {line.imageUrl ? (
          <Image src={line.imageUrl} alt="" fill unoptimized className="object-cover" sizes="72px" />
        ) : (
          <span className="grid h-full place-items-center bg-surface-muted">
            <Icon size={22} className="text-mute" aria-hidden />
          </span>
        )}
      </Link>

      <div className="grid min-w-0 content-start gap-2">
        <Link
          href={`/customer/catalog/${line.listingId}`}
          className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink hover:text-brand-700"
        >
          {line.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {priced ? (
            <div role="radiogroup" aria-label="Что сделать" className="inline-flex rounded-lg bg-surface-muted p-0.5">
              {(["buy", "quote"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={(purchase ? "buy" : "quote") === mode}
                  onClick={() => onMode(mode)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[12.5px] font-semibold transition-colors",
                    (purchase ? "buy" : "quote") === mode
                      ? "bg-card text-ink shadow-sm"
                      : "text-mute hover:text-ink",
                  )}
                >
                  {mode === "buy" ? "Купить" : "Запросить цену"}
                </button>
              ))}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[12.5px] font-semibold text-amber-700">
              <TagIcon className="size-3.5" aria-hidden />
              Запрос цены
            </span>
          )}
          {purchase ? (
            <span className="text-[13px] text-mute tnum">
              {formatCurrency(cartUnitPrice(line), currency)} / {unit}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <QtyStepper qty={line.qty} min={min} unit={unit} onQty={onQty} />
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:grid sm:justify-items-end sm:content-between">
        <b className="text-[17px] font-bold text-ink tnum">
          {purchase ? formatCurrency(cartLineTotal(line), currency) : "Цена по запросу"}
        </b>
        <div className="hidden sm:block">
          <QtyStepper qty={line.qty} min={min} unit={unit} onQty={onQty} />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-[13px] text-mute transition-colors hover:text-red-600"
          aria-label={`Удалить «${line.title}»`}
        >
          <TrashIcon size={15} aria-hidden />
          Удалить
        </button>
      </div>
    </li>
  )
}

function QtyStepper({
  qty,
  min,
  unit,
  onQty,
}: {
  qty: number
  min: number
  unit: string
  onQty: (qty: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 items-center rounded-lg border border-line">
        <button
          type="button"
          onClick={() => onQty(qty - 1)}
          disabled={qty <= min}
          className="grid size-9 place-items-center text-mute hover:text-ink disabled:opacity-40"
          aria-label="Меньше"
        >
          <MinusIcon size={14} aria-hidden />
        </button>
        <span className="w-10 text-center text-[14px] font-bold tnum" aria-label="Количество">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => onQty(qty + 1)}
          className="grid size-9 place-items-center text-mute hover:text-ink"
          aria-label="Больше"
        >
          <PlusIcon size={14} aria-hidden />
        </button>
      </div>
      <span className="text-[12.5px] text-mute">{unit}</span>
    </div>
  )
}
