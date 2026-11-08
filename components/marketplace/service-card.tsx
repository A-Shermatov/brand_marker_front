"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ClockIcon as Clock, CrownIcon as Crown } from "@phosphor-icons/react/dist/ssr"
import { CompanyName } from "@/components/bm"
import type { MarketplaceService } from "@/types/marketplace"
import { getIcon } from "@/lib/icon-map"
import { serviceUrl } from "@/lib/marketplace-routes"

type ServiceCardProps = {
  service: MarketplaceService
  /** Where the card leads; the public product page by default. */
  href?: string
  /** Buttons under the card (cart, price request); they sit above the card link. */
  actions?: ReactNode
}

const isVipBadge = (label: string) => /vip|премиум|топ/i.test(label)

const isRequestPrice = (price: string) =>
  /запрос|договорённост/i.test(price)

export const ServiceCard = ({ service, href, actions }: ServiceCardProps) => {
  const Icon = getIcon(service.icon)
  const detailHref = href ?? serviceUrl(service.id)
  const [imageBroken, setImageBroken] = useState(false)
  const showImage = Boolean(service.imageUrl) && !imageBroken
  const showVip = Boolean(service.badge && isVipBadge(service.badge.label))
  const requestPrice = isRequestPrice(service.price)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_10px_24px_-12px_rgba(28,28,26,.18)]">
      <Link
        href={detailHref}
        className="relative aspect-square w-full overflow-hidden bg-canvas"
        aria-label={service.title}
      >
        {showImage ? (
          <Image
            src={service.imageUrl!}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <span className={`absolute inset-0 grid place-items-center ${service.iconBg}`}>
            <Icon size={36} weight="duotone" className="text-faint" aria-hidden />
          </span>
        )}
        {showVip ? (
          <span
            className="absolute right-2 top-2 inline-flex h-5 items-center gap-1 rounded-md bg-gradient-to-r from-[#F6D365] to-[#E9A73B] px-1.5 text-[11px] font-bold tracking-wide text-[#4A3000]"
            title="VIP‑поставщик"
          >
            <Crown className="size-3" aria-hidden />
            VIP
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="min-h-[40px] text-[14.5px] leading-snug text-ink">
          <Link
            href={detailHref}
            className="after:absolute after:inset-0 hover:text-brand-700"
          >
            <span className="line-clamp-2">{service.title}</span>
          </Link>
        </h3>

        {requestPrice ? (
          <b className="text-[15.5px] font-semibold text-ink">Цена по запросу</b>
        ) : (
          <b className="text-[17px] font-semibold tracking-[-0.01em] text-ink tnum">
            {service.price}
          </b>
        )}

        {service.moqLabel ? (
          <p className="text-[13px] text-mute">{service.moqLabel}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
          <CompanyName
            name={service.provider || "…"}
            verified={service.verified}
            tier={service.providerTier}
            plan={service.providerPlan}
            size="sm"
            nameClassName="text-[12.5px] font-medium text-ink-soft"
            className="relative z-10"
          />
          {!service.verified ? (
            <span title="Компания на проверке" className="relative z-10 inline-flex">
              <Clock size={16} className="shrink-0 text-amber-600" aria-label="Компания на проверке" />
            </span>
          ) : null}
        </div>
        {actions ? <div className="relative z-10 grid gap-2 pt-1">{actions}</div> : null}
      </div>
    </article>
  )
}
