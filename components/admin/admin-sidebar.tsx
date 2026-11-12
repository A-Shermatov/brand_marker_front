"use client"

import { LayoutGroup } from "motion/react"
import { usePathname } from "next/navigation"
import { HUB_ICONS } from "@/lib/cabinet-icons"
import { BrandLogo } from "@/components/bm"
import { CabinetMenu } from "@/components/layout/cabinet-menu"
import {
  emptyAdminNavCounts,
  useAdminNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { adminMenuFor } from "@/lib/admin-permissions"
import type { AdminNavCounts } from "@/lib/api/nav-counts"
import { ADMIN_HUBS, matchHub } from "@/lib/cabinet-nav"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * The admin menu: every section in one list, in three groups — what waits for
 * a decision, the marketplace, the panel itself. A member of staff sees only
 * the sections their role opens; the number next to a queue is what waits in it.
 */
export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const counts = useAdminNavCounts().data ?? emptyAdminNavCounts()
  const activeHub = matchHub(ADMIN_HUBS, pathname, "/admin")

  const badgeFor = (keys?: string[]) =>
    (keys ?? []).reduce((sum, key) => sum + (counts[key as keyof AdminNavCounts] ?? 0), 0)

  return (
    <LayoutGroup id={onNavigate ? "sheet" : "rail"}>
      <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3" aria-label="Админ-навигация">
        <div className="mb-1 flex h-12 shrink-0 items-center justify-between px-1">
          <BrandLogo small />
          <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            Админ
          </span>
        </div>

        <CabinetMenu
          hubs={adminMenuFor(user)}
          activeId={activeHub?.id}
          icons={HUB_ICONS.admin}
          badgeFor={badgeFor}
          badgeTone="danger"
          onNavigate={onNavigate}
        />
      </nav>
    </LayoutGroup>
  )
}
