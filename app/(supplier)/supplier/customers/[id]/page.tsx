"use client"

import { use, useState } from "react"
import Link from "next/link"
import { BuildingsIcon as Building2, MapPinIcon as MapPin, ShieldCheckIcon as ShieldCheck, StarIcon as Star, UsersIcon as Users } from "@phosphor-icons/react/dist/ssr"
import { ListPagination } from "@/components/list-pagination"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { BuyerRating } from "@/components/supplier/rfq/buyer-rating"
import { useHydrated } from "@/hooks/use-hydrated"
import {
  usePublicBuyerQuery,
  usePublicBuyerReviewsQuery,
} from "@/hooks/api/use-public-query"
import { useSupplierContractsQuery } from "@/hooks/api/use-contracts-query"
import { isApiEnabled } from "@/lib/api/config"
import { formatCount, formatIsoDate, formatPrice } from "@/lib/format"
import type { ContractWithRelations } from "@/types"

type PageProps = {
  params: Promise<{ id: string }>
}

const DEALS_PAGE_SIZE = 20

const verificationLabel: Record<string, string> = {
  verified: "Верифицирован",
  pending: "На проверке",
  rejected: "Отклонён",
  needs_documents: "Нужны документы",
  unverified: "Не проверен",
}

export default function SupplierCustomerDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const actorId = Number(id)
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const [reviewsPage, setReviewsPage] = useState(1)
  const [dealsPage, setDealsPage] = useState(1)

  const buyerQuery = usePublicBuyerQuery(actorId, hydrated && useApi && actorId > 0)
  const reviewsQuery = usePublicBuyerReviewsQuery(
    actorId,
    hydrated && useApi && actorId > 0,
    { page: reviewsPage },
  )
  const contractsQuery = useSupplierContractsQuery(hydrated && useApi, {
    pageSize: 100,
  })

  const buyer = buyerQuery.data
  const reviews = reviewsQuery.data?.items ?? []
  const reviewsTotalPages = reviewsQuery.data?.total_pages ?? 0
  const deals = ((contractsQuery.data?.items ?? []) as ContractWithRelations[]).filter(
    (c) => c.buyer_actor_id === actorId,
  )
  const dealsTotalPages = Math.ceil(deals.length / DEALS_PAGE_SIZE)
  const dealsCurrentPage = Math.min(dealsPage, Math.max(dealsTotalPages, 1))
  const pagedDeals = deals.slice(
    (dealsCurrentPage - 1) * DEALS_PAGE_SIZE,
    dealsCurrentPage * DEALS_PAGE_SIZE,
  )

  if (!Number.isInteger(actorId) || actorId <= 0) {
    return (
      <PageFrame>
        <PageEmptyState title="Некорректный заказчик" />
      </PageFrame>
    )
  }

  if (!hydrated || buyerQuery.isLoading) {
    return (
      <PageFrame className="animate-pulse space-y-4">
        <div className="h-10 w-1/3 rounded bg-secondary" />
        <div className="h-40 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  if (buyerQuery.isError || !buyer) {
    return (
      <PageFrame>
        <PageHeader
          title="Заказчик не найден"
          backHref="/supplier/customers"
          backLabel="К списку"
        />
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title={buyer.display_name}
        description="Профиль заказчика"
        backHref="/supplier/customers"
        backLabel="Заказчики"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <PageSurface className="p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-secondary">
                <Building2 className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{buyer.display_name}</h2>
                  <BuyerRating rating={buyer.rating} />
                  {buyer.reviews_count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({buyer.reviews_count})
                    </span>
                  )}
                </div>
                {buyer.legal_name && (
                  <p className="mt-1 text-sm text-muted-foreground">{buyer.legal_name}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {(buyer.city || buyer.country) && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={14} />
                      {[buyer.city, buyer.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    {verificationLabel[buyer.verification_status] ??
                      buyer.verification_status}
                  </span>
                </div>
              </div>
            </div>
            {buyer.description && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {buyer.description}
              </p>
            )}
          </PageSurface>

          <PageSurface className="p-5">
            <h3 className="mb-3 text-sm font-bold">Ваши сделки</h3>
            {deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Сделок пока нет</p>
            ) : (
              <ul className="divide-y divide-border">
                {pagedDeals.map((deal) => (
                  <li key={deal.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/supplier/contracts/${deal.id}`}
                        className="truncate text-sm font-semibold hover:text-primary hover:underline"
                      >
                        {deal.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatIsoDate(deal.created_at)} · {deal.status}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatPrice(deal.agreed_amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <ListPagination
              page={dealsCurrentPage}
              totalPages={dealsTotalPages}
              onPageChange={setDealsPage}
            />
          </PageSurface>

          <PageSurface className="p-5">
            <h3 className="mb-3 text-sm font-bold">Отзывы об этом заказчике</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Отзывов пока нет</p>
            ) : (
              <ul className="space-y-3">
                {reviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-xl border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Star size={14} className="fill-amber-400 text-amber-400" weight="fill" />
                      <span className="text-sm font-semibold">{review.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatIsoDate(review.created_at)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <ListPagination
              page={reviewsPage}
              totalPages={reviewsTotalPages}
              onPageChange={setReviewsPage}
            />
          </PageSurface>
        </div>

        <aside className="space-y-3">
          <PageSurface className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">На платформе</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {buyer.completed_contracts ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCount(
                buyer.completed_contracts ?? 0,
                "завершённая сделка",
                "завершённые сделки",
                "завершённых сделок",
              )}
            </p>
          </PageSurface>
          <PageSurface className="p-4">
            <p className="text-xs font-semibold text-muted-foreground">С вами</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-bold tabular-nums">
              <Users size={20} className="text-primary" />
              {deals.length}
            </p>
            <p className="text-xs text-muted-foreground">сделок в кабинете</p>
          </PageSurface>
        </aside>
      </div>
    </PageFrame>
  )
}
