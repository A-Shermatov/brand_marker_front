"use client"

import { useState } from "react"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { ListPagination } from "@/components/list-pagination"
import { ReviewsReceivedTable } from "@/components/supplier/finance/reviews-received-table"
import { ReviewCardList } from "@/components/reviews/review-card-list"
import { useHydrated } from "@/hooks/use-hydrated"
import {
  useSupplierReceivedReviewsQuery,
  useSupplierReviewsQuery,
} from "@/hooks/api/use-reviews-query"
import { useEnrichReviewParties } from "@/hooks/api/use-enrich-review-parties"
import { useSupplierContractsQuery } from "@/hooks/api/use-contracts-query"
import { isApiEnabled } from "@/lib/api/config"
import { formatReviewParty } from "@/lib/review-party"
import { useCompaniesStore } from "@/lib/store/companies-store"
import type { ContractWithRelations, Review } from "@/types"

const GivenReviewsTable = ({
  reviews,
  getBuyerName,
  getContractTitle,
}: {
  reviews: Review[]
  getBuyerName: (actorId: number) => string
  getContractTitle: (contractId: number) => string
}) => {
  if (reviews.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Вы ещё не оставляли отзывов заказчикам
      </p>
    )
  }
  return (
    <ReviewCardList
      label="Ваши отзывы о заказчиках"
      items={reviews.map((review) => {
        const { primary, secondary } = formatReviewParty(review.target, getBuyerName(review.target_actor_id))
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          party: { primary, secondary, href: `/supplier/customers/${review.target_actor_id}` },
          deal: { title: getContractTitle(review.contract_id), href: `/supplier/contracts/${review.contract_id}` },
        }
      })}
    />
  )
}

export default function SupplierReviewsPage() {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const getCompany = useCompaniesStore((s) => s.getCompany)

  const [givenPageNum, setGivenPageNum] = useState(1)
  const [receivedPageNum, setReceivedPageNum] = useState(1)

  const { data: givenPage, isLoading: givenLoading } = useSupplierReviewsQuery(
    hydrated && useApi,
    { page: givenPageNum },
  )
  const { data: receivedPage, isLoading: receivedLoading } =
    useSupplierReceivedReviewsQuery(hydrated && useApi, { page: receivedPageNum })
  const { data: contractsPage } = useSupplierContractsQuery(hydrated && useApi, {
    pageSize: 100,
  })

  const givenTotalPages = givenPage?.total_pages ?? 0
  const receivedTotalPages = receivedPage?.total_pages ?? 0
  const given = useEnrichReviewParties(givenPage?.items ?? [], hydrated && useApi)
  const received = useEnrichReviewParties(
    receivedPage?.items ?? [],
    hydrated && useApi,
  )
  const contracts = (contractsPage?.items ?? []) as ContractWithRelations[]

  const nameFromContracts = (actorId: number) => {
    const match = contracts.find(
      (c) => c.buyer_actor_id === actorId || c.supplier_actor_id === actorId,
    )
    if (match?.title) {
      // title is deal title, not party — keep fallback below
    }
    return getCompany(actorId)?.title ?? `Участник #${actorId}`
  }

  const getContractTitle = (contractId: number) =>
    contracts.find((c) => c.id === contractId)?.title ?? `Сделка #${contractId}`

  const loading = useApi && (givenLoading || receivedLoading)

  return (
    <PageFrame>
      <PageHeader
        title="Отзывы"
        description="Оценки заказчиков о вас и ваши отзывы о заказчиках"
      />

      <PageSurface className="space-y-8 p-6">
        <section>
          <h2 className="mb-3 text-sm font-bold text-foreground">
            Полученные от заказчиков
          </h2>
          {loading ? (
            <PageEmptyState title="Загрузка…" />
          ) : (
            <ReviewsReceivedTable
              reviews={received}
              getReviewerName={nameFromContracts}
              getContractTitle={getContractTitle}
            />
          )}
          <ListPagination
            page={receivedPageNum}
            totalPages={receivedTotalPages}
            onPageChange={setReceivedPageNum}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-foreground">
            Оставленные заказчикам
          </h2>
          {loading ? (
            <PageEmptyState title="Загрузка…" />
          ) : (
            <GivenReviewsTable
              reviews={given}
              getBuyerName={nameFromContracts}
              getContractTitle={getContractTitle}
            />
          )}
          <ListPagination
            page={givenPageNum}
            totalPages={givenTotalPages}
            onPageChange={setGivenPageNum}
          />
        </section>
      </PageSurface>
    </PageFrame>
  )
}
