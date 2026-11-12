"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AdminEscrowContent } from "@/components/admin/finance/escrow-list-panel"
import { AdminFinanceContent } from "@/components/admin/finance/finance-list-panel"
import { AdminMerchantBalancesContent } from "@/components/admin/finance/merchant-balances-panel"
import { PageFrame } from "@/components/layout"

const PageSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

/**
 * Payments, money held under guarantee, sellers' accounts, and subscriptions
 * («?view=billing»). The tabs themselves are in the section header.
 */
const Money = () => {
  const tab = useSearchParams().get("tab")
  if (tab === "escrow") return <AdminEscrowContent embedded={false} />
  if (tab === "merchants") return <AdminMerchantBalancesContent embedded={false} />
  return <AdminFinanceContent embedded={false} />
}

export default function AdminFinancePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Money />
    </Suspense>
  )
}
