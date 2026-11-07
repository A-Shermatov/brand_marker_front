"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
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

/**
 * Item of the cabinet menu. The current section is a light-blue plate with a
 * blue bar and a filled blue icon; the plate glides to the new item on
 * navigation, so the eye follows where it went.
 */
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
  const reduceMotion = useReducedMotion()
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors",
        quiet ? "h-9 text-[14px]" : "h-10 text-[15px]",
        active
          ? "font-semibold text-brand-700"
          : "font-medium text-rail-mute hover:bg-rail-hover hover:text-rail-ink",
      )}
    >
      {active ? (
        <motion.span
          layoutId="rail-active"
          aria-hidden
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 560, damping: 44 }}
          className="absolute inset-0 rounded-lg bg-rail-active"
        >
          <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-rail-accent" />
        </motion.span>
      ) : null}
      <Icon
        weight={active ? "fill" : "regular"}
        className={cn(
          "relative shrink-0",
          quiet ? "size-[18px]" : "size-5",
          active ? "text-brand-600" : "text-rail-mute group-hover:text-rail-ink",
        )}
        aria-hidden
      />
      <span className="relative min-w-0 flex-1 truncate">{label}</span>
      {badge && badge > 0 ? (
        <span
          className={cn(
            "relative grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold tnum",
            badgeTone === "danger" ? "bg-red-600 text-white" : "bg-brand-600 text-white",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  )
}
