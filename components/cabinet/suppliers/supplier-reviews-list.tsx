import { StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import type { Review } from "@/types"
import { formatRelativeIso } from "@/lib/format"

type SupplierReviewsListProps = {
  reviews: Review[]
}

export const SupplierReviewsList = ({ reviews }: SupplierReviewsListProps) => {
  if (reviews.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-2">Отзывы</h2>
        <p className="text-sm text-muted-foreground">Отзывов пока нет</p>
      </div>
    )
  }

  const sorted = [...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Отзывы ({reviews.length})
      </h2>
      <div className="space-y-4">
        {sorted.slice(0, 5).map((review) => (
          <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < review.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    }
                  />
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {formatRelativeIso(review.created_at)}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {review.comment}
              </p>
            )}
            {(review.photos?.length || review.helpful_count) ? (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {review.photos?.length ? `Фото: ${review.photos.length}` : null}
                {review.photos?.length && review.helpful_count ? " · " : null}
                {review.helpful_count ? `Полезно: ${review.helpful_count}` : null}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
