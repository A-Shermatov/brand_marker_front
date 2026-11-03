"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  ADMIN_HUBS,
  ADMIN_SECTION_TITLE,
  ADMIN_SUBTABS,
  BUYER_HUBS,
  BUYER_SECTION_TITLE,
  BUYER_SUBTABS,
  matchHub,
  matchSubtab,
  SUPPLIER_HUBS,
  SUPPLIER_SECTION_TITLE,
  SUPPLIER_SUBTABS,
  type CabinetRole,
  type CabinetSubtab,
  type SectionMeta,
} from "@/lib/cabinet-nav"
import { cn } from "@/lib/utils"

type SectionHubProps = {
  role: CabinetRole
  /** Optional badge counts keyed by subtab id */
  badges?: Record<string, number>
}

const CONFIG = {
  buyer: {
    hubs: BUYER_HUBS,
    subtabs: BUYER_SUBTABS,
    titles: BUYER_SECTION_TITLE,
    home: "/customer",
  },
  supplier: {
    hubs: SUPPLIER_HUBS,
    subtabs: SUPPLIER_SUBTABS,
    titles: SUPPLIER_SECTION_TITLE,
    home: "/supplier",
  },
  admin: {
    hubs: ADMIN_HUBS,
    subtabs: ADMIN_SUBTABS,
    titles: ADMIN_SECTION_TITLE,
    home: "/admin",
  },
} as const

const roleForPath = (pathname: string): CabinetRole | null => {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin"
  if (pathname === "/supplier" || pathname.startsWith("/supplier/")) return "supplier"
  if (pathname === "/customer" || pathname.startsWith("/customer/")) return "buyer"
  return null
}

const resolveSection = (role: CabinetRole, pathname: string, search: string) => {
  const cfg = CONFIG[role]
  const hub = matchHub(cfg.hubs, pathname, cfg.home)
  if (!hub) return null
  const tabs = cfg.subtabs[hub.id]
  if (!tabs?.length) return null
  const active = matchSubtab(tabs, pathname, search)
  // Only list pages own the section header; a deal or a dispute opened from
  // the list gets its own title and a back link instead of a second heading.
  const isRoot = Boolean(
    active &&
      [active.href.split("?")[0], ...(active.match ?? [])].some((p) => p === pathname),
  )
  return { hub, tabs, active, isRoot, meta: cfg.titles[hub.id] as SectionMeta | undefined }
}

/**
 * True when the current page sits under a section header with subtabs, so its
 * own H1 would repeat the section title.
 */
export const isSectionHubRoot = (pathname: string): boolean => {
  const role = roleForPath(pathname)
  if (!role) return false
  return Boolean(resolveSection(role, pathname, "")?.isRoot)
}

export function useInSectionHub(): boolean {
  return isSectionHubRoot(usePathname())
}

/** Section H1 + underline subtabs for merged cabinet hubs. */
export function SectionHub({ role, badges }: SectionHubProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = resolveSection(role, pathname, searchParams.toString())
  if (!section?.isRoot) return null
  const { hub, tabs, active, meta } = section

  return (
    <div className="mb-6">
      {meta ? (
        <div className="mb-1">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            {meta.title}
          </h1>
          {meta.description ? (
            <p className="mt-1 text-[14.5px] text-mute">{meta.description}</p>
          ) : null}
        </div>
      ) : null}
      <div
        role="tablist"
        aria-label={meta?.title ?? hub.label}
        className="mt-4 flex gap-5 overflow-x-auto border-b border-line no-scrollbar"
      >
        {tabs.map((tab: CabinetSubtab) => {
          const on = active?.id === tab.id
          const badge = badges?.[tab.id] ?? 0
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={on}
              className={cn(
                "-mb-px inline-flex h-10 shrink-0 items-center gap-2 border-b-2 text-[14.5px] transition-colors",
                on
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent font-medium text-mute hover:text-ink",
              )}
            >
              {tab.label}
              {badge > 0 ? (
                <span
                  className={cn(
                    "grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold text-white tnum",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
