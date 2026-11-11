"use client"

import { Suspense, useState } from "react"
import { HouseIcon as LayoutDashboard, TrayIcon as Inbox, HandshakeIcon as Briefcase, ChatsCircleIcon as MessageSquare, ListIcon as Menu } from "@phosphor-icons/react/dist/ssr"
import SupplierSidebar from "@/components/supplier/sidebar"
import SupplierTopbar from "@/components/supplier/topbar"
import { CabinetShell } from "@/components/layout/cabinet-shell"
import { CabinetSkeleton } from "@/components/layout/cabinet-skeleton"
import { PageTransition } from "@/components/layout/page-transition"
import { CabinetNotices } from "@/components/company/cabinet-notices"
import { CabinetMobileNav } from "@/components/layout/cabinet-mobile-nav"
import { SectionHub } from "@/components/layout/section-hub"
import { SupportChatProvider } from "@/components/support/support-chat-context"
import { SupportChatWidget } from "@/components/support/support-chat-widget"
import { useCabinetGate } from "@/hooks/use-cabinet-gate"
import { useNotificationsSocket } from "@/hooks/use-notifications-socket"
import {
  emptySupplierNavCounts,
  useSupplierNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { useHydrated } from "@/hooks/use-hydrated"

export default function SupplierShell({ children }: { children: React.ReactNode }) {
  const gate = useCabinetGate("supplier")
  useNotificationsSocket("supplier", gate === "allowed")
  const [moreOpen, setMoreOpen] = useState(false)
  const hydrated = useHydrated()
  const countsQuery = useSupplierNavCounts(gate === "allowed")
  const counts = countsQuery.data ?? emptySupplierNavCounts()

  if (gate !== "allowed") {
    return <CabinetSkeleton />
  }

  return (
    <SupportChatProvider>
      <CabinetShell
        sidebar={<SupplierSidebar />}
        topbar={<SupplierTopbar moreOpen={moreOpen} onMoreOpenChange={setMoreOpen} />}
        sectionHub={
          <Suspense fallback={null}>
            <SectionHub
              role="supplier"
              badges={{
                leads: hydrated ? counts.rfqs_new : 0,
              }}
            />
          </Suspense>
        }
        mobileNav={
          <CabinetMobileNav
            moreOpen={moreOpen}
            tabs={[
              {
                href: "/supplier",
                label: "Главная",
                Icon: LayoutDashboard,
                match: (p) => p === "/supplier",
              },
              {
                href: "/supplier/rfqs?response=open",
                label: "Заявки",
                Icon: Inbox,
                badge: hydrated ? counts.rfqs_new : 0,
                match: (p) => p.startsWith("/supplier/rfqs"),
              },
              {
                href: "/supplier/contracts?tab=active",
                label: "Сделки",
                Icon: Briefcase,
                badge: hydrated ? counts.deals_new : 0,
                match: (p) => p.startsWith("/supplier/contracts"),
              },
              {
                href: "/supplier/messages",
                label: "Чаты",
                Icon: MessageSquare,
                badge: hydrated ? counts.messages : 0,
                match: (p) => p.startsWith("/supplier/messages"),
              },
              {
                label: "Ещё",
                Icon: Menu,
                isMore: true,
                onClick: () => setMoreOpen(true),
              },
            ]}
          />
        }
      >
        <CabinetNotices />
        <PageTransition>{children}</PageTransition>
        <Suspense fallback={null}>
          <SupportChatWidget role="supplier" />
        </Suspense>
      </CabinetShell>
    </SupportChatProvider>
  )
}
