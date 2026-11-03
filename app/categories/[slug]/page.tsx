"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { ServiceCard } from "@/components/marketplace/service-card"
import { getCategoryBySlug } from "@/lib/mock/categories"
import { getServicesByCategory } from "@/lib/mock/marketplace-services"
import { getIcon } from "@/lib/icon-map"
import { isApiEnabled } from "@/lib/api/config"
import { usePublicCatalogQuery, usePublicCategoriesQuery } from "@/hooks/api/use-public-query"
import { useMappedMarketplaceServices } from "@/hooks/api/use-supplier-name"
import { mapCategoryTreeToMarketplace } from "@/lib/marketplace-hybrid"
import {
  categoriesUrl,
  categoryUrl,
  servicesUrl,
} from "@/lib/marketplace-routes"
import type { MarketplaceCategory, MarketplaceService } from "@/types/marketplace"

type CategoryPageProps = {
  params: Promise<{ slug: string }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params)
  const searchParams = useSearchParams()
  const sub = searchParams.get("sub") ?? undefined
  const useApi = isApiEnabled()

  const { data: apiCategories } = usePublicCategoriesQuery(useApi)
  const { data: apiCatalog } = usePublicCatalogQuery(undefined, slug, useApi)

  const category: MarketplaceCategory | null = useMemo(() => {
    if (useApi) {
      if (!apiCategories?.length) return null
      const mapped = mapCategoryTreeToMarketplace(apiCategories)
      return mapped.find((c) => c.slug === slug) ?? null
    }
    return getCategoryBySlug(slug) ?? null
  }, [useApi, apiCategories, slug])

  const apiServices = useMappedMarketplaceServices(useApi ? apiCatalog?.items : null)
  const services: MarketplaceService[] = useMemo(() => {
    if (useApi) return apiServices
    const mockCategory = getCategoryBySlug(slug)
    return mockCategory ? getServicesByCategory(mockCategory.id) : []
  }, [useApi, apiServices, slug])

  if (!category) {
    return (
      <PageShell>
        <div className="max-w-[900px] mx-auto px-6 py-16 text-center">
          <p className="text-lg font-bold text-foreground">Категория не найдена</p>
          <Link href={categoriesUrl()} className="text-primary font-semibold hover:underline mt-2 inline-block">
            К категориям
          </Link>
        </div>
      </PageShell>
    )
  }

  const Icon = getIcon(category.icon)
  const activeSub = sub
    ? category.subcategories.find((item) => item.slug === sub)
    : undefined

  return (
    <PageShell>
      <section className="bg-white border-b border-border py-9">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Главная</Link>
            <span>/</span>
            <Link href={categoriesUrl()} className="hover:text-primary transition-colors">Категории</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{category.label}</span>
          </div>

          <div className="flex items-start gap-4 mb-8">
            <div className={`${category.iconBg} rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0`}>
              <Icon size={26} className={category.iconColor} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{category.label}</h1>
              <p className="text-sm text-muted-foreground mt-1">{category.count} услуг в каталоге</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href={categoryUrl(category.slug)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                !activeSub
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              Все
            </Link>
            {category.subcategories.map((item) => (
              <Link
                key={item.id}
                href={categoryUrl(category.slug, item.slug)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeSub?.slug === item.slug
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {activeSub && (
            <p className="text-sm text-muted-foreground mb-6">
              Подкатегория: <span className="font-semibold text-foreground">{activeSub.label}</span>
            </p>
          )}

          {services.length === 0 ? (
            <div className="rounded-2xl border border-border bg-secondary/40 p-10 text-center">
              <p className="text-sm text-muted-foreground">В этой категории пока нет услуг</p>
              <Link
                href={servicesUrl()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-3 hover:underline"
              >
                Смотреть все услуги <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}
