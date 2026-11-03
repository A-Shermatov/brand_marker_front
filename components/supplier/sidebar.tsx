"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import {
  ChatsCircleIcon,
  HandshakeIcon,
  HouseIcon,
  PlusIcon,
  SealCheckIcon,
  StarIcon,
  StorefrontIcon,
  TrayIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"
import { CabinetNavLink } from "@/components/layout/cabinet-nav-link"
import {
  initialsOf,
  SidebarAccount,
  SidebarSection,
  SidebarSupport,
  SidebarTop,
} from "@/components/layout/cabinet-sidebar-parts"
import { Button } from "@/components/ui/button"
import { useSupportChat } from "@/components/support/support-chat-context"
import {
  emptySupplierNavCounts,
  useSupplierNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"
import { useAuthStore } from "@/lib/store/auth-store"
import { matchHub, SUPPLIER_HUBS } from "@/lib/cabinet-nav"

const ICONS: Record<string, PhosphorIcon> = {
  home: HouseIcon,
  leads: TrayIcon,
  deals: HandshakeIcon,
  products: StorefrontIcon,
  messages: ChatsCircleIcon,
  tariff: SealCheckIcon,
}

export default function SupplierSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const countsQuery = useSupplierNavCounts()
  const counts = countsQuery.data ?? emptySupplierNavCounts()
  const marks = useSupplierMarks()
  const { openSupport } = useSupportChat()
  const activeHub = matchHub(SUPPLIER_HUBS, pathname, "/supplier")

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
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Меню кабинета">
      <SidebarTop onClose={onNavigate} />

      <SidebarAccount
        href="/supplier/company"
        name={companyName}
        role="Кабинет поставщика"
        initials={initialsOf(companyName, "ПС")}
        verified={marks.verified}
        tier={marks.tier}
        plan={marks.plan}
        onClick={onNavigate}
      />

      <Button asChild className="mb-3 w-full">
        <Link href="/supplier/catalog/new" onClick={onNavigate}>
          <PlusIcon weight="bold" className="size-4" />
          Добавить товар
        </Link>
      </Button>

      <SidebarSection>
        {SUPPLIER_HUBS.map((hub) => (
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
          href="/supplier/customers"
          label="Заказчики"
          icon={UsersThreeIcon}
          active={pathname.startsWith("/supplier/customers")}
          onClick={onNavigate}
          quiet
        />
        <CabinetNavLink
          href="/supplier/reviews"
          label="Отзывы"
          icon={StarIcon}
          active={pathname.startsWith("/supplier/reviews")}
          onClick={onNavigate}
          quiet
        />
      </SidebarSection>

      <div className="mt-auto pt-6">
        <SidebarSupport
          onClick={() => {
            openSupport()
            onNavigate?.()
          }}
        />
      </div>
    </nav>
  )
}
