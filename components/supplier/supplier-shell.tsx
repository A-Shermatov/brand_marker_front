"use client"

import { Suspense, useState } from "react"
import { HouseIcon as LayoutDashboard, TrayIcon as Inbox, HandshakeIcon as Briefcase, ChatsCircleIcon as MessageSquare, ListIcon as Menu, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import SupplierSidebar from "@/components/supplier/sidebar"
import SupplierTopbar from "@/components/supplier/topbar"
import { CabinetShell } from "@/components/layout/cabinet-shell"
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
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <Loader2 className="animate-spin text-brand-600" size={32} aria-label="Проверка доступа" />
      </div>
    )
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
                match: (p) =>
                  p.startsWith("/supplier/rfqs") || p.startsWith("/supplier/proposals"),
              },
              {
                href: "/supplier/contracts?tab=active",
                label: "Сделки",
                Icon: Briefcase,
                badge: hydrated ? counts.deals_new : 0,
                match: (p) =>
                  p.startsWith("/supplier/contracts") ||
                  p.startsWith("/supplier/finance"),
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
        {children}
        <Suspense fallback={null}>
          <SupportChatWidget role="supplier" />
        </Suspense>
      </CabinetShell>
    </SupportChatProvider>
  )
}
