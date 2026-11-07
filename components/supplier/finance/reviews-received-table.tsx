"use client"

import type { Review } from "@/types"
import { formatReviewAuthor } from "@/lib/review-party"
import { ReviewCardList } from "@/components/reviews/review-card-list"

type ReviewsReceivedTableProps = {
  reviews: Review[]
  getReviewerName: (reviewerActorId: number) => string
  getContractTitle: (contractId: number) => string
}

/** Reviews buyers left about the supplier, as cards, newest first. */
export const ReviewsReceivedTable = ({ reviews, getReviewerName, getContractTitle }: ReviewsReceivedTableProps) => {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  if (sorted.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Отзывов пока нет</p>
  }
  return (
    <ReviewCardList
      label="Отзывы заказчиков"
      items={sorted.map((review) => {
        const { primary, secondary } = formatReviewAuthor(review, getReviewerName(review.reviewer_actor_id))
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          party: { primary, secondary },
          deal: { title: getContractTitle(review.contract_id), href: `/supplier/contracts/${review.contract_id}` },
        }
      })}
    />
  )
}
