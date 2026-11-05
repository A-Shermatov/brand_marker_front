"use client"

import { useState } from "react"
import { ListPagination } from "@/components/list-pagination"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useBuyerReceivedReviewsQuery,
  useBuyerReviewsQuery,
} from "@/hooks/api/use-reviews-query"
import { useContractsQuery } from "@/hooks/api/use-contracts-query"
import { useSupplierActorName } from "@/hooks/api/use-supplier-name"
import { ReviewsGivenTable } from "@/components/cabinet/reviews/reviews-given-table"
import type { ContractWithRelations } from "@/types"

export default function BuyerReviewsPage() {
  const hydrated = useHydrated()
  const actorId = getActorId(useAuthStore((s) => s.user))
  const useApi = isApiEnabled()
  const getReviewsGivenByBuyer = useCompaniesStore((s) => s.getReviewsGivenByBuyer)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const getContractLocal = useContractsStore((s) => s.getContract)

  const [givenPageNum, setGivenPageNum] = useState(1)
  const [receivedPageNum, setReceivedPageNum] = useState(1)

  const { data: apiReviewsPage, isLoading } = useBuyerReviewsQuery(hydrated && useApi, {
    page: givenPageNum,
  })
  const { data: receivedPage } = useBuyerReceivedReviewsQuery(hydrated && useApi, {
    page: receivedPageNum,
  })
  const givenTotalPages = useApi ? (apiReviewsPage?.total_pages ?? 0) : 1
  const receivedTotalPages = receivedPage?.total_pages ?? 0
  const apiReviews = apiReviewsPage?.items ?? []
  const receivedReviews = receivedPage?.items ?? []
  const { data: apiContractsPage } = useContractsQuery(hydrated && useApi)
  const apiContracts = apiContractsPage?.items ?? []

  const localReviews = hydrated ? getReviewsGivenByBuyer(actorId) : []
  const reviews = useApi ? apiReviews : localReviews

  const supplierIds = [
    ...new Set([
      ...reviews.map((r) => r.target_actor_id),
      ...receivedReviews.map((r) => r.reviewer_actor_id),
    ]),
  ]
  const resolveName = useSupplierActorName(supplierIds)

  const getContractTitle = (contractId: number) => {
    if (useApi) {
      const contract = (apiContracts as ContractWithRelations[]).find(
        (c) => c.id === contractId,
      )
      return contract?.title ?? `Сделка #${contractId}`
    }
    return getContractLocal(contractId)?.title ?? `Сделка #${contractId}`
  }

  const getSupplierName = (supplierActorId: number) => {
    if (useApi) return resolveName(supplierActorId)
    return getCompany(supplierActorId)?.title ?? "Исполнитель"
  }

  return (
    <PageFrame>
      <PageHeader
        title="Мои отзывы"
        description="Оставленные и полученные оценки по сделкам"
      />

      <PageSurface className="p-6 space-y-8">
        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground">Оставленные</h2>
          {useApi && isLoading ? (
            <PageEmptyState title="Загрузка…" />
          ) : (
            <ReviewsGivenTable
              reviews={reviews}
              getSupplierName={getSupplierName}
              getContractTitle={getContractTitle}
            />
          )}
          <ListPagination
            page={givenPageNum}
            totalPages={givenTotalPages}
            onPageChange={setGivenPageNum}
          />
        </div>
        {useApi && (
          <div>
            <h2 className="mb-3 text-sm font-bold text-foreground">Полученные</h2>
            {receivedReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Пока нет отзывов от исполнителей
              </p>
            ) : (
              <ReviewsGivenTable
                reviews={receivedReviews.map((review) => ({
                  ...review,
                  // Table labels the counterpart via target_actor_id; for
                  // received reviews show the reviewer (supplier) instead.
                  target_actor_id: review.reviewer_actor_id,
                }))}
                getSupplierName={(id) => resolveName(id)}
                getContractTitle={getContractTitle}
                showAuthor
              />
            )}
            <ListPagination
              page={receivedPageNum}
              totalPages={receivedTotalPages}
              onPageChange={setReceivedPageNum}
            />
          </div>
        )}
      </PageSurface>
    </PageFrame>
  )
}
