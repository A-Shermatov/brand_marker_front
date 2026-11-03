"use client"

import { Suspense, useMemo, useState } from "react"
import { BriefcaseIcon as Briefcase } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { usePublicSuppliersByActor } from "@/hooks/api/use-supplier-name"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUrlTab } from "@/hooks/use-url-tab"
import { getActorId } from "@/lib/auth-display"
import {
  BUYER_CONTRACT_LIST_TABS,
  buyerContractEmptyMessages,
  type BuyerContractListTab,
} from "@/lib/buyer-contract-display"
import { DealList } from "@/components/contracts/deal-list"
import { ListPagination } from "@/components/list-pagination"
import { filterDealsByTab } from "@/lib/process/deal-stages"
import { isApiEnabled } from "@/lib/api/config"
import { useContractsQuery } from "@/hooks/api/use-contracts-query"
import {
  emptyBuyerNavCounts,
  useBuyerNavCounts,
  useMarkNavSectionSeen,
} from "@/hooks/api/use-nav-counts-query"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  SegmentedControl,
} from "@/components/layout"
import type { ContractWithRelations } from "@/types"

const BUYER_CONTRACT_TAB_VALUES = BUYER_CONTRACT_LIST_TABS.map((option) => option.value)

const BuyerContractsContent = () => {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const actorId = getActorId(useAuthStore((s) => s.user))
  const getContractsForBuyer = useContractsStore((s) => s.getContractsForBuyer)
  const [tab, setTab] = useUrlTab<BuyerContractListTab>(
    "tab",
    BUYER_CONTRACT_TAB_VALUES,
    "active",
  )
  const useApi = isApiEnabled()
  const navCounts = useBuyerNavCounts(useApi).data ?? emptyBuyerNavCounts()
  useMarkNavSectionSeen("buyer", "deals")
  const { data: apiContracts, isLoading } = useContractsQuery(hydrated && useApi, { page })

  const allContracts: ContractWithRelations[] = useApi
    ? ((apiContracts?.items ?? []) as ContractWithRelations[])
    : hydrated
      ? getContractsForBuyer(actorId)
      : []
  const totalPages = useApi ? (apiContracts?.total_pages ?? 0) : 1

  const activeCount = useMemo(() => {
    if (useApi) return navCounts.deals
    return filterDealsByTab(allContracts, "active", "buyer").length
  }, [useApi, navCounts.deals, allContracts])
  const completedCount = useMemo(
    () => filterDealsByTab(allContracts, "completed", "buyer").length,
    [allContracts],
  )

  const contracts = filterDealsByTab(allContracts, tab, "buyer")
  const { getName: getSupplierName } = usePublicSuppliersByActor(
    contracts.map((c) => c.supplier_actor_id),
  )

  return (
    <PageFrame>
      <PageHeader
        title="Сделки"
        description="Покупки через гарантию площадки"
      />

      <SegmentedControl
        value={tab}
        options={[
          { value: "active", label: "В работе", count: activeCount },
          { value: "completed", label: "Завершённые", count: completedCount },
        ]}
        onChange={setTab}
        ariaLabel="Фильтр сделок"
      />

      {!hydrated || isLoading || contracts.length === 0 ? (
        <PageEmptyState
          variant="card"
          icon={<Briefcase />}
          title={isLoading ? "Загружаем сделки..." : "Сделок нет"}
          description={!isLoading ? buyerContractEmptyMessages[tab] : undefined}
        />
      ) : (
        <DealList
          contracts={contracts}
          role="buyer"
          getCounterpartName={(c) => getSupplierName(c.supplier_actor_id)}
        />
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  )
}

export default function BuyerContractsPage() {
  return (
    <Suspense fallback={null}>
      <BuyerContractsContent />
    </Suspense>
  )
}
