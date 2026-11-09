"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  FileTextIcon as FileText,
  MagnifyingGlassIcon as MagnifyingGlass,
  PlusIcon as Plus,
} from "@phosphor-icons/react/dist/ssr"
import { useQueries } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ListPagination } from "@/components/list-pagination"
import {
  PageEmptyState,
  PageFrame,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
import { useAuthStore } from "@/lib/store/auth-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUrlTab } from "@/hooks/use-url-tab"
import { getActorId } from "@/lib/auth-display"
import {
  BUYER_RFQ_V5_TABS,
  BUYER_RFQ_STATUS_FILTER_VALUES,
  getRfqStatusesForBuyerFilter,
  type BuyerRfqStatusFilter,
} from "@/lib/buyer-rfq-display"
import {
  RFQ_TYPE_FILTER_VALUES,
  filterRfqsByType,
  matchesRfqSearch,
  type RfqTypeFilter,
} from "@/lib/rfq-list-search"
import { RfqList } from "@/components/cabinet/rfq/rfq-list"
import { isApiEnabled } from "@/lib/api/config"
import { useRfqsQuery } from "@/hooks/api/use-rfqs-query"
import { proposalsApi } from "@/lib/api/proposals"
import { proposalKeys } from "@/hooks/api/use-proposals-query"
import {
  emptyBuyerNavCounts,
  useBuyerNavCounts,
  useMarkNavSectionSeen,
} from "@/hooks/api/use-nav-counts-query"

const MyRfqsContent = () => {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const searchParams = useSearchParams()
  const queryFromUrl = searchParams.get("q") ?? ""
  const [searchInput, setSearchInput] = useState(queryFromUrl)
  useEffect(() => {
    setSearchInput(queryFromUrl)
  }, [queryFromUrl])
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const [statusFilter, setStatusFilter] = useUrlTab<BuyerRfqStatusFilter>(
    "status",
    BUYER_RFQ_STATUS_FILTER_VALUES,
    "all",
  )
  const [typeFilter, setTypeFilter] = useUrlTab<RfqTypeFilter>(
    "type",
    RFQ_TYPE_FILTER_VALUES,
    "all",
  )
  const getRfqsByBuyerTab = useRfqsStore((s) => s.getRfqsByBuyerTab)
  const getProposalsForRfq = useProposalsStore((s) => s.getProposalsForRfq)
  const useApi = isApiEnabled()
  const navCounts = useBuyerNavCounts(useApi).data ?? emptyBuyerNavCounts()
  useMarkNavSectionSeen("buyer", "rfqs")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, typeFilter])

  const { data: apiRfqs, isLoading } = useRfqsQuery(statusFilter, hydrated && useApi, {
    page,
    q: debouncedSearch || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  })

  const localAll = hydrated ? getRfqsByBuyerTab(actorId, "all") : []
  const localRfqs = hydrated ? getRfqsByBuyerTab(actorId, statusFilter) : []

  const rfqs = useMemo(() => {
    if (useApi) return apiRfqs?.items ?? []
    return filterRfqsByType(
      localRfqs.filter((rfq) => matchesRfqSearch(rfq, debouncedSearch)),
      typeFilter,
    )
  }, [useApi, apiRfqs, localRfqs, debouncedSearch, typeFilter])

  const totalPages = useApi ? (apiRfqs?.total_pages ?? 0) : 1
  const hasFilters = Boolean(debouncedSearch) || typeFilter !== "all" || statusFilter !== "all"

  const tabCounts = useMemo(() => {
    if (useApi) {
      return {
        all: undefined as number | undefined,
        quotes: navCounts.rfqs,
        deal: undefined as number | undefined,
        draft: undefined as number | undefined,
        closed: undefined as number | undefined,
        archived: undefined as number | undefined,
      }
    }
    const typed = filterRfqsByType(
      localAll.filter((rfq) => matchesRfqSearch(rfq, debouncedSearch)),
      typeFilter,
    )
    const count = (tab: BuyerRfqStatusFilter) => {
      const statuses = getRfqStatusesForBuyerFilter(tab)
      if (statuses === null) return typed.length
      return typed.filter((r) => statuses.includes(r.status)).length
    }
    return {
      all: count("all"),
      quotes: count("quotes"),
      deal: count("deal"),
      draft: count("draft"),
      closed: count("closed"),
      archived: count("archived"),
    }
  }, [useApi, localAll, debouncedSearch, typeFilter, navCounts.rfqs])

  const proposalQueries = useQueries({
    queries: (useApi ? rfqs : []).map((rfq) => ({
      queryKey: proposalKeys.forRfq(rfq.id),
      queryFn: () => proposalsApi.listForRfq(rfq.id),
      enabled: hydrated && useApi,
    })),
  })

  const getProposalCount = (rfqId: string) => {
    if (!useApi) return getProposalsForRfq(rfqId).length
    const index = rfqs.findIndex((r) => r.id === rfqId)
    return proposalQueries[index]?.data?.items?.length ?? 0
  }

  return (
    <PageFrame>
      {/* One row: status first, then type and search. The section title and the
          "Новая заявка" button already sit in the cabinet header and sidebar. */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SegmentedControl
          value={statusFilter}
          options={BUYER_RFQ_V5_TABS.map((tab) => {
            const count = tabCounts?.[tab.value]
            return count == null ? tab : { ...tab, count }
          })}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          ariaLabel="Статус заявки"
        />
        <label className="sr-only" htmlFor="rfq-type">
          Тип заявки
        </label>
        <select
          id="rfq-type"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
          className="h-10 rounded-lg border border-line bg-card px-3 text-[14px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
        >
          <option value="all">Товары и услуги</option>
          <option value="product">Только товары</option>
          <option value="service">Только услуги</option>
        </select>
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlass
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"
            aria-hidden
          />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Название или номер заявки"
            className="h-10 bg-card pl-10"
            aria-label="Поиск по заявкам"
          />
        </div>
      </div>

      {useApi && isLoading ? (
        <PageSurface className="animate-pulse p-12">
          <div className="mx-auto h-4 w-1/3 rounded bg-secondary" />
        </PageSurface>
      ) : rfqs.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<FileText />}
            title={hasFilters ? "Заявки не найдены" : "Заявок нет"}
            description={
              hasFilters
                ? "Измените поиск или фильтры."
                : "Создайте заявку — это займёт 3 минуты."
            }
          />
          {!hasFilters ? (
            <div className="flex justify-center pb-10">
              <Button asChild size="lg">
                <Link href="/customer/rfqs/new">
                  <Plus size={17} /> Новая заявка
                </Link>
              </Button>
            </div>
          ) : null}
        </PageSurface>
      ) : (
        <RfqList rfqs={rfqs} getProposalCount={getProposalCount} />
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  )
}

export default function MyRfqsPage() {
  return (
    <Suspense fallback={null}>
      <MyRfqsContent />
    </Suspense>
  )
}
