"use client"

import Link from "next/link"
import {
  CaretRightIcon as CaretRight,
  SealCheckIcon as SealCheck,
  ShieldCheckIcon as ShieldCheck,
  StarIcon as Star,
} from "@phosphor-icons/react/dist/ssr"
import { CompanyName } from "@/components/bm"
import { StatusPill } from "@/components/layout/card-list"
import { performerUrl } from "@/lib/marketplace-routes"
import { resolveFileUrl } from "@/lib/file-url"
import type { ItemAttribute, ItemPricing, PublicSupplier } from "@/types"
import { formatCurrency } from "@/lib/format"
import {
  activeTierIndex,
  formatItemPricing,
  getPricingMoq,
  getSortedTiers,
  priceForQty,
} from "@/lib/item-display"
import { scrollToProductSection } from "@/lib/product-scroll"
import { cn } from "@/lib/utils"

type CatalogItemInfoProps = {
  title: string
  pricing: ItemPricing | null
  attributes: ItemAttribute[]
  supplier: PublicSupplier
  /** How buyers rated this very item; the supplier's own rating is shown apart. */
  itemRating?: { average: number; count: number } | null
  /** The supplier's page: the public profile or the one in the buyer's cabinet. */
  supplierHref?: string
  unit?: string
  qty?: number
}

export const CatalogItemInfo = ({
  title,
  pricing,
  attributes,
  supplier,
  itemRating,
  supplierHref,
  unit = "шт",
  qty,
}: CatalogItemInfoProps) => {
  const moq = getPricingMoq(pricing)
  const effectiveQty = qty ?? moq
  const tiers = getSortedTiers(pricing)
  const currency = pricing?.currency ?? "TJS"
  const unitPrice = priceForQty(pricing, effectiveQty)
  const activeIdx = activeTierIndex(pricing, effectiveQty)
  const keyAttrs = [...attributes]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 6)
  const headline = formatItemPricing(pricing)

  return (
    <div id="pinfo" className="grid min-w-0 content-start gap-5">
      <div className="grid gap-2">
        <h1 className="text-[22px] font-bold leading-snug tracking-[-0.01em] text-ink lg:text-[24px]">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
          {itemRating && itemRating.count > 0 ? (
            <button
              type="button"
              onClick={() => scrollToProductSection("previews")}
              className="inline-flex items-center gap-1.5"
              aria-label={`Оценка товара ${itemRating.average.toFixed(1)} из 5, ${itemRating.count} ${pluralReviews(itemRating.count)}`}
            >
              <span className="inline-flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    weight={i < Math.round(itemRating.average) ? "fill" : "regular"}
                    className={
                      i < Math.round(itemRating.average)
                        ? "text-amber-400"
                        : "text-line-strong"
                    }
                  />
                ))}
              </span>
              <b>{itemRating.average.toFixed(1)}</b>
              <span className="text-mute underline underline-offset-2">
                {itemRating.count} {pluralReviews(itemRating.count)} о товаре
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => scrollToProductSection("previews")}
              className="text-mute underline-offset-2 hover:underline"
            >
              Пока нет отзывов о товаре
            </button>
          )}
        </div>
      </div>

      {/* Who sells it, with the marks a buyer checks first. */}
      <Link
        href={supplierHref ?? performerUrl(supplier.actor_id)}
        className="group flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/50"
      >
        {supplier.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveFileUrl(supplier.logo) || supplier.logo}
            alt=""
            className="size-11 shrink-0 rounded-xl border border-line bg-card object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-tile text-[14px] font-semibold text-white">
            {sellerInitials(supplier.display_name)}
          </span>
        )}
        <span className="grid min-w-0 flex-1">
          <span className="text-[12px] text-mute">Продавец</span>
          <CompanyName
            name={supplier.display_name}
            verified={supplier.verification_status === "verified"}
            tier={supplier.reputation_tier}
            plan={supplier.subscription_plan}
            size="md"
          />
          <span className="truncate text-[12.5px] text-mute">
            {[
              supplier.reviews_count > 0
                ? `★ ${supplier.rating.toFixed(1)} поставщик`
                : null,
              supplier.city,
              supplier.completed_contracts ? `сделок: ${supplier.completed_contracts}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Профиль компании"}
          </span>
        </span>
        <CaretRight className="size-4 shrink-0 text-faint group-hover:text-brand-600" aria-hidden />
      </Link>
      <div className="flex flex-wrap gap-2">
        <StatusPill tone="safe" icon={ShieldCheck}>
          Можно оплатить с гарантией площадки
        </StatusPill>
        {supplier.verification_status === "verified" ? (
          <StatusPill tone="brand" icon={SealCheck}>
            Проверенный поставщик
          </StatusPill>
        ) : null}
      </div>

      <div className="border-t border-line pt-5">
        {tiers.length > 1 ? (
          <div className="grid gap-3">
            <div>
              <b className="text-[30px] font-bold leading-none tracking-[-0.02em] tnum text-ink">
                {headline.includes("от") ? headline : `${headline}`}
              </b>
              <p className="mt-1.5 text-[14px] text-mute">
                Минимальный заказ: {moq} {unit}
              </p>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))`,
              }}
            >
              {tiers.map((tier, i) => {
                const on = i === activeIdx
                const range =
                  tier.maxQty != null
                    ? `${tier.minQty}–${tier.maxQty}`
                    : `≥ ${tier.minQty}`
                return (
                  <div
                    key={`${tier.minQty}-${tier.price}`}
                    className={cn(
                      "rounded-xl px-3 py-2.5",
                      on ? "bg-brand-50 ring-1 ring-brand-600" : "bg-canvas",
                    )}
                  >
                    <span
                      className={cn(
                        "block text-[12.5px]",
                        on ? "font-semibold text-brand-700" : "text-mute",
                      )}
                    >
                      {range} {unit}
                    </span>
                    <b
                      className={cn(
                        "block text-[17px] font-bold tnum",
                        on && "text-brand-700",
                      )}
                    >
                      {formatCurrency(tier.price, currency)}
                    </b>
                  </div>
                )
              })}
            </div>
          </div>
        ) : unitPrice != null ? (
          <div>
            <b className="text-[30px] font-bold leading-none tracking-[-0.02em] tnum text-ink">
              {formatCurrency(unitPrice, currency)}
            </b>
            <p className="mt-1.5 text-[14px] text-mute">
              Минимальный заказ: {moq} {unit}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-canvas p-4">
            <b className="text-[24px] font-bold">Цена по запросу</b>
            <p className="mt-1 text-[13.5px] text-mute">
              Поставщик пришлёт коммерческое предложение под ваш объём.
            </p>
          </div>
        )}
      </div>

      {keyAttrs.length > 0 && (
        <div className="grid gap-3 border-t border-line pt-5">
          <h2 className="text-[17px] font-bold text-ink">
            Основные характеристики
          </h2>
          <dl className="grid grid-cols-2 gap-y-4 rounded-xl bg-canvas p-4 sm:grid-cols-3">
            {keyAttrs.map((attr, i) => (
              <div
                key={attr.id}
                className={cn(
                  "px-3",
                  i % 3 !== 0 && "sm:border-l sm:border-line",
                  i % 2 !== 0 && "border-l border-line sm:border-l-0",
                  i % 2 !== 0 && i % 3 !== 0 && "sm:border-l",
                )}
              >
                <dt className="text-[13px] text-mute">{attr.name}</dt>
                <dd className="mt-0.5 line-clamp-2 text-[15px] font-bold text-ink">
                  {attr.value}
                </dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={() => scrollToProductSection("pspecs")}
            className="justify-self-start text-[13.5px] font-semibold underline underline-offset-2"
          >
            Все характеристики ({attributes.length})
          </button>
        </div>
      )}
    </div>
  )
}

const sellerInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"

const pluralReviews = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "отзыв"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "отзыва"
  return "отзывов"
}
