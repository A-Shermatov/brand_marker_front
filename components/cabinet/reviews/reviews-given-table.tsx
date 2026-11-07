"use client"

import type { Review } from "@/types"
import { formatReviewAuthor, formatReviewParty } from "@/lib/review-party"
import { ReviewCardList } from "@/components/reviews/review-card-list"

type ReviewsGivenTableProps = {
  reviews: Review[]
  getSupplierName: (supplierActorId: number) => string
  getContractTitle: (contractId: number) => string
  /** Received reviews: show who wrote it (name, role, company) instead of the target. */
  showAuthor?: boolean
}

/** The buyer's reviews as cards: the supplier, the stars, the words, the deal. */
export const ReviewsGivenTable = ({
  reviews,
  getSupplierName,
  getContractTitle,
  showAuthor = false,
}: ReviewsGivenTableProps) => {
  if (reviews.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Вы ещё не оставляли отзывов</p>
  }
  return (
    <ReviewCardList
      label={showAuthor ? "Отзывы о вас" : "Ваши отзывы"}
      items={reviews.map((review) => {
        const fallback = getSupplierName(review.target_actor_id)
        const { primary, secondary } = showAuthor
          ? formatReviewAuthor(review, fallback)
          : formatReviewParty(review.target, fallback)
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          party: { primary, secondary, href: `/customer/suppliers/${review.target_actor_id}` },
          deal: { title: getContractTitle(review.contract_id), href: `/customer/contracts/${review.contract_id}` },
        }
      })}
    />
  )
}
