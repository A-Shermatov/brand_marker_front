"use client"

import { Suspense, useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AdminContractsContent } from "@/components/admin/contracts/contracts-list-panel"
import { AdminDisputesContent } from "@/components/admin/disputes/disputes-list-panel"
import { PageFrame, PageHeader, SegmentedControl } from "@/components/layout"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import { pickHubTab, type AdminHubTabOption } from "@/lib/admin-hub"

type DisputesHubTab = "disputes" | "contracts"

const ALL_TABS: AdminHubTabOption<DisputesHubTab>[] = [
  { value: "disputes", label: "Споры", permission: "admin_disputes.view" },
  { value: "contracts", label: "Контракты", permission: "admin_contracts.view" },
]

const HubSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-12 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const DisputesHub = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canDisputes = useAdminPermission("admin_disputes.view")
  const canContracts = useAdminPermission("admin_contracts.view")

  const can = useCallback(
    (permission: string) => {
      if (permission === "admin_disputes.view") return canDisputes
      if (permission === "admin_contracts.view") return canContracts
      return false
    },
    [canContracts, canDisputes],
  )

  const tabs = useMemo(
    () => ALL_TABS.filter((tab) => !tab.permission || can(tab.permission)),
    [can],
  )

  const tab = pickHubTab(searchParams.get("tab"), tabs.length ? tabs : ALL_TABS, can)

  const setTab = useCallback(
    (next: DisputesHubTab) => {
      const params = new URLSearchParams()
      params.set("tab", next)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router],
  )

  return (
    <PageFrame>
      <PageHeader
        title="Споры"
        description="Деньги по спорной сделке остаются на гарантии до решения"
        actions={
          <SegmentedControl
            value={tab}
            options={tabs}
            onChange={setTab}
            ariaLabel="Споры и контракты"
          />
        }
      />

      {tab === "contracts" ? (
        <AdminContractsContent embedded />
      ) : (
        <AdminDisputesContent embedded />
      )}
    </PageFrame>
  )
}

export default function AdminDisputesPage() {
  return (
    <Suspense fallback={<HubSkeleton />}>
      <DisputesHub />
    </Suspense>
  )
}
