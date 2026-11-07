"use client"

import { useState } from "react"
import { ImageIcon } from "@phosphor-icons/react/dist/ssr"
import { formatCurrency } from "@/lib/format"
import { resolveFileUrl } from "@/lib/file-url"
import type { CatalogItemType } from "@/types"
import type { MediaFieldRow } from "@/components/supplier/catalog/media-fields"
import type { PricingFieldValues } from "@/components/supplier/catalog/pricing-fields"

type CatalogItemPreviewCardProps = {
  type: CatalogItemType
  title: string
  unit: string
  moq: string
  media: MediaFieldRow[]
  pricing: PricingFieldValues
}

const lowestPrice = (pricing: PricingFieldValues): number | null => {
  if (pricing.pricing_type === "fixed") {
    const n = Number(pricing.fixed_price)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  if (pricing.pricing_type === "hourly") {
    const n = Number(pricing.hourly_rate)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  if (pricing.pricing_type === "monthly") {
    const n = Number(pricing.monthly_rate)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  const prices = pricing.tiers.map((t) => t.price).filter((p) => p > 0)
  return prices.length ? Math.min(...prices) : null
}

export const CatalogItemPreviewCard = ({
  type,
  title,
  unit,
  moq,
  media,
  pricing,
}: CatalogItemPreviewCardProps) => {
  const [broken, setBroken] = useState(false)
  const cover = media.find((m) => m.media_type === "image" && m.file_url)
  const coverUrl = cover ? resolveFileUrl(cover.file_url) : ""
  const price = lowestPrice(pricing)
  const priceSuffix =
    pricing.pricing_type === "hourly"
      ? " / час"
      : pricing.pricing_type === "monthly"
        ? " / мес"
        : unit
          ? ` / ${unit}`
          : ""

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div className="relative aspect-[4/3] grid place-items-center overflow-hidden bg-canvas">
        {coverUrl && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <ImageIcon className="size-10 text-mute" aria-hidden />
        )}
        {type === "service" ? (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-card px-2 py-0.5 text-[12px] font-semibold text-ink">
            Услуга
          </span>
        ) : null}
      </div>
      <div className="grid gap-1 p-3">
        <span className="min-h-[36px] text-[13.5px] font-semibold leading-snug line-clamp-2">
          {title.trim() || <span className="font-normal text-mute">Название позиции</span>}
        </span>
        {price != null ? (
          <span className="text-[13px]">
            <span className="text-mute">от </span>
            <b className="text-[16px]">{formatCurrency(price, pricing.currency)}</b>
            <span className="text-mute">{priceSuffix}</span>
          </span>
        ) : (
          <span className="text-[13px] text-mute">Цена не указана</span>
        )}
        <span className="text-[12px] text-mute">
          Мин. заказ: {moq.trim() || "—"}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  )
}
