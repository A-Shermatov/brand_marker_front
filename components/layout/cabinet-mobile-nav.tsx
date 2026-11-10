"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type MobileTab = {
  href?: string
  label: string
  Icon: PhosphorIcon
  match?: (pathname: string) => boolean
  badge?: number
  onClick?: () => void
  isMore?: boolean
}

type CabinetMobileNavProps = {
  tabs: MobileTab[]
  moreOpen?: boolean
}

export function CabinetMobileNav({ tabs, moreOpen }: CabinetMobileNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      aria-label="Разделы"
    >
      {tabs.map((tab) => {
        const active = tab.isMore
          ? Boolean(moreOpen)
          : tab.match
            ? tab.match(pathname)
            : tab.href
              ? tab.href === pathname ||
                (tab.href !== "/" && pathname.startsWith(tab.href))
              : false

        const className = cn(
          "relative grid h-[60px] content-center justify-items-center gap-0.5",
          active ? "text-brand-700" : "text-mute",
        )

        const inner = (
          <>
            <tab.Icon weight={active ? "fill" : "regular"} className="size-6" aria-hidden />
            <span className={cn("text-[11px]", active ? "font-semibold text-ink" : "font-medium")}>
              {tab.label}
            </span>
            {tab.badge && tab.badge > 0 ? (
              <span
                key={tab.badge}
                className="absolute top-1.5 left-1/2 ml-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white ring-2 ring-card bm-pop"
              >
                {tab.badge}
              </span>
            ) : null}
          </>
        )

        if (tab.onClick || tab.isMore) {
          return (
            <button
              key={tab.label}
              type="button"
              className={className}
              onClick={tab.onClick}
              aria-label={tab.label}
            >
              {inner}
            </button>
          )
        }

        return (
          <Link key={tab.label} href={tab.href!} className={className}>
            {inner}
          </Link>
        )
      })}
    </nav>
  )
}
