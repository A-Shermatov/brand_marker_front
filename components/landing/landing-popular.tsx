"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ServiceCard } from "@/components/marketplace/service-card"
import { isApiEnabled } from "@/lib/api/config"
import { usePublicCatalogQuery } from "@/hooks/api/use-public-query"
import { useMappedMarketplaceServices } from "@/hooks/api/use-supplier-name"
import { getFeaturedServices } from "@/lib/mock/marketplace-services"
import { servicesUrl } from "@/lib/marketplace-routes"

export function LandingPopular() {
  const useApi = isApiEnabled()
  const { data: apiCatalog, isLoading } = usePublicCatalogQuery(
    undefined,
    undefined,
    useApi,
    { pageSize: 8, sort: "pop" },
  )
  const apiItems = useMappedMarketplaceServices(
    useApi ? apiCatalog?.items : null,
    { limit: 8 },
  )
  const items = useMemo(() => {
    if (!useApi) return getFeaturedServices(8)
    return apiItems
  }, [useApi, apiItems])

  return (
    <section className="mx-auto mt-16 max-w-[1200px] px-4 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">
          Популярные предложения
        </h2>
        <Link
          href={servicesUrl()}
          className="text-[15px] font-semibold text-brand-700 hover:underline"
        >
          Смотреть все
        </Link>
      </div>
      {useApi && isLoading && items.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl border border-line bg-white"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-[15px] text-mute">
          Пока нет предложений в каталоге.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  )
}
