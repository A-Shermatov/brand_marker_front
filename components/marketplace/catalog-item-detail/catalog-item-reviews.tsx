"use client"

import { useMemo, useState } from "react"
import { StarIcon as Star, ThumbsUpIcon as ThumbsUp } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import type { Review } from "@/types"
import { formatRelativeIso } from "@/lib/format"
import { resolveFileUrl } from "@/lib/file-url"
import { reviewsApi, supplierReviewsApi } from "@/lib/api/companies"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { cn } from "@/lib/utils"
import { formatReviewAuthor } from "@/lib/review-party"

type CatalogItemReviewsProps = {
  reviews: Review[]
  isLoading?: boolean
  /** Render without outer card/heading (for tabs). */
  bare?: boolean
  /** Which API to use for helpful votes when logged in. */
  voteAs?: "buyer" | "supplier" | null
}

export const CatalogItemReviews = ({
  reviews,
  isLoading = false,
  bare = false,
  voteAs = "buyer",
}: CatalogItemReviewsProps) => {
  const [withPhotoOnly, setWithPhotoOnly] = useState(false)
  const [local, setLocal] = useState<Review[]>(reviews)
  const [votingId, setVotingId] = useState<number | null>(null)

  // Keep in sync when parent refreshes list
  const source = useMemo(() => {
    if (local.length === reviews.length) {
      const sameIds = local.every((r, i) => r.id === reviews[i]?.id)
      if (sameIds) return local
    }
    return reviews
  }, [local, reviews])

  if (isLoading) {
    const body = (
      <div className="animate-pulse space-y-3">
        <div className="h-16 rounded-lg bg-secondary" />
        <div className="h-16 rounded-lg bg-secondary" />
      </div>
    )
    if (bare) return body
    return (
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-foreground">Отзывы о поставщике</h2>
        {body}
      </section>
    )
  }

  if (reviews.length === 0) {
    const empty = (
      <p className="text-[15px] text-mute">
        Отзывов пока нет. Отзыв можно оставить только после завершённой сделки —
        поэтому им можно доверять.
      </p>
    )
    if (bare) return empty
    return (
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="mb-2 text-base font-bold text-foreground">Отзывы о поставщике</h2>
        {empty}
      </section>
    )
  }

  const sorted = [...source].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  const filtered = withPhotoOnly
    ? sorted.filter((r) => (r.photos?.length ?? 0) > 0)
    : sorted

  const handleHelpful = async (review: Review) => {
    if (!isApiEnabled() || !voteAs || review.viewer_voted) return
    setVotingId(review.id)
    try {
      const api = voteAs === "supplier" ? supplierReviewsApi : reviewsApi
      const updated = await api.voteHelpful(review.id)
      setLocal((prev) => {
        const base = prev.length ? prev : reviews
        return base.map((r) => (r.id === review.id ? { ...r, ...updated } : r))
      })
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось отметить отзыв"))
    } finally {
      setVotingId(null)
    }
  }

  const list = (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setWithPhotoOnly(false)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            !withPhotoOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-mute",
          )}
        >
          Все
        </button>
        <button
          type="button"
          onClick={() => setWithPhotoOnly(true)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            withPhotoOnly
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-mute",
          )}
        >
          С фото
        </button>
      </div>

      {filtered.slice(0, 8).map((review) => (
        <article
          key={review.id}
          className="grid gap-2 border-t border-line pt-4 first:border-t-0 first:pt-0"
        >
          <div className="flex justify-between gap-3">
            <div className="flex items-center gap-0.5" role="img" aria-label={`Оценка ${review.rating} из 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={15}
                  weight={i < review.rating ? "fill" : "regular"}
                  className={i < review.rating ? "text-amber-400" : "text-line-strong"}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-[13px] text-mute">
              {formatRelativeIso(review.created_at)}
            </span>
          </div>
          {(() => {
            const { primary, secondary } = formatReviewAuthor(review, "Покупатель")
            return (
              <p className="text-[13.5px] text-mute">
                <b className="font-semibold text-ink">{primary}</b>
                {secondary ? `, ${secondary}` : null}
              </p>
            )
          })()}
          {review.comment && (
            <p className="text-[15px] leading-relaxed text-ink">{review.comment}</p>
          )}
          {(review.photos?.length ?? 0) > 0 ? (
            <div className="flex flex-wrap gap-2">
              {review.photos!.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.file_url}
                  src={resolveFileUrl(photo.file_url)}
                  alt=""
                  className="size-16 rounded-lg object-cover border border-line"
                />
              ))}
            </div>
          ) : null}
          <div>
            <button
              type="button"
              disabled={!voteAs || review.viewer_voted || votingId === review.id}
              onClick={() => void handleHelpful(review)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors",
                review.viewer_voted
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-mute hover:bg-secondary",
              )}
            >
              <ThumbsUp size={12} />
              Полезно ({review.helpful_count ?? 0})
            </button>
          </div>
        </article>
      ))}
      {filtered.length === 0 ? (
        <p className="text-[14px] text-mute">Нет отзывов с фото.</p>
      ) : null}
    </div>
  )

  if (bare) return list

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-base font-bold text-foreground">
        Отзывы о поставщике ({reviews.length})
      </h2>
      {list}
    </section>
  )
}
