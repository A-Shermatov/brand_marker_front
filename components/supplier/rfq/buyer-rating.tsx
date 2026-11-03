import { StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import { formatRating } from "@/lib/format"

type BuyerRatingProps = {
  rating: number
  compact?: boolean
}

export const BuyerRating = ({ rating, compact }: BuyerRatingProps) => {
  // A zero is "no reviews yet", not a bad score.
  if (!rating || rating <= 0) {
    return (
      <span className={`text-mute ${compact ? "text-xs" : "text-sm"}`}>Пока без оценок</span>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <Star size={compact ? 12 : 14} className="text-amber-500 fill-amber-500 flex-shrink-0" weight="fill" />
      <span className={`font-semibold text-foreground tnum ${compact ? "text-xs" : "text-sm"}`}>
        {formatRating(rating)}
      </span>
    </div>
  )
}
