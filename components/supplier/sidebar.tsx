"use client"

import { LayoutGroup } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusIcon } from "@phosphor-icons/react/dist/ssr"
import { HUB_ICONS } from "@/lib/cabinet-icons"
import { CabinetMenu } from "@/components/layout/cabinet-menu"
import {
  initialsOf,
  RAIL_ACTION,
  SidebarAccount,
  SidebarSupport,
  SidebarTop,
} from "@/components/layout/cabinet-sidebar-parts"
import { Button } from "@/components/ui/button"
import { useSupportChat } from "@/components/support/support-chat-context"
import { useSideProfiles } from "@/components/company/profile-switch-menu"
import {
  emptySupplierNavCounts,
  useSupplierNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"
import { useAuthStore } from "@/lib/store/auth-store"
import { hubsFor, matchHub, SUPPLIER_HUBS } from "@/lib/cabinet-nav"

export default function SupplierSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const countsQuery = useSupplierNavCounts()
  const counts = countsQuery.data ?? emptySupplierNavCounts()
  const marks = useSupplierMarks()
  const { openSupport } = useSupportChat()
  // A private person has no company to manage: the menu follows the profile
  // the person works from right now.
  const { active } = useSideProfiles("supplier")
  const kind = hydrated ? (active?.kind ?? null) : null
  const hubs = hubsFor(SUPPLIER_HUBS, kind)
  const activeHub = matchHub(hubs, pathname, "/supplier")

  const badgeFor = (keys?: string[]) => {
    if (!hydrated || !keys?.length) return 0
    let n = 0
    for (const key of keys) {
      if (key === "messages") n += counts.messages
      if (key === "rfqs") n += counts.rfqs_new
      if (key === "deals") n += counts.deals_new
      if (key === "catalog") n += counts.catalog_new
    }
    return n
  }

  const companyName =
    marks.title ?? (hydrated && user?.company ? user.company : "Поставщик")

  return (
    <LayoutGroup id={onNavigate ? "sheet" : "rail"}>
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Меню кабинета">
      <SidebarTop onClose={onNavigate} />

      <SidebarAccount
        href={kind === "company" ? "/supplier/company" : "/supplier/profile"}
        name={companyName}
        role="Кабинет поставщика"
        initials={initialsOf(companyName, "ПС")}
        verified={marks.verified}
        tier={marks.tier}
        onClick={onNavigate}
      />

      <Button asChild className={RAIL_ACTION}>
        <Link href="/supplier/catalog/new" onClick={onNavigate}>
          <PlusIcon weight="bold" className="size-4" />
          Добавить товар
        </Link>
      </Button>

      <CabinetMenu
        hubs={hubs}
        activeId={activeHub?.id}
        icons={HUB_ICONS.supplier}
        badgeFor={badgeFor}
        onNavigate={onNavigate}
      />

      <div className="mt-auto pt-5">
        <SidebarSupport
          onClick={() => {
            openSupport()
            onNavigate?.()
          }}
        />
      </div>
    </nav>
    </LayoutGroup>
  )
}
