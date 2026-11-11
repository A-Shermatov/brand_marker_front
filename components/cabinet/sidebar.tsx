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
  emptyBuyerNavCounts,
  useBuyerNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { useBuyerMarks } from "@/hooks/use-buyer-marks"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCartStore } from "@/lib/store/cart-store"
import { BUYER_HUBS, hubsFor, matchHub } from "@/lib/cabinet-nav"

export default function CustomerSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const countsQuery = useBuyerNavCounts()
  const counts = countsQuery.data ?? emptyBuyerNavCounts()
  const { openSupport } = useSupportChat()
  const marks = useBuyerMarks()
  const cartLines = useCartStore((s) => s.items.length)
  // A private person has no company to manage: the menu follows the profile
  // the person works from right now.
  const { active } = useSideProfiles("buyer")
  const kind = hydrated ? (active?.kind ?? null) : null
  const hubs = hubsFor(BUYER_HUBS, kind)
  const activeHub = matchHub(hubs, pathname, "/customer")

  const badgeFor = (keys?: string[]) => {
    if (!hydrated || !keys?.length) return 0
    let n = 0
    for (const key of keys) {
      if (key === "messages") n += counts.messages
      if (key === "rfqs") n += counts.rfqs_new
      if (key === "deals") n += counts.deals_new
      if (key === "approvals") n += counts.approvals_new
      if (key === "cart") n += cartLines
    }
    return n
  }

  const companyName =
    marks.title ?? (hydrated && user?.company ? user.company : "Покупатель")

  return (
    <LayoutGroup id={onNavigate ? "sheet" : "rail"}>
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Меню кабинета">
      <SidebarTop onClose={onNavigate} />

      <SidebarAccount
        href={kind === "company" ? "/customer/company" : "/customer/profile"}
        name={companyName}
        role="Кабинет покупателя"
        initials={initialsOf(companyName, "ПК")}
        verified={marks.verified}
        tier={marks.tier}
        onClick={onNavigate}
      />

      <Button asChild className={RAIL_ACTION}>
        <Link href="/customer/rfqs/new" onClick={onNavigate}>
          <PlusIcon weight="bold" className="size-4" />
          Новая заявка
        </Link>
      </Button>

      <CabinetMenu
        hubs={hubs}
        activeId={activeHub?.id}
        icons={HUB_ICONS.buyer}
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
