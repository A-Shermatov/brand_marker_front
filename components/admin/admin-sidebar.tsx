"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandLogo } from "@/components/bm"
import { CabinetNavLink } from "@/components/layout/cabinet-nav-link"
import type { BmIconName } from "@/lib/bm-icons"
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

/** CNAV icons — BrendMarket-v7.2 bank.js */
const ICONS: Record<string, BmIconName> = {
  home: "grid",
  verif: "shieldok",
  disputes: "scale",
  payouts: "bank",
  users: "users",
  audit: "history",
  cats: "settings",
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
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Админ-навигация">
      <div className="mb-3">
        <BrandLogo />
        <p className="mt-2 text-[13px] font-semibold text-mute">
          Панель администратора
        </p>
      </div>

      <ul className="grid gap-0.5">
        {hubs.map((hub) => (
          <li key={hub.id}>
            <CabinetNavLink
              href={hub.href}
              label={hub.label}
              icon={ICONS[hub.id] ?? "grid"}
              active={activeHub?.id === hub.id}
              badge={badgeFor(hub.badgeKeys)}
              badgeTone="danger"
              onClick={onNavigate}
            />
          </li>
        ))}
      </ul>

      <div className="mt-auto border-t border-line pt-4">
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[.08em] text-mute">
          Ещё
        </p>
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
                className="rounded-lg px-3 py-2 font-semibold text-mute hover:bg-canvas hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    </nav>
  )
}
