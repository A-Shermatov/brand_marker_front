"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IndividualQueuePanel } from "@/components/admin/clients/individual-queue-panel"
import { CompanyChangesQueuePanel } from "@/components/admin/companies/company-changes-queue-panel"
import { AdminVerificationContent } from "@/components/admin/companies/verification-queue-panel"
import { PageFrame } from "@/components/layout"
import { useAdminVerificationCountsQuery } from "@/hooks/api/use-client-verification-query"
import type { AdminVerificationCounts } from "@/lib/api/client-verification"

type VerificationTab = "suppliers" | "buyers" | "individuals" | "changes"

/** The queues in the order of the tabs, each with the counter that says how many wait. */
const QUEUES: { tab: VerificationTab; countKey: keyof AdminVerificationCounts }[] = [
  { tab: "suppliers", countKey: "supplier_companies" },
  { tab: "buyers", countKey: "buyer_companies" },
  { tab: "individuals", countKey: "individuals" },
  { tab: "changes", countKey: "changes" },
]

const tabHref = (tab: VerificationTab) =>
  tab === "suppliers" ? "/admin/verification" : `/admin/verification?tab=${tab}`

const PageSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const VerificationQueues = () => {
  const router = useRouter()
  const rawTab = useSearchParams().get("tab")
  const wantsFirstBusy = rawTab === "queue"
  const counts = useAdminVerificationCountsQuery(wantsFirstBusy).data

  // «?tab=queue» (the overview links here) opens the first queue where somebody waits.
  useEffect(() => {
    if (!wantsFirstBusy || !counts) return
    const busy = QUEUES.find((queue) => counts[queue.countKey] > 0)?.tab ?? "suppliers"
    router.replace(tabHref(busy))
  }, [counts, router, wantsFirstBusy])

  if (wantsFirstBusy) return <PageSkeleton />
  const tab = QUEUES.find((queue) => queue.tab === rawTab)?.tab ?? "suppliers"

  return (
    <PageFrame>
      {tab === "changes" ? (
        <CompanyChangesQueuePanel embedded />
      ) : tab === "individuals" ? (
        <IndividualQueuePanel />
      ) : (
        <AdminVerificationContent key={tab} embedded actorType={tab === "buyers" ? "buyer" : "supplier"} />
      )}
    </PageFrame>
  )
}

export default function AdminVerificationPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <VerificationQueues />
    </Suspense>
  )
}
