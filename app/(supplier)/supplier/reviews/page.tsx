"use client"

import { useState } from "react"
import { StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { ListPagination } from "@/components/list-pagination"
import { ReviewsReceivedTable } from "@/components/supplier/finance/reviews-received-table"
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

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5" aria-label={`Оценка ${rating} из 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={14}
        className={
          n <= rating
            ? "text-amber-500 fill-amber-500"
            : "text-muted-foreground/30"
        }
      />
    ))}
  </div>
)

const PartyCell = ({ review, fallback }: { review: Review; fallback: string }) => {
  const { primary, secondary } = formatReviewParty(review.target, fallback)
  return (
    <div className="min-w-0">
      <p className="font-semibold text-foreground truncate">{primary}</p>
      {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
    </div>
  )
}

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
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
              Заказчик
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
              Оценка
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
              Комментарий
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
              Сделка
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reviews.map((review) => (
            <tr key={review.id} className="hover:bg-secondary/30">
              <td className="px-4 py-3">
                <PartyCell
                  review={review}
                  fallback={getBuyerName(review.target_actor_id)}
                />
              </td>
              <td className="px-4 py-3">
                <RatingStars rating={review.rating} />
              </td>
              <td className="max-w-xs px-4 py-3 text-muted-foreground">
                <p className="line-clamp-2">{review.comment ?? "—"}</p>
              </td>
              <td className="px-4 py-3">
                <a
                  href={`/supplier/contracts/${review.contract_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {getContractTitle(review.contract_id)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
