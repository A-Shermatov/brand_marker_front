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
import { CustomerCatalogGrid } from "@/components/cabinet/catalog/customer-catalog-grid"
import { ListPagination } from "@/components/list-pagination"
import { Input } from "@/components/ui/input"
import { PageFrame, PageHeader, SegmentedControl } from "@/components/layout"
import type { CatalogItemType, CatalogItemWithRelations } from "@/types"

type TypeFilter = "" | CatalogItemType

/**
 * The catalog inside the buyer's cabinet: find a product or a service, put it
 * in the cart or ask its price, without leaving the cabinet.
 */
export default function CustomerCatalogPage() {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const useApi = isApiEnabled()
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("")
  const [categorySlug, setCategorySlug] = useState("")

  const items = useItemsStore((s) => s.items)

  const { data: apiCategories } = usePublicCategoriesQuery(useApi)
  const categoryOptions = useMemo(() => {
    if (!useApi) return mockCatalogCategories.map((c) => ({ slug: c.slug, name: c.name }))
    if (!apiCategories?.length) return []
    return mapCategoryTreeToMarketplace(apiCategories).map((c) => ({ slug: c.slug, name: c.label }))
  }, [useApi, apiCategories])

  const trimmedQuery = query.trim()
  const { data: apiCatalog, isLoading } = usePublicCatalogQuery(
    trimmedQuery || undefined,
    categorySlug || undefined,
    hydrated && useApi,
    { page, pageSize: 24 },
  )

  const localItems = useMemo(() => {
    if (!hydrated || useApi) return [] as CatalogItemWithRelations[]
    const q = trimmedQuery.toLowerCase()
    return items
      .filter((item) => item.status === "active")
      .filter((item) => (categorySlug ? item.category?.slug === categorySlug : true))
      .filter((item) => {
        if (!q) return true
        return [item.title, item.description ?? "", item.category?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      })
  }, [hydrated, useApi, items, trimmedQuery, categorySlug])

  const catalogItems = useMemo(() => {
    const source = useApi ? (apiCatalog?.items ?? []) : localItems
    return typeFilter ? source.filter((item) => item.type === typeFilter) : source
  }, [useApi, apiCatalog, localItems, typeFilter])
  const totalPages = useApi ? (apiCatalog?.total_pages ?? 0) : 1

  const resetPage = () => setPage(1)

  return (
    <PageFrame>
      <PageHeader title="Каталог товаров" description="Покупайте у проверенных поставщиков без заявки" />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_220px] lg:items-center">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-mute"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetPage()
            }}
            placeholder="Что нужно купить? Например: бумага А4"
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
          onChange={(next) => {
            setTypeFilter(next)
            resetPage()
          }}
          ariaLabel="Тип позиции"
        />
        <select
          value={categorySlug}
          onChange={(event) => {
            setCategorySlug(event.target.value)
            resetPage()
          }}
          aria-label="Категория"
          className="bm-input h-11 w-full cursor-pointer text-[14px] font-medium"
        >
          <option value="">Все категории</option>
          {categoryOptions.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {!hydrated || (useApi && isLoading) ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4" aria-busy>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : (
        <CustomerCatalogGrid
          items={catalogItems}
          emptyText="Ничего не нашлось. Попробуйте другой запрос или категорию — или разместите заявку, и поставщики сами предложат цену."
        />
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  )
}
