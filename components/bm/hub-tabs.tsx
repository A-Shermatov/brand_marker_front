"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export type HubTabItem = {
  href: string
  label: string
  count?: number
  active?: boolean
}

type HubTabsProps = {
  items: HubTabItem[]
  ariaLabel?: string
  className?: string
}

/**
 * Section hub subtabs (CNAV SUBTABS) — pill track like SegmentedControl,
 * but navigates via Link for cabinet section switches.
 */
export function HubTabs({ items, ariaLabel, className }: HubTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-muted p-1 no-scrollbar",
        className,
      )}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          role="tab"
          aria-selected={item.active}
          className={cn(
            "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-md px-3.5 text-[13.5px] font-medium transition-colors",
            item.active
              ? "bg-card text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
              : "text-mute hover:text-ink",
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span
              className={cn(
                "ml-1 text-[12px]",
                item.active ? "text-brand-700" : "text-mute",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  )
}
