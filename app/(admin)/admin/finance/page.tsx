"use client"

import { Suspense, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AdminEscrowContent } from "@/components/admin/finance/escrow-list-panel"
import { AdminFinanceContent } from "@/components/admin/finance/finance-list-panel"
import { AdminMerchantBalancesContent } from "@/components/admin/finance/merchant-balances-panel"
import { PageFrame, PageHeader, SegmentedControl } from "@/components/layout"
import { pickHubTab } from "@/lib/admin-hub"

type FinanceHubTab = "ledger" | "escrow" | "merchants"

const HUB_TABS: { value: FinanceHubTab; label: string }[] = [
  { value: "ledger", label: "Операции" },
  { value: "escrow", label: "На гарантии" },
  { value: "merchants", label: "Мерчанты" },
]

const HubSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-12 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const FinanceHub = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isBilling = searchParams.get("view") === "billing"
  const tab = pickHubTab(searchParams.get("tab"), HUB_TABS, () => true)

  const setTab = useCallback(
    (next: FinanceHubTab) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("page")
      params.delete("query")
      if (next === "escrow" || next === "merchants") {
        params.set("tab", next)
        params.delete("view")
      } else {
        params.delete("tab")
        // Keep billing hub when switching back to ledger from escrow/merchants
        // only if we arrived via billing; otherwise clear alias.
        if (params.get("view") === "billing") {
          /* stay on billing ledger */
        }
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams],
  )

  return (
    <PageFrame>
      <PageHeader
        title={isBilling ? "Подписки и доходы" : "Выплаты"}
        description={
          isBilling
            ? "Тарифы поставщиков, услуги покупателям и комиссия площадки"
            : "Выплаты поставщикам, эскроу и балансы мерчантов Alif"
        }
      />

      {!isBilling ? (
        <SegmentedControl
          value={tab}
          options={HUB_TABS}
          onChange={setTab}
          ariaLabel="Разделы выплат"
        />
      ) : null}

      {isBilling ? (
        <AdminFinanceContent embedded />
      ) : tab === "escrow" ? (
        <AdminEscrowContent embedded />
      ) : tab === "merchants" ? (
        <AdminMerchantBalancesContent embedded />
      ) : (
        <AdminFinanceContent embedded />
      )}
    </PageFrame>
  )
}

export default function AdminFinancePage() {
  return (
    <Suspense fallback={<HubSkeleton />}>
      <FinanceHub />
    </Suspense>
  )
}
