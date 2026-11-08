"use client"

import { Suspense, useState } from "react"
import { HouseIcon as LayoutDashboard, FileTextIcon as FileText, HandshakeIcon as Briefcase, ChatsCircleIcon as MessageSquare, ListIcon as Menu, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import CustomerSidebar from "@/components/cabinet/sidebar"
import CustomerTopbar from "@/components/cabinet/topbar"
import { CabinetShell } from "@/components/layout/cabinet-shell"
import { CabinetMobileNav } from "@/components/layout/cabinet-mobile-nav"
import { SectionHub } from "@/components/layout/section-hub"
import { SupportChatProvider } from "@/components/support/support-chat-context"
import { SupportChatWidget } from "@/components/support/support-chat-widget"
import { useCabinetGate } from "@/hooks/use-cabinet-gate"
import { useNotificationsSocket } from "@/hooks/use-notifications-socket"
import {
  emptyBuyerNavCounts,
  useBuyerNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { useCartStore } from "@/lib/store/cart-store"

export default function CustomerShell({ children }: { children: React.ReactNode }) {
  const gate = useCabinetGate("customer")
  useNotificationsSocket("buyer", gate === "allowed")
  const [moreOpen, setMoreOpen] = useState(false)
  const hydrated = useHydrated()
  const countsQuery = useBuyerNavCounts(gate === "allowed")
  const counts = countsQuery.data ?? emptyBuyerNavCounts()
  const cartLines = useCartStore((s) => s.items.length)

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
        sidebar={<CustomerSidebar />}
        topbar={<CustomerTopbar moreOpen={moreOpen} onMoreOpenChange={setMoreOpen} />}
        sectionHub={
          <Suspense fallback={null}>
            <SectionHub
              role="buyer"
              badges={{
                rfqs: hydrated ? counts.rfqs_new : 0,
                approvals: hydrated ? counts.approvals_new : 0,
                cart: hydrated ? cartLines : 0,
              }}
            />
          </Suspense>
        }
        mobileNav={
          <CabinetMobileNav
            moreOpen={moreOpen}
            tabs={[
              {
                href: "/customer",
                label: "Главная",
                Icon: LayoutDashboard,
                match: (p) => p === "/customer",
              },
              {
                href: "/customer/rfqs?status=quotes",
                label: "Закупки",
                Icon: FileText,
                badge: hydrated ? counts.rfqs_new + counts.approvals_new : 0,
                match: (p) =>
                  p.startsWith("/customer/rfqs") || p.startsWith("/customer/approvals"),
              },
              {
                href: "/customer/contracts?tab=active",
                label: "Сделки",
                Icon: Briefcase,
                badge: hydrated ? counts.deals_new : 0,
                match: (p) =>
                  p.startsWith("/customer/contracts") ||
                  p.startsWith("/customer/payments"),
              },
              {
                href: "/customer/messages",
                label: "Чаты",
                Icon: MessageSquare,
                badge: hydrated ? counts.messages : 0,
                match: (p) => p.startsWith("/customer/messages"),
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
          <SupportChatWidget role="buyer" />
        </Suspense>
      </CabinetShell>
    </SupportChatProvider>
  )
}
