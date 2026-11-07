"use client"

import { PackageIcon as Package } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { formatItemPricing } from "@/lib/item-display"
import { resolveFileUrl } from "@/lib/file-url"
import type { ItemPricing, PricingType } from "@/types"
import type { MediaFieldRow } from "@/components/supplier/catalog/media-fields"
import type { PricingFieldValues } from "@/components/supplier/catalog/pricing-fields"

type CatalogDraftPreviewProps = {
  title: string
  media: MediaFieldRow[]
  pricing: PricingFieldValues
  className?: string
}

const toItemPricing = (pricing: PricingFieldValues): ItemPricing => {
  const pricingType = pricing.pricing_type as PricingType
  return {
    id: 0,
    item_id: 0,
    pricing_type: pricingType,
    currency: pricing.currency,
    fixed_price:
      pricingType === "fixed" && pricing.fixed_price
        ? Number(pricing.fixed_price)
        : null,
    hourly_rate:
      pricingType === "hourly" && pricing.hourly_rate
        ? Number(pricing.hourly_rate)
        : null,
    monthly_rate:
      pricingType === "monthly" && pricing.monthly_rate
        ? Number(pricing.monthly_rate)
        : null,
    tiers: pricingType === "tiered" ? pricing.tiers : [],
  }
}

export const CatalogDraftPreview = ({
  title,
  media,
  pricing,
  className,
}: CatalogDraftPreviewProps) => {
  const photo = media.find((m) => m.media_type === "image" && m.file_url)
  const photoUrl = photo ? resolveFileUrl(photo.file_url) : null
  const priceLabel = formatItemPricing(toItemPricing(pricing))

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-card",
        className,
      )}
    >
      <div className="aspect-[4/3] grid place-items-center overflow-hidden bg-canvas">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Package className="size-10 text-mute" aria-hidden />
        )}
      </div>
      <div className="grid gap-1 p-3">
        <span className="line-clamp-2 min-h-[36px] text-[13.5px] font-semibold leading-snug">
          {title.trim() || (
            <span className="font-normal text-mute">Название товара</span>
          )}
        </span>
        <span className="text-[13px]">
          {priceLabel !== "—" ? (
            <b className="text-[16px]">{priceLabel}</b>
          ) : (
            <span className="text-mute">Цена не указана</span>
          )}
        </span>
      </div>
    </div>
  )
}
