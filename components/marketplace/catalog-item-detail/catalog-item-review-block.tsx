"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { StarIcon as Star, SealCheckIcon } from "@phosphor-icons/react/dist/ssr"
import ReviewDialog, { type ReviewAxisRatings } from "@/components/cabinet/review-dialog"
import { CatalogItemReviews } from "@/components/marketplace/catalog-item-detail/catalog-item-reviews"
import { Button } from "@/components/ui/button"
import { useCreateReviewMutation } from "@/hooks/api/use-reviews-query"
import { publicKeys } from "@/hooks/api/use-public-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { reviewsApi } from "@/lib/api/companies"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"
import type { ItemReviewSummary, PublicSupplier, Review } from "@/types"

type Props = {
  itemId: number
  itemTitle: string
  reviews: Review[]
  summary: ItemReviewSummary | null
  isLoading: boolean
  supplier: PublicSupplier
  supplierHref: string
}

const Stars = ({ value, size = 18 }: { value: number; size?: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-hidden>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        weight={i < Math.round(value) ? "fill" : "regular"}
        className={i < Math.round(value) ? "text-amber-400" : "text-line-strong"}
      />
    ))}
  </span>
)

/**
 * Reviews of this very item first — written by buyers who bought it here —
 * then how the supplier is rated across all its deals.
 */
export function CatalogItemReviewBlock({
  itemId,
  itemTitle,
  reviews,
  summary,
  isLoading,
  supplier,
  supplierHref,
}: Props) {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const isBuyer = Boolean(hydrated && user && (user.role === "customer" || user.capabilities?.buyer))
  const qc = useQueryClient()
  const createReview = useCreateReviewMutation()
  const [open, setOpen] = useState(false)

  const eligibility = useQuery({
    queryKey: ["buyer-reviews", "item-eligibility", itemId],
    queryFn: () => reviewsApi.itemEligibility(itemId),
    enabled: isBuyer && isApiEnabled() && itemId > 0,
  })
  const contractId = eligibility.data?.contract_id ?? null
  const targetId = eligibility.data?.target_actor_id ?? null

  const submit = (data: ReviewAxisRatings) => {
    if (!contractId || !targetId) return
    createReview.mutate(
      { contract_id: contractId, target_actor_id: targetId, ...data },
      {
        onSuccess: () => {
          setOpen(false)
          void qc.invalidateQueries({ queryKey: publicKeys.itemReviews(itemId) })
          void qc.invalidateQueries({ queryKey: ["buyer-reviews", "item-eligibility", itemId] })
        },
      },
    )
  }

  const count = summary?.count ?? 0
  const average = summary?.average ?? 0

  return (
    <section id="previews" className="scroll-mt-36 grid gap-5" aria-labelledby="previews-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="previews-title" className="text-[22px] font-bold tracking-[-0.01em] text-ink">
          Отзывы о товаре
        </h2>
        {contractId ? (
          <Button type="button" onClick={() => setOpen(true)}>
            Оставить отзыв
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 rounded-2xl border border-line bg-card p-5 md:p-6">
        {count > 0 ? (
          <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8">
            <div className="grid justify-items-start gap-1.5">
              <b className="text-[52px] font-bold leading-none tnum">{average.toFixed(1)}</b>
              <Stars value={average} />
              <span className="text-[13.5px] text-mute">
                {count} {pluralReviews(count)} · только покупатели этого товара
              </span>
            </div>
            <ul className="grid gap-1.5" aria-label="Распределение оценок">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = summary?.distribution[String(star)] ?? 0
                const share = count ? Math.round((n / count) * 100) : 0
                return (
                  <li key={star} className="grid grid-cols-[28px_minmax(0,1fr)_32px] items-center gap-2 text-[13px]">
                    <span className="inline-flex items-center gap-0.5 text-mute">
                      {star}
                      <Star size={12} weight="fill" className="text-amber-400" aria-hidden />
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${share}%` }} />
                    </span>
                    <span className="text-right text-mute tnum">{n}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : !isLoading ? (
          <p className="text-[14.5px] text-ink-soft">
            У этого товара пока нет отзывов. Оставить отзыв может покупатель, который получил его
            через площадку — после завершения сделки.
          </p>
        ) : null}

        {contractId ? (
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-[14px] text-brand-900">
            Вы покупали этот товар. Расскажите другим, как он вам — это займёт минуту.
          </p>
        ) : null}

        {count > 0 || isLoading ? <CatalogItemReviews reviews={reviews} isLoading={isLoading} bare /> : null}
      </div>

      {/* The supplier's own score, from all its finished deals. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-line bg-surface-muted p-5">
        <div className="grid gap-0.5">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-mute">Оценка поставщика</span>
          <span className="text-[16px] font-bold text-ink">{supplier.display_name}</span>
        </div>
        {supplier.reviews_count > 0 ? (
          <div className="flex items-center gap-2.5">
            <b className="text-[28px] font-bold leading-none tnum">{supplier.rating.toFixed(1)}</b>
            <div className="grid gap-0.5">
              <Stars value={supplier.rating} size={15} />
              <span className="text-[12.5px] text-mute">
                {supplier.reviews_count} {pluralReviews(supplier.reviews_count)} по всем сделкам
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[14px] text-mute">Пока без отзывов</span>
        )}
        {supplier.verification_status === "verified" ? (
          <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
            <SealCheckIcon size={16} weight="fill" aria-hidden />
            Проверен
          </span>
        ) : null}
        <Link
          href={supplierHref}
          className={cn("ml-auto text-[14px] font-semibold text-brand-700 hover:underline")}
        >
          Все отзывы о поставщике
        </Link>
      </div>

      {contractId ? (
        <ReviewDialog
          open={open}
          onOpenChange={setOpen}
          counterpartName={`${itemTitle} · ${supplier.display_name}`}
          counterpartLabel="товаром и поставщиком"
          onUploadPhoto={(file) => reviewsApi.uploadMedia(file)}
          onConfirm={submit}
        />
      ) : null}
    </section>
  )
}

const pluralReviews = (n: number) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "отзыв"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "отзыва"
  return "отзывов"
}
