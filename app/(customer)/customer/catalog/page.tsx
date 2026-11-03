"use client"

import { useMemo, useState } from "react"
import { MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { catalogCategories as mockCatalogCategories } from "@/lib/mock/catalog-categories"
import {
  usePublicCatalogQuery,
  usePublicCategoriesQuery,
} from "@/hooks/api/use-public-query"
import { mapCategoryTreeToMarketplace } from "@/lib/marketplace-hybrid"
import { useItemsStore } from "@/lib/store/items-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { usePublicSuppliersByActor } from "@/hooks/api/use-supplier-name"
import { CustomerCatalogGrid } from "@/components/cabinet/catalog/customer-catalog-grid"
import { ListPagination } from "@/components/list-pagination"
import { Input } from "@/components/ui/input"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
import type { CatalogItemType, CatalogItemWithRelations } from "@/types"

type TypeFilter = "" | CatalogItemType

export default function CustomerCatalogPage() {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const useApi = isApiEnabled()
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("")
  const [categorySlug, setCategorySlug] = useState("")

  const items = useItemsStore((s) => s.items)

  const { data: apiCategories } = usePublicCategoriesQuery(useApi)
  const categoryTabs = useMemo(() => {
    if (!useApi) return mockCatalogCategories
    if (!apiCategories?.length) return []
    return mapCategoryTreeToMarketplace(apiCategories).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.label,
    }))
  }, [useApi, apiCategories])

  const trimmedQuery = query.trim()
  const { data: apiCatalog, isLoading } = usePublicCatalogQuery(
    trimmedQuery || undefined,
    categorySlug || undefined,
    hydrated && useApi,
    { page },
  )

  const localItems = useMemo(() => {
    if (!hydrated || useApi) return [] as CatalogItemWithRelations[]
    const q = trimmedQuery.toLowerCase()
    return items
      .filter((item) => item.status === "active")
      .filter((item) => (typeFilter ? item.type === typeFilter : true))
      .filter((item) =>
        categorySlug ? item.category?.slug === categorySlug : true,
      )
      .filter((item) => {
        if (!q) return true
        const haystack = [item.title, item.description ?? "", item.category?.name ?? ""]
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [hydrated, useApi, items, trimmedQuery, typeFilter, categorySlug])

  const catalogItems = useMemo(() => {
    const source = useApi ? (apiCatalog?.items ?? []) : localItems
    if (!typeFilter) return source
    return source.filter((item) => item.type === typeFilter)
  }, [useApi, apiCatalog, localItems, typeFilter])
  const totalPages = useApi ? (apiCatalog?.total_pages ?? 0) : 1

  const actorIds = useMemo(
    () => catalogItems.map((item) => item.actor_id),
    [catalogItems],
  )
  const { getName: getSupplierName } = usePublicSuppliersByActor(actorIds)

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  return (
    <PageFrame>
      <PageHeader
        title="Товары и услуги"
        description="Каталог предложений исполнителей"
      />

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Поиск по названию, описанию, категории..."
          className="pl-11"
          aria-label="Поиск товаров и услуг"
        />
      </div>

      <SegmentedControl
        value={typeFilter}
        options={[
          { value: "", label: "Все" },
          { value: "product", label: "Товары" },
          { value: "service", label: "Услуги" },
        ]}
        onChange={setTypeFilter}
        ariaLabel="Тип позиции"
      />

      <SegmentedControl
        value={categorySlug}
        options={[
          { value: "", label: "Все категории" },
          ...categoryTabs.map((c) => ({ value: c.slug, label: c.name })),
        ]}
        onChange={setCategorySlug}
        ariaLabel="Категория"
      />

      {!hydrated || (useApi && isLoading) ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : catalogItems.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title="Позиции не найдены"
            description="Попробуйте изменить фильтры или поисковый запрос"
          />
        </PageSurface>
      ) : (
        <CustomerCatalogGrid
          items={catalogItems}
          getSupplierName={getSupplierName}
        />
      )}
    
      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
</PageFrame>
  )
}
