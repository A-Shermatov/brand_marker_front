import { StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import type { SideReputation } from "@/types"
import { pluralRu } from "@/lib/format"
import { cn } from "@/lib/utils"

const SIDE_TITLES: Record<string, string> = {
  supplier: "Как поставщик",
  buyer: "Как покупатель",
}

const deals = (count: number) =>
  `${count} ${pluralRu(count, "сделка", "сделки", "сделок")}`

const SIDE_HINTS: Record<string, string> = {
  supplier: "качество и сроки",
  buyer: "оплата и приёмка",
}

/**
 * Two reputations for a company that both sells and buys. They are not averaged:
 * a supplier is judged on quality and deadlines, a buyer on paying and accepting.
 */
export const SideReputationList = ({
  reputation,
  className,
}: {
  reputation: SideReputation[] | null | undefined
  className?: string
}) => {
  const items = (reputation ?? []).filter((r) => SIDE_TITLES[r.side])
  if (items.length < 2) return null
  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Репутация по ролям">
      {items.map((item) => (
        <li
          key={item.side}
          className="grid gap-0.5 rounded-xl border border-line bg-card px-3.5 py-2.5"
        >
          <span className="text-[12.5px] text-mute">
            {SIDE_TITLES[item.side]}, {SIDE_HINTS[item.side]}
          </span>
          <span className="flex items-center gap-1.5 text-[14px]">
            {item.rating != null && item.reviews_count > 0 ? (
              <>
                <Star className="size-4 text-amber-400" weight="fill" aria-hidden />
                <b className="tnum">{item.rating.toFixed(1).replace(".", ",")}</b>
                <span className="text-mute">
                  {`${item.reviews_count} ${pluralRu(item.reviews_count, "отзыв", "отзыва", "отзывов")}, ${deals(item.completed_deals)}`}
                </span>
              </>
            ) : (
              <span className="text-mute">{`Пока без отзывов, ${deals(item.completed_deals)}`}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}
