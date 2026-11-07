"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueries } from "@tanstack/react-query"
import { CaretRightIcon as ChevronRight, StarIcon as Star, UsersIcon as Users } from "@phosphor-icons/react/dist/ssr"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useSupplierContractsQuery } from "@/hooks/api/use-contracts-query"
import { useSupplierReviewsQuery } from "@/hooks/api/use-reviews-query"
import { publicKeys } from "@/hooks/api/use-public-query"
import { publicApi } from "@/lib/api/public"
import { getActorId } from "@/lib/auth-display"
import { formatCount, formatPrice } from "@/lib/format"
import { CompanyName } from "@/components/bm"
import { ListPagination } from "@/components/list-pagination"
import { profileMarks, type CompanyMarks } from "@/lib/supplier-marks"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import type { ContractWithRelations, Review } from "@/types"

const CUSTOMERS_PAGE_SIZE = 20

interface CustomerGroup {
  id: number
  name: string
  contractCount: number
  totalAmount: number
  latestContractId: number
  rating: number | null
  reviewsCount: number
  marks: CompanyMarks | null
}

const avgRating = (reviews: Review[]) => {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

const groupCustomers = (
  contracts: ContractWithRelations[],
): Omit<CustomerGroup, "name" | "rating" | "reviewsCount" | "marks">[] => {
  const groups = new Map<
    number,
    Omit<CustomerGroup, "name" | "rating" | "reviewsCount" | "marks">
  >()

  for (const contract of contracts) {
    const existing = groups.get(contract.buyer_actor_id)
    if (existing) {
      existing.contractCount += 1
      existing.totalAmount += contract.agreed_amount
      if (contract.id > existing.latestContractId) {
        existing.latestContractId = contract.id
      }
      continue
    }

    groups.set(contract.buyer_actor_id, {
      id: contract.buyer_actor_id,
      contractCount: 1,
      totalAmount: contract.agreed_amount,
      latestContractId: contract.id,
    })
  }

  return Array.from(groups.values()).sort((a, b) => b.totalAmount - a.totalAmount)
}

export default function SupplierCustomersPage() {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const [page, setPage] = useState(1)
  const getContractsForSupplier = useContractsStore((s) => s.getContractsForSupplier)
  const { data: apiContracts, isLoading } = useSupplierContractsQuery(
    hydrated && useApi,
    { pageSize: 100 },
  )
  const { data: givenReviewsPage } = useSupplierReviewsQuery(hydrated && useApi)

  const contracts: ContractWithRelations[] = useApi
    ? ((apiContracts?.items ?? []) as ContractWithRelations[])
    : hydrated
      ? getContractsForSupplier(actorId)
      : []

  const allGroups = groupCustomers(contracts)
  const totalPages = Math.ceil(allGroups.length / CUSTOMERS_PAGE_SIZE)
  const currentPage = Math.min(page, Math.max(totalPages, 1))
  const groups = allGroups.slice(
    (currentPage - 1) * CUSTOMERS_PAGE_SIZE,
    currentPage * CUSTOMERS_PAGE_SIZE,
  )
  const buyerIds = groups.map((g) => g.id)

  const buyerQueries = useQueries({
    queries: buyerIds.map((id) => ({
      queryKey: publicKeys.buyer(id),
      queryFn: () => publicApi.buyer(id),
      enabled: hydrated && useApi && id > 0,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const reviewsAboutBuyer = new Map<number, Review[]>()
  for (const review of givenReviewsPage?.items ?? []) {
    const list = reviewsAboutBuyer.get(review.target_actor_id) ?? []
    list.push(review)
    reviewsAboutBuyer.set(review.target_actor_id, list)
  }

  const customers: CustomerGroup[] = groups.map((group, index) => {
    const fromApi = buyerQueries[index]?.data
    const myReviews = reviewsAboutBuyer.get(group.id) ?? []
    const rating =
      fromApi && fromApi.rating > 0
        ? fromApi.rating
        : avgRating(myReviews)
    return {
      ...group,
      name: fromApi?.display_name ?? `Заказчик #${group.id}`,
      rating,
      reviewsCount: fromApi?.reviews_count ?? myReviews.length,
      marks: fromApi ? profileMarks(fromApi) : null,
    }
  })

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame className="animate-pulse">
        <div className="mb-6 h-10 w-1/3 rounded bg-secondary" />
        <div className="h-32 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Заказчики"
        description="Контрагенты по вашим сделкам и их рейтинг"
      />

      {customers.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<Users size={32} />}
            title="Заказчиков пока нет"
            description="Заказчики появятся после первых сделок"
          />
        </PageSurface>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/supplier/customers/${customer.id}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-secondary/20"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Users size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CompanyName
                  as="p"
                  name={customer.name}
                  {...customer.marks}
                  size="sm"
                  nameClassName="font-bold"
                  className="flex"
                />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCount(customer.contractCount, "сделка", "сделки", "сделок")} ·{" "}
                  {formatPrice(customer.totalAmount)}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                  {customer.rating != null ? (
                    <>
                      <Star size={12} className="fill-amber-400 text-amber-400" weight="fill" />
                      <span className="font-semibold text-foreground">
                        {customer.rating.toFixed(1)}
                      </span>
                      {customer.reviewsCount > 0 ? (
                        <span className="text-muted-foreground">
                          ({customer.reviewsCount})
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Нет оценок</span>
                  )}
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                Профиль <ChevronRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <ListPagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </PageFrame>
  )
}
