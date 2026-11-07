import Link from "next/link"
import { HandshakeIcon, StarIcon } from "@phosphor-icons/react/dist/ssr"
import { CardList, ListCard } from "@/components/layout/card-list"
import { cn } from "@/lib/utils"

export type ReviewCardItem = {
  id: number
  rating: number
  comment: string | null
  /** Who wrote it, or about whom: name, role or company, and a profile link. */
  party: { primary: string; secondary?: string | null; href?: string }
  deal: { title: string; href: string }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?"

export function RatingStars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Оценка ${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          size={size}
          weight={n <= rating ? "fill" : "regular"}
          className={n <= rating ? "text-amber-500" : "text-line-strong"}
          aria-hidden
        />
      ))}
    </span>
  )
}

/** Reviews as cards: who and how many stars on top, the words as a quote, the deal below. */
export function ReviewCardList({ label, items }: { label: string; items: ReviewCardItem[] }) {
  return (
    <CardList label={label}>
      {items.map((item) => {
        const name = (
          <span className="grid min-w-0">
            <span className="truncate text-[15px] font-semibold text-ink">{item.party.primary}</span>
            {item.party.secondary ? (
              <span className="truncate text-[12.5px] text-mute">{item.party.secondary}</span>
            ) : null}
          </span>
        )
        return (
          <ListCard key={item.id} tone={item.rating >= 4 ? "safe" : item.rating <= 2 ? "danger" : "warn"}>
            <div className="grid gap-3 p-4 pl-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-700">
                    {initials(item.party.primary)}
                  </span>
                  {item.party.href ? (
                    <Link href={item.party.href} className="min-w-0 hover:[&_span:first-child]:text-brand-700">
                      {name}
                    </Link>
                  ) : (
                    name
                  )}
                </span>
                <span className="inline-flex items-center gap-2">
                  <RatingStars rating={item.rating} />
                  <b className="text-[14px] font-semibold text-ink tnum">{item.rating}.0</b>
                </span>
              </div>
              <p
                className={cn(
                  "border-l-2 border-line pl-3 text-[15px] leading-relaxed",
                  item.comment ? "text-ink-soft" : "text-mute",
                )}
              >
                {item.comment || "Без комментария"}
              </p>
              <p className="flex items-center gap-2 text-[13.5px] text-mute">
                <HandshakeIcon className="size-4 shrink-0" aria-hidden />
                Сделка:
                <Link href={item.deal.href} className="truncate font-medium text-ink hover:text-brand-700">
                  {item.deal.title}
                </Link>
              </p>
            </div>
          </ListCard>
        )
      })}
    </CardList>
  )
}
