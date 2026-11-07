"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUrlTab } from "@/hooks/use-url-tab"
import { getActorId } from "@/lib/auth-display"
import { getRfqBuyerName } from "@/lib/buyer-display"
import { isApiEnabled } from "@/lib/api/config"
import { isRfqInvitedFor, OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import { filterRfqsBySource, sortSupplierBoardRfqs } from "@/lib/rfq-board"
import {
  SUPPLIER_SOURCE_FILTER_VALUES,
  matchesRfqSearch,
  type SupplierRfqSourceFilter,
} from "@/lib/rfq-list-search"
import { usePublicCategoriesQuery } from "@/hooks/api/use-public-query"
import { useCategoryOptions } from "@/hooks/use-category-options"
import {
  useRfqCategorySubscriptionsQuery,
  useSaveRfqCategorySubscriptionsMutation,
  useSubmitSupplierProposalMutation,
  useSupplierProposalsQuery,
  useSupplierRfqBoardQuery,
} from "@/hooks/api/use-supplier-rfqs-query"
import {
  RfqCategoryAlerts,
  RfqCategoryFilter,
} from "@/components/supplier/rfq/rfq-category-controls"
import { useMarkNavSectionSeen } from "@/hooks/api/use-nav-counts-query"
import { RfqBoardList } from "@/components/supplier/rfq/rfq-board-list"
import { RfqListToolbar } from "@/components/cabinet/rfq/rfq-list-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { ProposalDialog } from "@/components/supplier/proposal-dialog"
import {
  PageEmptyState,
  PageFrame,
  PageSurface,
} from "@/components/layout"
import type { Currency, ProposalStatus, RfqWithRelations } from "@/types"

const SupplierRfqsContent = () => {
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
  const getOpenRfqs = useRfqsStore((s) => s.getOpenRfqs)
  const getRfq = useRfqsStore((s) => s.getRfq)
  const submitProposalLocal = useProposalsStore((s) => s.submitProposal)
  const localProposals = useProposalsStore((s) => s.proposals)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const { getRfqCategoryLabel } = useCategoryOptions()
  const router = useRouter()
  const pathname = usePathname()
  // ?cat=1,6 — categories picked in the filter; empty shows every open request.
  const categoryFilter = useMemo(
    () =>
      (searchParams.get("cat") ?? "")
        .split(",")
        .map((v) => Number(v))
        .filter((v) => Number.isInteger(v) && v > 0),
    [searchParams],
  )
  const setCategoryFilter = (ids: number[]) => {
    const next = new URLSearchParams(searchParams.toString())
    if (ids.length) next.set("cat", ids.join(","))
    else next.delete("cat")
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sourceFilter, setSourceFilter] = useUrlTab<SupplierRfqSourceFilter>(
    "source",
    SUPPLIER_SOURCE_FILTER_VALUES,
    "all",
  )

  const useApi = isApiEnabled()
  useMarkNavSectionSeen("supplier", "rfqs")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const categoryKey = categoryFilter.join(",")
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sourceFilter, categoryKey])

  const { data: apiRfqs, isLoading } = useSupplierRfqBoardQuery(hydrated && useApi, {
    page,
    q: debouncedSearch || undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    category_ids: categoryKey || undefined,
  })
  const { data: categoryTree = [] } = usePublicCategoriesQuery(hydrated && useApi)
  const { data: subscriptions } = useRfqCategorySubscriptionsQuery(hydrated && useApi)
  const saveSubscriptions = useSaveRfqCategorySubscriptionsMutation()
  const subscribedIds = subscriptions?.category_ids ?? []
  const { data: apiProposals } = useSupplierProposalsQuery(hydrated && useApi)
  const submitProposalMutation = useSubmitSupplierProposalMutation()

  const localRfqs = hydrated ? getOpenRfqs() : []
  const openRfqs: RfqWithRelations[] = useApi ? (apiRfqs?.items ?? []) : localRfqs
  const totalPages = useApi ? (apiRfqs?.total_pages ?? 0) : 1
  const proposalItems = apiProposals?.items ?? []

  const getMyProposal = (rfqId: string) => {
    const boardStatus = openRfqs.find((r) => r.id === rfqId)?.my_proposal_status
    const proposal = useApi
      ? proposalItems.find((p) => p.rfq_id === rfqId && p.status !== "withdrawn")
      : localProposals.find(
          (p) =>
            p.rfq_id === rfqId &&
            p.supplier_actor_id === actorId &&
            p.status !== "withdrawn",
        )
    const status = (proposal?.status ?? boardStatus) as ProposalStatus | null | undefined
    if (!status || status === "withdrawn") return undefined
    return {
      price: proposal?.price ?? 0,
      currency: proposal?.currency ?? "TJS",
      status,
    }
  }

  const filtered = useMemo(() => {
    const bySearch = (rfq: RfqWithRelations) =>
      matchesRfqSearch(
        rfq,
        useApi ? "" : debouncedSearch,
        getRfqBuyerName(rfq, getCompany),
      )

    const base = useApi
      ? openRfqs
      : filterRfqsBySource(openRfqs.filter(bySearch), sourceFilter)

    return sortSupplierBoardRfqs(
      [...base].sort((a, b) => {
        const ae = a.status === "expired" || !OPEN_RFQ_STATUSES.includes(a.status)
        const be = b.status === "expired" || !OPEN_RFQ_STATUSES.includes(b.status)
        return Number(ae) - Number(be)
      }),
      actorId,
      isRfqInvitedFor,
    )
  }, [
    useApi,
    openRfqs,
    debouncedSearch,
    sourceFilter,
    actorId,
    getCompany,
    localProposals,
    proposalItems,
  ])

  const selectedRfq = selectedRfqId
    ? useApi
      ? openRfqs.find((r) => r.id === selectedRfqId)
      : getRfq(selectedRfqId)
    : undefined

  const handleOpenProposal = (rfqId: string) => {
    setSelectedRfqId(rfqId)
    setDialogOpen(true)
  }

  const handleSubmitProposal = (values: {
    price: number
    delivery_time: string
    message: string
  }) => {
    if (!selectedRfq) return
    if (useApi) {
      void submitProposalMutation.mutateAsync({
        rfqId: selectedRfq.id,
        data: {
          price: values.price,
          currency: selectedRfq.currency,
          delivery_time: values.delivery_time,
          message: values.message,
        },
      })
      setDialogOpen(false)
      return
    }
    submitProposalLocal({
      rfq_id: selectedRfq.id,
      supplier_actor_id: actorId,
      price: values.price,
      currency: selectedRfq.currency as Currency,
      delivery_time: values.delivery_time,
      message: values.message,
    })
  }

  const hasFilters =
    Boolean(debouncedSearch) ||
    sourceFilter !== "all" ||
    categoryFilter.length > 0
  const isLoadingState = !hydrated || isLoading
  const isEmpty = isLoadingState || filtered.length === 0

  return (
    <PageFrame>
      {/* One row: search, category filter and alerts; the section header above names the page. */}
      <RfqListToolbar
        trailing={
          useApi ? (
            <>
              {categoryTree.length ? (
                <RfqCategoryFilter
                  tree={categoryTree}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
              ) : null}
              <RfqCategoryAlerts
                tree={categoryTree}
                value={subscribedIds}
                saving={saveSubscriptions.isPending}
                onSave={(ids) => saveSubscriptions.mutateAsync(ids)}
              />
            </>
          ) : null
        }
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Поиск по заявке, номеру или покупателю"
        searchAriaLabel="Поиск по заявкам покупателей"
        onFilterChange={setSourceFilter}
        filterAriaLabel="Источник заявки"
      />

      {isEmpty ? (
        <PageSurface>
          <PageEmptyState
            icon={<Search />}
            title={
              isLoadingState
                ? "Загрузка заявок..."
                : hasFilters
                  ? "Заявки не найдены"
                  : "Заявок нет"
            }
            description={
              isLoadingState
                ? undefined
                : hasFilters
                  ? "Измените поиск или фильтры."
                  : subscribedIds.length
                    ? "Пришлём уведомление, когда появится заявка в выбранных категориях."
                    : "Включите уведомления, чтобы узнать о новой заявке сразу."
            }
          />
        </PageSurface>
      ) : (
        <RfqBoardList
          rfqs={filtered}
          actorId={actorId}
          getMyProposal={getMyProposal}
          getBuyerName={(rfq) => getRfqBuyerName(rfq, getCompany)}
          getBuyerVerified={(rfq) => {
            const company = getCompany(Number(rfq.actor_id))
            return (
              rfq.buyer?.verification_status === "verified" ||
              company?.verification_status === "verified"
            )
          }}
          onSubmitProposal={handleOpenProposal}
          getCategoryLabel={(rfq) => getRfqCategoryLabel(rfq.category_id)}
        />
      )}

      {selectedRfq && (
        <ProposalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          rfqTitle={selectedRfq.title}
          budgetType={selectedRfq.budget_type}
          budgetFrom={selectedRfq.budget_from}
          budgetTo={selectedRfq.budget_to}
          currency={selectedRfq.currency}
          defaultPrice={selectedRfq.budget_from ?? selectedRfq.budget_to}
          onSubmit={handleSubmitProposal}
        />
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  )
}

export default function SupplierRfqsPage() {
  return (
    <Suspense fallback={null}>
      <SupplierRfqsContent />
    </Suspense>
  )
}
