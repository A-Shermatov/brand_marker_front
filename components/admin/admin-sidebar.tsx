"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import {
  BankIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  ScalesIcon,
  SealCheckIcon,
  SquaresFourIcon,
  UsersIcon,
} from "@phosphor-icons/react/dist/ssr"
import { BrandLogo } from "@/components/bm"
import { CabinetNavLink } from "@/components/layout/cabinet-nav-link"
import {
  emptyAdminNavCounts,
  useAdminNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import {
  ADMIN_HUB_ANY_PERMISSIONS,
  getAdminRoutePermission,
  hasAnyPermission,
  hasPermission,
} from "@/lib/admin-permissions"
import { ADMIN_HUBS, matchHub } from "@/lib/cabinet-nav"
import { useAuthStore } from "@/lib/store/auth-store"

const ICONS: Record<string, PhosphorIcon> = {
  home: SquaresFourIcon,
  verif: SealCheckIcon,
  disputes: ScalesIcon,
  payouts: BankIcon,
  users: UsersIcon,
  audit: ClockCounterClockwiseIcon,
  cats: GearSixIcon,
}

const canSeeHref = (
  user: Parameters<typeof hasPermission>[0],
  href: string,
): boolean => {
  const base = href.split("?")[0] ?? href
  const hub = ADMIN_HUB_ANY_PERMISSIONS[base]
  if (hub) return hasAnyPermission(user, hub)
  const permission = getAdminRoutePermission(base)
  return !permission || hasPermission(user, permission)
}

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const counts = useAdminNavCounts().data ?? emptyAdminNavCounts()
  const activeHub = matchHub(ADMIN_HUBS, pathname, "/admin")

  const badgeFor = (keys?: string[]) => {
    if (!keys?.length) return 0
    let n = 0
    for (const key of keys) {
      if (key === "companies") n += counts.companies
      if (key === "moderation") n += counts.moderation
      if (key === "disputes") n += counts.disputes
      if (key === "chats") n += counts.chats
      if (key === "support") n += counts.support
      if (key === "finance") n += counts.finance
    }
    return n
  }

  const hubs = ADMIN_HUBS.filter((hub) => canSeeHref(user, hub.href))

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Админ-навигация">
      <div className="mb-3 flex h-12 items-center justify-between px-1">
        <BrandLogo small />
        <span className="rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-white">
          Админ
        </span>
      </div>

      <ul className="grid gap-0.5">
        {hubs.map((hub) => (
          <li key={hub.id}>
            <CabinetNavLink
              href={hub.href}
              label={hub.label}
              icon={ICONS[hub.id] ?? SquaresFourIcon}
              active={activeHub?.id === hub.id}
              badge={badgeFor(hub.badgeKeys)}
              badgeTone="danger"
              onClick={onNavigate}
            />
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-line pt-4">
        <p className="mb-1 px-2.5 text-[11.5px] font-medium text-faint">Ещё</p>
        <div className="grid gap-1 text-[13.5px]">
          {[
            { href: "/admin/catalog", label: "Каталог" },
            { href: "/admin/staff", label: "Доступ" },
          ]
            .filter((item) => canSeeHref(user, item.href))
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="rounded-lg px-2.5 py-2 font-medium text-ink-soft hover:bg-surface-muted hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    </nav>
  )
}
