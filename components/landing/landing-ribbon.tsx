"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import { CompanyName } from "@/components/bm"
import { isApiEnabled } from "@/lib/api/config"
import { usePublicCatalogQuery } from "@/hooks/api/use-public-query"
import { useMappedMarketplaceServices } from "@/hooks/api/use-supplier-name"
import { getFeaturedServices } from "@/lib/mock/marketplace-services"
import { getIcon } from "@/lib/icon-map"
import { serviceUrl, servicesUrl } from "@/lib/marketplace-routes"
import type { MarketplaceService } from "@/types/marketplace"

/** One product in the ribbon: picture, name, price, who sells it. */
function RibbonCard({ service, hidden }: { service: MarketplaceService; hidden?: boolean }) {
  const [broken, setBroken] = useState(false)
  const Icon = getIcon(service.icon)
  const picture = Boolean(service.imageUrl) && !broken
  return (
    <Link
      href={serviceUrl(service.id)}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group flex w-[300px] shrink-0 items-center gap-3 rounded-2xl border border-line bg-card p-2.5 pr-4 transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-[0_10px_24px_-14px_rgb(0_80_200/0.45)]"
    >
      <span className="relative size-[68px] shrink-0 overflow-hidden rounded-xl bg-canvas">
        {picture ? (
          <Image
            src={service.imageUrl!}
            alt=""
            fill
            unoptimized
            sizes="68px"
            className="object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className={`absolute inset-0 grid place-items-center ${service.iconBg}`}>
            <Icon size={26} weight="duotone" className="text-faint" aria-hidden />
          </span>
        )}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-[14px] font-medium text-ink group-hover:text-brand-700">{service.title}</span>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink tnum">{service.price}</span>
        <CompanyName
          name={service.provider || "…"}
          verified={service.verified}
          tier={service.providerTier}
          plan={service.providerPlan}
          size="sm"
          nameClassName="text-[12.5px] font-medium text-mute"
        />
      </span>
    </Link>
  )
}

/** A row that drifts sideways forever; the second copy closes the loop. */
function Lane({ items, reverse }: { items: MarketplaceService[]; reverse?: boolean }) {
  return (
    <div className="bm-ribbon-lane flex w-max gap-3" data-reverse={reverse || undefined}>
      {items.map((s) => (
        <RibbonCard key={s.id} service={s} />
      ))}
      {items.map((s) => (
        <RibbonCard key={`copy-${s.id}`} service={s} hidden />
      ))}
    </div>
  )
}

/**
 * Right under the hero: what is on sale now, drifting past in two lanes.
 * Hover or focus stops it; with reduced motion it is a plain scrollable row.
 */
export function LandingRibbon() {
  const useApi = isApiEnabled()
  const { data } = usePublicCatalogQuery(undefined, undefined, useApi, { pageSize: 16, sort: "rating" })
  const apiItems = useMappedMarketplaceServices(useApi ? data?.items : null, { limit: 16 })
  const items = useMemo(() => (useApi ? apiItems : getFeaturedServices(12)), [useApi, apiItems])
  if (items.length < 4) return null

  const half = Math.ceil(items.length / 2)
  const lanes = [items.slice(0, half), items.slice(half)].filter((lane) => lane.length >= 2)

  return (
    <section aria-label="Товары и услуги на площадке" className="border-b border-line bg-card py-8">
      <div className="mx-auto mb-5 flex max-w-[1200px] items-end justify-between gap-4 px-4 lg:px-8">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Сейчас на площадке</h2>
          <p className="mt-0.5 text-[14.5px] text-mute">
            Товары и услуги проверенных поставщиков. Нажмите на карточку, чтобы открыть предложение.
          </p>
        </div>
        <Link
          href={servicesUrl()}
          className="inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline"
        >
          Весь каталог
          <ArrowRightIcon className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="bm-ribbon grid gap-3">
        {lanes.map((lane, i) => (
          <Lane key={i} items={lane} reverse={i === 1} />
        ))}
      </div>
    </section>
  )
}
