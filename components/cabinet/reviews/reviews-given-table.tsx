"use client"

import Link from "next/link"
import { StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import type { Review } from "@/types"
import { formatReviewParty } from "@/lib/review-party"

type ReviewsGivenTableProps = {
  reviews: Review[]
  getSupplierName: (supplierActorId: number) => string
  getContractTitle: (contractId: number) => string
}

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={14}
        className={
          n <= rating
            ? "text-amber-500 fill-amber-500"
            : "text-muted-foreground/30"
        }
      />
    ))}
  </div>
)

export const ReviewsGivenTable = ({
  reviews,
  getSupplierName,
  getContractTitle,
}: ReviewsGivenTableProps) => {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Вы ещё не оставляли отзывов
      </p>
    )
  }

  return (
    <>
      <div className="hidden md:block overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Исполнитель</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Рейтинг</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Комментарий</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Сделка</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.map((review) => (
              <tr key={review.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  {(() => {
                    const { primary, secondary } = formatReviewParty(
                      review.target,
                      getSupplierName(review.target_actor_id),
                    )
                    return (
                      <Link
                        href={`/customer/suppliers/${review.target_actor_id}`}
                        className="block min-w-0 hover:text-primary"
                      >
                        <p className="font-semibold text-foreground truncate">{primary}</p>
                        {secondary && (
                          <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                        )}
                      </Link>
                    )
                  })()}
                </td>
                <td className="px-4 py-3">
                  <RatingStars rating={review.rating} />
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs">
                  <p className="line-clamp-2">{review.comment ?? "—"}</p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/customer/contracts/${review.contract_id}`}
                    className="text-foreground hover:text-primary font-medium line-clamp-2"
                  >
                    {getContractTitle(review.contract_id)}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="bg-card border border-border rounded-xl p-4">
            <Link
              href={`/customer/suppliers/${review.target_actor_id}`}
              className="text-sm font-bold text-foreground hover:text-primary"
            >
              {getSupplierName(review.target_actor_id)}
            </Link>
            <div className="mt-2">
              <RatingStars rating={review.rating} />
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
            )}
            <Link
              href={`/customer/contracts/${review.contract_id}`}
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              {getContractTitle(review.contract_id)}
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
