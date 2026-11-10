"use client"

import { Suspense, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { IndividualQueuePanel } from "@/components/admin/clients/individual-queue-panel"
import { CompanyChangesQueuePanel } from "@/components/admin/companies/company-changes-queue-panel"
import { AdminVerificationContent } from "@/components/admin/companies/verification-queue-panel"
import { PageFrame, PageHeader, SegmentedControl } from "@/components/layout"
import { useAdminVerificationCountsQuery } from "@/hooks/api/use-client-verification-query"
import type { AdminVerificationCounts } from "@/lib/api/client-verification"
import { pickHubTab } from "@/lib/admin-hub"

type VerificationHubTab = "suppliers" | "buyers" | "individuals" | "changes"

const HUB_TABS: {
  value: VerificationHubTab
  label: string
  countKey: keyof AdminVerificationCounts
}[] = [
  { value: "suppliers", label: "Поставщики (компании)", countKey: "supplier_companies" },
  { value: "buyers", label: "Покупатели (компании)", countKey: "buyer_companies" },
  { value: "individuals", label: "Физлица", countKey: "individuals" },
  { value: "changes", label: "Изменения данных", countKey: "changes" },
]

const HubSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-12 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const VerificationHub = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const counts = useAdminVerificationCountsQuery().data
  const rawTab = searchParams.get("tab")
  // `?tab=queue` (sidebar badge link) opens the first queue that has pending items.
  const hotTab =
    rawTab === "queue" && counts
      ? HUB_TABS.find((option) => option.value !== "changes" && counts[option.countKey] > 0)
          ?.value ?? null
      : null
  const tab = hotTab ?? pickHubTab(rawTab, HUB_TABS, () => true)

  const setTab = useCallback(
    (next: VerificationHubTab) => {
      router.replace(next === "suppliers" ? pathname : `${pathname}?tab=${next}`, {
        scroll: false,
      })
    },
    [pathname, router],
  )

  return (
    <PageFrame>
      <PageHeader
        title="Проверка клиентов"
        description="Подтверждайте только после сверки всех пунктов"
      />

      <SegmentedControl
        value={tab}
        options={HUB_TABS.map(({ value, label, countKey }) => {
          const count = counts?.[countKey] ?? 0
          return count > 0 ? { value, label, count } : { value, label }
        })}
        onChange={setTab}
        ariaLabel="Разделы проверки клиентов"
      />

      {tab === "changes" ? (
        <CompanyChangesQueuePanel embedded />
      ) : tab === "individuals" ? (
        <IndividualQueuePanel />
      ) : (
        <AdminVerificationContent
          key={tab}
          embedded
          actorType={tab === "buyers" ? "buyer" : "supplier"}
        />
      )}
    </PageFrame>
  )
}

export default function AdminVerificationPage() {
  return (
    <Suspense fallback={<HubSkeleton />}>
      <VerificationHub />
    </Suspense>
  )
}
