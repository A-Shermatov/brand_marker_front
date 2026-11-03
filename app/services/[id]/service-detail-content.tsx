"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react/dist/ssr"
import { ReportItemDialog } from "@/components/catalog/report-item-dialog"
import { PageShell } from "@/components/marketplace/page-shell"
import { ServiceCard } from "@/components/marketplace/service-card"
import { CatalogItemGallery } from "@/components/marketplace/catalog-item-detail/catalog-item-gallery"
import { CatalogItemInfo } from "@/components/marketplace/catalog-item-detail/catalog-item-info"
import { CatalogItemSections } from "@/components/marketplace/catalog-item-detail/catalog-item-sections"
import { CatalogItemBuyCard } from "@/components/marketplace/catalog-item-detail/catalog-item-buy-card"
import { getService } from "@/lib/mock/marketplace-services"
import { mockCatalogItems } from "@/lib/mock/items"
import { mockCompanies } from "@/lib/mock/companies"
import { toPublicSupplierFromCompany } from "@/lib/supplier-directory"
import { isApiEnabled } from "@/lib/api/config"
import {
  usePublicCatalogItemQuery,
  usePublicCatalogQuery,
  usePublicSupplierQuery,
  usePublicSupplierReviewsQuery,
} from "@/hooks/api/use-public-query"
import { categoryUrl, servicesUrl } from "@/lib/marketplace-routes"
import { mapCatalogItemToService } from "@/lib/marketplace-hybrid"
import { useMappedMarketplaceServices } from "@/hooks/api/use-supplier-name"
import { getPricingMoq } from "@/lib/item-display"
import { tokenStorage } from "@/lib/api/client"
import type {
  CatalogItemWithRelations,
  PublicSupplier,
  Review,
} from "@/types"
import type { MarketplaceService } from "@/types/marketplace"

type ServiceDetailContentProps = {
  serviceId: number
}

const marketplaceServiceToItem = (
  service: MarketplaceService,
): CatalogItemWithRelations => ({
  id: service.id,
  actor_id: service.providerId,
  type: "service",
  category_id: 0,
  title: service.title,
  description: service.description,
  status: "active",
  created_at: new Date().toISOString(),
  category: service.categoryId
    ? {
        id: 0,
        parent_id: null,
        name: service.categoryId,
        slug: service.categoryId,
      }
    : undefined,
  attributes: service.tags.map((tag, index) => ({
    id: index + 1,
    item_id: service.id,
    name: "Тег",
    value: tag,
    value_type: "text",
    sort_order: index,
  })),
  pricing: null,
  media: [],
  stats: null,
})

const marketplaceServiceToSupplier = (
  service: MarketplaceService,
): PublicSupplier => ({
  actor_id: service.providerId,
  kind: "company",
  display_name: service.provider,
  company_id: service.providerId,
  city: service.city,
  country: null,
  description: null,
  website: null,
  rating: service.rating,
  verification_status: service.verified ? "verified" : "pending",
  reviews_count: service.reviews,
  industries: [],
  active_catalog_count: 0,
  trust_level: "basic",
  success_rate: null,
})

export const ServiceDetailContent = ({ serviceId }: ServiceDetailContentProps) => {
  const useApi = isApiEnabled()
  const [reportOpen, setReportOpen] = useState(false)
  const [qty, setQty] = useState<number | null>(null)
  const isAuthenticated = Boolean(tokenStorage.getAccess())

  const { data: apiItem, isLoading: itemLoading } = usePublicCatalogItemQuery(
    serviceId,
    useApi,
  )
  const { data: apiSupplier, isLoading: supplierLoading } = usePublicSupplierQuery(
    apiItem?.actor_id ?? 0,
    useApi && Boolean(apiItem?.actor_id),
  )
  const { data: reviewsPage, isLoading: reviewsLoading } =
    usePublicSupplierReviewsQuery(
      apiItem?.actor_id ?? 0,
      useApi && Boolean(apiItem?.actor_id),
      { page: 1, pageSize: 20 },
    )

  const mockBundle = useMemo(() => {
    if (useApi) return null
    const catalogItem = mockCatalogItems.find((item) => item.id === serviceId)
    if (catalogItem) {
      const company = mockCompanies.find((c) => c.id === catalogItem.actor_id)
      const supplier = company
        ? toPublicSupplierFromCompany(
            company,
            mockCatalogItems.filter((i) => i.actor_id === catalogItem.actor_id)
              .length,
          )
        : ({
            actor_id: catalogItem.actor_id,
            kind: "company",
            display_name: `Поставщик #${catalogItem.actor_id}`,
            company_id: catalogItem.actor_id,
            city: "—",
            country: null,
            description: null,
            website: null,
            rating: 4.5,
            verification_status: "pending",
            reviews_count: 0,
            industries: [],
            active_catalog_count: 0,
            trust_level: "basic",
            success_rate: null,
          } satisfies PublicSupplier)
      return {
        item: catalogItem,
        supplier,
        reviews: (company?.reviews ?? []) as Review[],
      }
    }

    const marketplace = getService(serviceId)
    if (!marketplace) return null
    return {
      item: marketplaceServiceToItem(marketplace),
      supplier: marketplaceServiceToSupplier(marketplace),
      reviews: [] as Review[],
    }
  }, [serviceId, useApi])

  const item = useApi ? (apiItem ?? null) : (mockBundle?.item ?? null)
  const supplier = useApi
    ? (apiSupplier ?? null)
    : (mockBundle?.supplier ?? null)
  const reviews = useApi
    ? (reviewsPage?.items ?? [])
    : (mockBundle?.reviews ?? [])

  const categorySlug = item?.category?.slug
  const { data: relatedCatalog } = usePublicCatalogQuery(
    undefined,
    categorySlug,
    useApi && Boolean(categorySlug),
    { page: 1, pageSize: 8 },
  )

  const apiRelated = useMappedMarketplaceServices(
    useApi ? relatedCatalog?.items : null,
    { excludeId: serviceId, limit: 4 },
  )
  const relatedServices = useMemo(() => {
    if (useApi) return apiRelated
    if (!item) return []
    const sameCat = mockCatalogItems.filter(
      (entry) =>
        entry.id !== serviceId &&
        entry.category?.slug === item.category?.slug,
    )
    const sameSup = mockCatalogItems.filter(
      (entry) =>
        entry.id !== serviceId &&
        entry.actor_id === item.actor_id &&
        !sameCat.some((x) => x.id === entry.id),
    )
    const rest = mockCatalogItems.filter(
      (entry) =>
        entry.id !== serviceId &&
        !sameCat.some((x) => x.id === entry.id) &&
        !sameSup.some((x) => x.id === entry.id),
    )
    return [...sameCat, ...sameSup, ...rest]
      .slice(0, 4)
      .map((entry) => {
        const company = mockCompanies.find((c) => c.id === entry.actor_id)
        const pub = company ? toPublicSupplierFromCompany(company, 0) : null
        return mapCatalogItemToService(entry, company ?? null, pub)
      })
  }, [useApi, apiRelated, serviceId, item])

  if (useApi && (itemLoading || (apiItem && supplierLoading))) {
    return (
      <PageShell>
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 rounded bg-secondary" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="space-y-6">
                <div className="aspect-square rounded-2xl bg-secondary" />
                <div className="h-48 rounded-2xl bg-secondary" />
              </div>
              <div className="h-96 rounded-2xl bg-secondary" />
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  if (!item || !supplier) {
    return (
      <PageShell>
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-6">
          <p className="text-lg font-bold text-foreground">Позиция не найдена</p>
          <Link
            href={servicesUrl()}
            className="mt-2 inline-block font-semibold text-primary hover:underline"
          >
            К каталогу
          </Link>
        </div>
      </PageShell>
    )
  }

  const categoryLabel = item.category?.name
  const shortTitle = item.title.split(",")[0] ?? item.title
  const moq = getPricingMoq(item.pricing)
  const effectiveQty = qty ?? moq

  return (
    <PageShell>
      <section className="bg-canvas pb-12 pt-5 lg:pb-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <nav
            className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-mute"
            aria-label="Навигация"
          >
            <Link href="/" className="hover:text-ink">
              Главная
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            {categorySlug && categoryLabel ? (
              <>
                <Link href={categoryUrl(categorySlug)} className="hover:text-ink">
                  {categoryLabel}
                </Link>
                <ChevronRight className="size-3.5" aria-hidden />
              </>
            ) : (
              <>
                <Link href={servicesUrl()} className="hover:text-ink">
                  Каталог
                </Link>
                <ChevronRight className="size-3.5" aria-hidden />
              </>
            )}
            <span className="max-w-[50vw] truncate text-ink">{shortTitle}</span>
          </nav>

          <div className="grid items-start gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid min-w-0 items-start gap-6 lg:col-start-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
              <div className="grid min-w-0 gap-4">
                <CatalogItemGallery media={item.media} title={item.title} />
              </div>
              <CatalogItemInfo
                title={item.title}
                pricing={item.pricing}
                attributes={item.attributes}
                supplier={supplier}
                qty={effectiveQty}
              />
            </div>

            <CatalogItemBuyCard
              itemId={item.id}
              itemTitle={item.title}
              pricing={item.pricing}
              attributes={item.attributes}
              supplier={supplier}
              isAuthenticated={isAuthenticated}
              canUseApiOffers={useApi}
              qty={effectiveQty}
              onQtyChange={(next) => setQty(next)}
            />

            <div className="min-w-0 lg:col-start-1">
              <CatalogItemSections
                description={item.description}
                attributes={item.attributes}
                media={item.media}
                pricing={item.pricing}
                supplier={supplier}
                reviews={reviews}
                reviewsLoading={useApi && reviewsLoading}
                itemId={item.id}
                canReport={useApi}
                isAuthenticated={isAuthenticated}
                onReport={() => setReportOpen(true)}
              />
            </div>
          </div>

          {relatedServices.length > 0 && (
            <section className="mt-12 grid gap-4">
              <h2 className="text-[22px] font-bold tracking-[-0.01em] text-ink">
                Другие рекомендации для вашего бизнеса
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {relatedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      {useApi && (
        <ReportItemDialog
          itemId={serviceId}
          itemTitle={item.title}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </PageShell>
  )
}
