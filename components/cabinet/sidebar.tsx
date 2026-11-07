"use client"

import { LayoutGroup } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HouseIcon,
  LockKeyIcon,
  PlusIcon,
  ShoppingCartIcon,
  StarIcon,
} from "@phosphor-icons/react/dist/ssr"
import { HUB_ICONS } from "@/lib/cabinet-icons"
import { CabinetNavLink } from "@/components/layout/cabinet-nav-link"
import {
  initialsOf,
  RAIL_ACTION,
  SidebarAccount,
  SidebarSection,
  SidebarSupport,
  SidebarTop,
} from "@/components/layout/cabinet-sidebar-parts"
import { Button } from "@/components/ui/button"
import { useSupportChat } from "@/components/support/support-chat-context"
import {
  emptyBuyerNavCounts,
  useBuyerNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { useBuyerMarks } from "@/hooks/use-buyer-marks"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/lib/store/auth-store"
import { BUYER_HUBS, matchHub } from "@/lib/cabinet-nav"

const ICONS = HUB_ICONS.buyer

export default function CustomerSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const countsQuery = useBuyerNavCounts()
  const counts = countsQuery.data ?? emptyBuyerNavCounts()
  const { openSupport } = useSupportChat()
  const marks = useBuyerMarks()
  const activeHub = matchHub(BUYER_HUBS, pathname, "/customer")

  const badgeFor = (keys?: string[]) => {
    if (!hydrated || !keys?.length) return 0
    let n = 0
    for (const key of keys) {
      if (key === "messages") n += counts.messages
      if (key === "rfqs") n += counts.rfqs_new
      if (key === "deals") n += counts.deals_new
      if (key === "approvals") n += counts.approvals_new
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
        href="/customer/company"
        name={companyName}
        role="Кабинет покупателя"
        initials={initialsOf(companyName, "ПК")}
        verified={marks.verified}
        tier={marks.tier}
        plan={marks.plan}
        onClick={onNavigate}
      />

      <Button asChild className={RAIL_ACTION}>
        <Link href="/customer/rfqs/new" onClick={onNavigate}>
          <PlusIcon weight="bold" className="size-4" />
          Новая заявка
        </Link>
      </Button>

      <SidebarSection>
        {BUYER_HUBS.map((hub) => (
          <CabinetNavLink
            key={hub.id}
            href={hub.href}
            label={hub.label}
            icon={ICONS[hub.id] ?? HouseIcon}
            active={activeHub?.id === hub.id}
            badge={badgeFor(hub.badgeKeys)}
            onClick={onNavigate}
          />
        ))}
      </SidebarSection>

      <SidebarSection label="Ещё" className="mt-4">
        <CabinetNavLink
          href="/services"
          label="Каталог товаров"
          icon={ShoppingCartIcon}
          onClick={onNavigate}
          quiet
        />
        <CabinetNavLink
          href="/customer/reviews"
          label="Отзывы"
          icon={StarIcon}
          active={pathname.startsWith("/customer/reviews")}
          onClick={onNavigate}
          quiet
        />
      </SidebarSection>

      <div className="mt-auto grid gap-2 pt-6">
        <p className="flex gap-2 px-1 text-[12.5px] leading-snug text-mute">
          <LockKeyIcon className="mt-px size-4 shrink-0 text-safe-500" aria-hidden />
          Деньги держит банк‑партнёр. Поставщик получит их после вашей приёмки.
        </p>
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
