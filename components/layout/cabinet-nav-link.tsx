import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type CabinetNavLinkProps = {
  href: string
  label: string
  icon: PhosphorIcon
  active?: boolean
  badge?: number
  onClick?: () => void
  badgeTone?: "brand" | "danger"
  /** Secondary links under «Ещё» */
  quiet?: boolean
}

/** Sidebar item: neutral active state, filled icon in the brand colour. */
export function CabinetNavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
  onClick,
  badgeTone = "brand",
  quiet = false,
}: CabinetNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors",
        quiet ? "h-9 text-[13.5px]" : "h-10 text-[14.5px]",
        active
          ? "bg-surface-muted font-semibold text-ink"
          : "font-medium text-ink-soft hover:bg-surface-muted/70 hover:text-ink",
      )}
    >
      <Icon
        weight={active ? "fill" : "regular"}
        className={cn(
          "shrink-0",
          quiet ? "size-[17px]" : "size-[19px]",
          active ? "text-brand-600" : "text-mute group-hover:text-ink-soft",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span
          className={cn(
            "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold tnum",
            badgeTone === "danger" ? "bg-red-600 text-white" : "bg-brand-600 text-white",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  )
}
