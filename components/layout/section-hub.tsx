"use client"

import Link from "next/link"
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr"
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
import { HUB_ICONS } from "@/lib/cabinet-icons"
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

/**
 * Section header for merged cabinet hubs, in one row: the section's menu icon
 * and title, then its tabs. Kept short so the list starts high on the screen;
 * the section's one-line description is the title's tooltip.
 */
export function SectionHub({ role, badges }: SectionHubProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const section = resolveSection(role, pathname, searchParams.toString())
  if (!section?.isRoot) return null
  const { hub, tabs, active, meta } = section
  const Icon = HUB_ICONS[role][hub.id]

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-3">
      {meta ? (
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-tile text-white">
              <Icon weight="fill" className="size-5" aria-hidden />
            </span>
          ) : null}
          <h1
            title={meta.description || undefined}
            className="truncate text-[21px] font-semibold leading-tight tracking-[-0.02em] text-ink"
          >
            {meta.title}
          </h1>
        </div>
      ) : null}
      <div
        role="tablist"
        aria-label={meta?.title ?? hub.label}
        className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1 no-scrollbar"
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
                "inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-[14px] transition-colors",
                on
                  ? "bg-brand-600 font-semibold text-white"
                  : "font-medium text-mute hover:bg-brand-50 hover:text-brand-700",
              )}
            >
              {tab.label}
              {badge > 0 ? (
                <span
                  className={cn(
                    "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold tnum",
                    on ? "bg-card text-brand-700" : "bg-brand-600 text-white",
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

/** What each kind of page below a section is called in the trail. */
const PAGE_NAMES: [RegExp, string][] = [
  [/\/rfqs\/new$/, "Новая заявка"],
  [/\/rfqs\/[^/]+\/edit$/, "Изменение заявки"],
  [/\/rfqs\/[^/]+\/proposals$/, "Предложения"],
  [/\/rfqs\/[^/]+$/, "Заявка"],
  [/\/contracts\/[^/]+$/, "Сделка"],
  [/\/disputes\/[^/]+$/, "Спор"],
  [/\/proposals\/[^/]+$/, "КП"],
  [/\/suppliers\/[^/]+$/, "Поставщик"],
  [/\/customers\/[^/]+$/, "Заказчик"],
  [/\/users\/[^/]+$/, "Пользователь"],
  [/\/compan(y|ies)\/new$/, "Новая компания"],
  [/\/compan(y|ies)\/[^/]+$/, "Компания"],
  [/\/catalog\/new$/, "Новый товар"],
  [/\/catalog\/[^/]+$/, "Товар"],
  [/\/listings\/new$/, "Новое объявление"],
  [/\/listings\/[^/]+$/, "Объявление"],
  [/\/return$/, "Результат оплаты"],
  [/\/finance\/[^/]+$/, "Операция"],
  [/\/moderation\/[^/]+\/[^/]+$/, "Проверка"],
]

export type Crumb = { label: string; href?: string }

/**
 * Where a page deeper than a section list sits: section, tab, then each step
 * below it (a deal, its proposals…). Empty on the section lists themselves,
 * which already carry the section title and tabs.
 */
export function cabinetCrumbs(pathname: string): Crumb[] {
  const role = roleForPath(pathname)
  if (!role) return []
  const cfg = CONFIG[role]
  const hub = matchHub(cfg.hubs, pathname, cfg.home)
  if (!hub || hub.id === "home") return []
  const tabs = cfg.subtabs[hub.id] ?? []
  const tab = tabs.length ? matchSubtab(tabs, pathname, "") : null

  // The list the page belongs to: the longest prefix of the tab or the hub.
  const prefixes = [
    ...(tab ? [tab.href.split("?")[0]!, ...(tab.match ?? [])] : []),
    ...hub.match,
  ].filter((p) => pathname === p || pathname.startsWith(`${p}/`))
  const root = prefixes.sort((a, b) => b.length - a.length)[0]
  if (!root || root === pathname) return []

  const crumbs: Crumb[] = [{ label: hub.label, href: hub.href }]
  if (tab && tab.label !== hub.label) crumbs.push({ label: tab.label, href: tab.href })
  const rest = pathname.slice(root.length).split("/").filter(Boolean)
  let path = root
  for (const segment of rest) {
    path = `${path}/${segment}`
    const name = PAGE_NAMES.find(([pattern]) => pattern.test(path))?.[1]
    // Steps without a name of their own (an id inside a longer path) are skipped.
    if (name) crumbs.push({ label: name, href: path })
  }
  const last = crumbs[crumbs.length - 1]!
  crumbs[crumbs.length - 1] = { label: last.label }
  return crumbs
}

export function useCabinetCrumbs(): Crumb[] {
  return cabinetCrumbs(usePathname())
}

/**
 * Trail above the title of a page inside a section, so it is always clear
 * where the page is and how to step back. On phones only the step back shows.
 */
export function CabinetBreadcrumbs() {
  const crumbs = useCabinetCrumbs()
  if (crumbs.length < 2) return null
  const parent = crumbs[crumbs.length - 2]!
  return (
    <nav aria-label="Вы здесь" className="mb-3">
      <Link
        href={parent.href!}
        className="inline-flex h-8 -ml-2 items-center gap-1 rounded-md pl-1.5 pr-2.5 text-[13.5px] font-medium text-mute hover:bg-surface-muted hover:text-ink sm:hidden"
      >
        <CaretLeftIcon className="size-4" aria-hidden />
        {parent.label}
      </Link>
      <ol className="hidden flex-wrap items-center gap-1 text-[13.5px] sm:flex">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? <CaretRightIcon className="size-3.5 text-faint" aria-hidden /> : null}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="rounded-md px-1.5 py-1 font-medium text-mute transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="rounded-md bg-brand-50 px-2 py-1 font-semibold text-brand-700">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
