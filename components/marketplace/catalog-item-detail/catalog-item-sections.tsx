"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SealCheckIcon as BadgeCheck, FileTextIcon as FileText, FlagIcon as Flag, MapPinIcon as MapPin, StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import type {
  ItemAttribute,
  ItemMedia,
  ItemPricing,
  PublicSupplier,
  Review,
} from "@/types"
import { resolveFileUrl } from "@/lib/file-url"
import { findAttrValue, getPricingMoq } from "@/lib/item-display"
import { loginRedirect, performerUrl } from "@/lib/marketplace-routes"
import { CatalogItemReviews } from "@/components/marketplace/catalog-item-detail/catalog-item-reviews"
import { Button } from "@/components/ui/button"
import { scrollToProductSection } from "@/lib/product-scroll"
import { cn } from "@/lib/utils"

const ANCHORS = [
  ["pspecs", "Характеристики"],
  ["ppack", "Упаковка и доставка"],
  ["previews", "Отзывы"],
  ["psup", "Поставщик"],
  ["pdesc", "Описание"],
] as const

export { scrollToProductSection }

type CatalogItemSectionsProps = {
  description: string | null
  attributes: ItemAttribute[]
  media: ItemMedia[]
  pricing: ItemPricing | null
  supplier: PublicSupplier
  reviews: Review[]
  reviewsLoading?: boolean
  unit?: string
  itemId: number
  canReport: boolean
  isAuthenticated: boolean
  onReport: () => void
}

export const CatalogItemSections = ({
  description,
  attributes,
  media,
  pricing,
  supplier,
  reviews,
  reviewsLoading = false,
  unit = "шт",
  itemId,
  canReport,
  isAuthenticated,
  onReport,
}: CatalogItemSectionsProps) => {
  const [active, setActive] = useState<string>("pspecs")
  const sortedAttrs = [...attributes].sort((a, b) => a.sort_order - b.sort_order)
  const documents = media
    .filter((m) => m.media_type === "document")
    .sort((a, b) => a.sort_order - b.sort_order)
  const moq = getPricingMoq(pricing)
  const lead =
    findAttrValue(attributes, ["срок", "доставка", "отгрузк", "lead"]) ?? null
  const warranty =
    findAttrValue(attributes, ["гарантия", "warranty"]) ?? null
  const packDesc =
    findAttrValue(attributes, ["упаковк", "pack"]) ?? null
  const loginHref = loginRedirect(`/services/${itemId}`)
  const supplierHref = performerUrl(supplier.actor_id)
  const verified = supplier.verification_status === "verified"

  useEffect(() => {
    const ids = ANCHORS.map(([id]) => id)
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const top = visible[0]
        if (top?.target.id) setActive(top.target.id)
      },
      {
        rootMargin: "-120px 0px -55% 0px",
        threshold: [0.15, 0.35, 0.55],
      },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid min-w-0 gap-10">
      <div className="sticky top-[68px] z-20 -mx-4 border-b border-line bg-canvas px-4 lg:mx-0 lg:px-0">
        <div className="no-scrollbar flex gap-6 overflow-x-auto" role="navigation" aria-label="Разделы товара">
          {ANCHORS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToProductSection(id)}
              className={cn(
                "h-12 shrink-0 border-b-2 text-[14.5px] font-semibold transition-colors",
                active === id
                  ? "border-ink text-ink"
                  : "border-transparent text-ink/70 hover:border-ink hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section id="pspecs" className="scroll-mt-36 grid gap-4">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
          Основные характеристики
        </h2>
        {sortedAttrs.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-5 text-[15px] text-mute">
            Характеристики не указаны.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <dl className="grid md:grid-cols-2">
              {sortedAttrs.map((attr, i) => (
                <div
                  key={attr.id}
                  className={cn(
                    "grid grid-cols-[42%_58%] border-b border-line",
                    i % 2 === 0 && "md:border-r",
                  )}
                >
                  <dt className="bg-canvas px-4 py-3.5 text-[14.5px] text-ink/75">
                    {attr.name}
                  </dt>
                  <dd className="px-4 py-3.5 text-[14.5px] font-semibold text-ink">
                    {attr.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      <section id="ppack" className="scroll-mt-36 grid gap-4">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
          Упаковка и сроки отгрузки
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid content-start gap-3 rounded-2xl border border-line bg-white p-5">
            <b className="text-[16px]">Упаковка</b>
            <p className="text-[15px] text-ink">
              {packDesc ?? "Продавец не указал — уточните в чате"}
            </p>
          </div>
          <div className="grid content-start gap-3 rounded-2xl border border-line bg-white p-5">
            <b className="text-[16px]">Сроки отгрузки</b>
            <p className="text-[15px] text-ink">{lead ?? "—"}</p>
            <b className="mt-2 text-[16px]">Доставка</b>
            <p className="text-[15px] text-ink">
              {supplier.city ? `из ${supplier.city}` : "по договорённости"}
              {warranty ? ` · гарантия ${warranty}` : ""}
            </p>
            <p className="text-[13.5px] text-mute">
              Минимальный заказ: {moq} {unit}
            </p>
          </div>
        </div>
      </section>

      <section id="previews" className="scroll-mt-36 grid gap-5">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
          Рейтинги и отзывы
        </h2>
        <div className="grid gap-5 rounded-2xl border border-line bg-white p-5 md:p-6">
          {supplier.reviews_count > 0 ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <b className="text-[52px] font-bold leading-none tnum">
                {supplier.rating.toFixed(1)}
              </b>
              <div className="grid gap-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="inline-flex items-center gap-0.5" aria-hidden>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={
                          i < Math.round(supplier.rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-line"
                        }
                      />
                    ))}
                  </span>
                  <span className="text-[13.5px] text-mute">
                    на основе {supplier.reviews_count}{" "}
                    {pluralReviews(supplier.reviews_count)} ·{" "}
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
                      только подтверждённые сделки
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          <CatalogItemReviews
            reviews={reviews}
            isLoading={reviewsLoading}
            bare
          />
        </div>
      </section>

      <section id="psup" className="scroll-mt-36 grid gap-4">
        <h2 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
          Информация о поставщике
        </h2>
        <div className="grid gap-5 rounded-2xl bg-surface-muted p-5 md:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid size-16 place-items-center rounded-xl border border-line bg-white text-[20px] font-bold text-ink">
              {supplier.display_name
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("") || "BM"}
            </span>
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={supplierHref}
                  className="text-left text-[18px] font-bold underline underline-offset-2"
                >
                  {supplier.display_name}
                </Link>
                {verified && (
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                    <BadgeCheck size={16} aria-hidden />
                    Проверен
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-[14px] text-ink/75">
                <MapPin size={16} aria-hidden />
                {supplier.city ?? "—"}, Таджикистан
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <Star
                  size={14}
                  className="fill-amber-400 text-amber-400"
                  aria-hidden weight="fill"
                />
                {supplier.rating.toFixed(1)}
                <span className="font-normal text-mute">
                  ({supplier.reviews_count})
                </span>
              </div>
            </div>
          </div>
          {supplier.description ? (
            <div className="grid gap-4 rounded-2xl bg-white p-5">
              <b className="text-[16px]">Обзор компании</b>
              <p className="text-[14.5px] text-ink/80">{supplier.description}</p>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-12 w-full rounded-full">
              <Link href={supplierHref}>Профиль компании</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-full">
              <Link href={supplierHref}>Другие товары</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="pdesc" className="scroll-mt-36 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
            Описание товара от поставщика
          </h2>
          {canReport &&
            (isAuthenticated ? (
              <button
                type="button"
                onClick={onReport}
                className="inline-flex items-center gap-1.5 text-[13.5px] text-ink/75 underline underline-offset-2 hover:text-ink"
              >
                <Flag size={16} aria-hidden />
                Сообщить о нарушении
              </button>
            ) : (
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1.5 text-[13.5px] text-ink/75 underline underline-offset-2 hover:text-ink"
              >
                <Flag size={16} aria-hidden />
                Сообщить о нарушении
              </Link>
            ))}
        </div>
        <div className="grid gap-5 rounded-2xl border border-line bg-white p-5 md:p-7">
          {description ? (
            <p className="text-[15.5px] leading-relaxed text-ink whitespace-pre-wrap">
              {description}
            </p>
          ) : (
            <p className="text-[15px] text-mute">Описание не указано.</p>
          )}
          {documents.length > 0 && (
            <div className="grid gap-2 border-t border-line pt-5">
              <b className="text-[16px]">Документы и сертификаты</b>
              <ul className="grid gap-2 sm:grid-cols-2">
                {documents.map((doc) => {
                  const url = resolveFileUrl(doc.file_url)
                  return (
                    <li
                      key={doc.id}
                      className="flex items-center gap-3 rounded-xl bg-canvas px-4 py-3 text-[14.5px]"
                    >
                      <FileText className="size-5 shrink-0 text-mute" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{doc.file_name}</span>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 font-semibold text-brand-700 hover:underline"
                        >
                          Открыть
                        </a>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

const pluralReviews = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "отзыв"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "отзыва"
  return "отзывов"
}
