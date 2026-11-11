import { RocketLaunchIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { PROMOTED_HINT } from "@/lib/subscription"

/**
 * How a subscriber's card stands out in a list: a warm tint, a warm border and
 * a bar on the left. One look for requests, offers, goods and suppliers, so
 * "this place is paid for" reads the same everywhere. The amber tokens have
 * dark-theme values of their own.
 */
export const promotedCardClass =
  "border-amber-200 bg-amber-50 shadow-[inset_3px_0_0_#F59E0B] hover:border-amber-200"

/** The same tint for a table cell or a column head. */
export const promotedCellClass = "bg-amber-50"

/** True for anything the API marks as placed by a paid plan. */
export const isPromoted = (item: { promoted?: boolean | null } | null | undefined): boolean =>
  Boolean(item?.promoted)

/** The small label on a highlighted card. It says the place is paid for when hovered. */
export function PromotedTag({ className, label = "В топе" }: { className?: string; label?: string }) {
  return (
    <span
      title={PROMOTED_HINT}
      data-testid="promoted-tag"
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 text-[12px] font-semibold text-amber-800",
        className,
      )}
    >
      <RocketLaunchIcon weight="fill" className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
