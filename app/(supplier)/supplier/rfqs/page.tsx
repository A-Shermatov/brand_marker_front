"use client"

import { useSearchParams } from "next/navigation"
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
  SUPPLIER_RESPONSE_FILTER_OPTIONS,
  SUPPLIER_RESPONSE_FILTER_VALUES,
  SUPPLIER_SOURCE_FILTER_VALUES,
  filterSupplierRfqsByResponse,
  isPendingCatalogOffer,
  matchesRfqSearch,
  type SupplierRfqResponseFilter,
  type SupplierRfqSourceFilter,
} from "@/lib/rfq-list-search"
import { useCategoryOptions } from "@/hooks/use-category-options"
import {
  useSubmitSupplierProposalMutation,
  useSupplierProposalsQuery,
  useSupplierRfqBoardQuery,
} from "@/hooks/api/use-supplier-rfqs-query"
import {
  emptySupplierNavCounts,
  useMarkNavSectionSeen,
  useSupplierNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { RfqBoardTable } from "@/components/supplier/rfq/rfq-board-table"
import { RfqListToolbar } from "@/components/cabinet/rfq/rfq-list-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { ProposalDialog } from "@/components/supplier/proposal-dialog"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
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
  const { getRfqCategoryLabel, rfqCategories } = useCategoryOptions()
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sourceFilter, setSourceFilter] = useUrlTab<SupplierRfqSourceFilter>(
    "source",
    SUPPLIER_SOURCE_FILTER_VALUES,
    "all",
  )
  const [responseFilter, setResponseFilter] = useUrlTab<SupplierRfqResponseFilter>(
    "response",
    SUPPLIER_RESPONSE_FILTER_VALUES,
    "all",
  )

  const useApi = isApiEnabled()
  const navCounts = useSupplierNavCounts(useApi).data ?? emptySupplierNavCounts()
  useMarkNavSectionSeen("supplier", "rfqs")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, sourceFilter, responseFilter])

  const { data: apiRfqs, isLoading } = useSupplierRfqBoardQuery(hydrated && useApi, {
    page,
    q: debouncedSearch || undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
  })
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
    const responded = (rfqId: string) => {
      const mine = getMyProposal(rfqId)
      return Boolean(mine) && !isPendingCatalogOffer(mine?.status)
    }
    const bySearch = (rfq: RfqWithRelations) =>
      matchesRfqSearch(
        rfq,
        useApi ? "" : debouncedSearch,
        getRfqBuyerName(rfq, getCompany),
      )

    const base = useApi
      ? openRfqs
      : filterRfqsBySource(openRfqs.filter(bySearch), sourceFilter)

    const withResponse = filterSupplierRfqsByResponse(base, responseFilter, responded)

    return sortSupplierBoardRfqs(
      [...withResponse].sort((a, b) => {
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
    responseFilter,
    actorId,
    getCompany,
    localProposals,
    proposalItems,
  ])

  const categoryHint = useMemo(() => {
    const ids = [...new Set(filtered.map((r) => r.category_id))].slice(0, 3)
    if (ids.length === 0) {
      return rfqCategories
        .slice(0, 2)
        .map((c) => c.label)
        .join(", ")
    }
    return ids.map((id) => getRfqCategoryLabel(id)).join(", ")
  }, [filtered, rfqCategories, getRfqCategoryLabel])

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
    Boolean(debouncedSearch) || sourceFilter !== "all" || responseFilter !== "all"
  const isLoadingState = !hydrated || isLoading
  const isEmpty = isLoadingState || filtered.length === 0

  return (
    <PageFrame>
      <PageHeader
        title="Заявки покупателей"
        description={
          categoryHint
            ? `Категории: ${categoryHint}`
            : "Заявки в ваших категориях"
        }
      />

      <RfqListToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Поиск по заявке, номеру или покупателю"
        searchAriaLabel="Поиск по заявкам покупателей"
        onFilterChange={setSourceFilter}
        filterAriaLabel="Источник заявки"
        secondaryFilterValue={responseFilter}
        secondaryFilterOptions={SUPPLIER_RESPONSE_FILTER_OPTIONS.map((option) =>
          option.value === "open" && navCounts.rfqs > 0
            ? { ...option, count: navCounts.rfqs }
            : option,
        )}
        onSecondaryFilterChange={(value) =>
          setResponseFilter(value as SupplierRfqResponseFilter)
        }
        secondaryFilterAriaLabel="Ответ по заявке"
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
                  : "Пришлём уведомление, когда появится заявка в ваших категориях."
            }
          />
        </PageSurface>
      ) : (
        <RfqBoardTable
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
