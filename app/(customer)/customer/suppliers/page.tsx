"use client"

import { useMemo, useState } from "react"
import { MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { catalogCategories as mockCatalogCategories } from "@/lib/mock/catalog-categories"
import { usePublicCategoriesQuery } from "@/hooks/api/use-public-query"
import { mapCategoryTreeToMarketplace } from "@/lib/marketplace-hybrid"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useItemsStore } from "@/lib/store/items-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { usePublicSuppliersQuery } from "@/hooks/api/use-public-query"
import { useContractsQuery } from "@/hooks/api/use-contracts-query"
import {
  formatPublicSupplierSummary,
  getActiveCatalogItemsCount,
  getSupplierCategories,
  isSupplierCompany,
  toPublicSupplierFromCompany,
} from "@/lib/supplier-directory"
import { SupplierDirectoryCard } from "@/components/cabinet/suppliers/supplier-directory-card"
import { ListPagination } from "@/components/list-pagination"
import { Input } from "@/components/ui/input"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
import type { ContractWithRelations, PublicSupplier } from "@/types"

export default function SuppliersPage() {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const useApi = isApiEnabled()
  const [query, setQuery] = useState("")
  const [categorySlug, setCategorySlug] = useState("")

  const actorId = getActorId(useAuthStore((s) => s.user))
  const getSupplierCompaniesByCategory = useCompaniesStore(
    (s) => s.getSupplierCompaniesByCategory,
  )
  const getItemsBySupplier = useItemsStore((s) => s.getItemsBySupplier)
  const getContractsForBuyer = useContractsStore((s) => s.getContractsForBuyer)

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

  const { data: apiSuppliers, isLoading } = usePublicSuppliersQuery(
    query.trim() || undefined,
    categorySlug || undefined,
    hydrated && useApi,
    { page },
  )

  const { data: apiContractsPage } = useContractsQuery(hydrated && useApi)
  const apiContracts = (apiContractsPage?.items ?? []) as ContractWithRelations[]

  const dealsBySupplier = useMemo(() => {
    const contracts: ContractWithRelations[] = useApi
      ? apiContracts
      : hydrated
        ? getContractsForBuyer(actorId)
        : []
    const map = new Map<number, number>()
    contracts.forEach((c) => {
      map.set(c.supplier_actor_id, (map.get(c.supplier_actor_id) ?? 0) + 1)
    })
    return map
  }, [useApi, apiContracts, hydrated, getContractsForBuyer, actorId])

  const getCategoriesForSupplier = (companyId: number) =>
    getSupplierCategories(getItemsBySupplier(companyId))

  const localSuppliers = useMemo(() => {
    if (!hydrated || useApi) return [] as PublicSupplier[]
    const byCategory = getSupplierCompaniesByCategory(categorySlug, (id) =>
      getCategoriesForSupplier(id),
    ).filter(isSupplierCompany)
    const mapped = byCategory.map((company) => {
      const items = getItemsBySupplier(company.id)
      return toPublicSupplierFromCompany(
        company,
        getActiveCatalogItemsCount(items),
      )
    })
    if (!query.trim()) return mapped
    const q = query.trim().toLowerCase()
    return mapped.filter((supplier) => {
      const haystack = [
        supplier.display_name,
        supplier.description,
        ...supplier.industries,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [
    hydrated,
    useApi,
    query,
    categorySlug,
    getSupplierCompaniesByCategory,
    getItemsBySupplier,
  ])

  const suppliers: PublicSupplier[] = useApi
    ? (apiSuppliers?.items ?? [])
    : localSuppliers
  const totalPages = useApi ? (apiSuppliers?.total_pages ?? 0) : 1

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  return (
    <PageFrame>
      <PageHeader
        title="Каталог исполнителей"
        description="Компании и физлица - поиск и приглашение к заявке"
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
          placeholder="Поиск по названию, ФИО, описанию, категории..."
          className="pl-11"
          aria-label="Поиск исполнителей"
        />
      </div>

      <SegmentedControl
        value={categorySlug}
        options={[
          { value: "", label: "Все" },
          ...categoryTabs.map((c) => ({ value: c.slug, label: c.name })),
        ]}
        onChange={setCategorySlug}
        ariaLabel="Категория исполнителей"
      />

      {!hydrated || (useApi && isLoading) ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-canvas" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title="Исполнители не найдены"
            description="Попробуйте изменить фильтры"
          />
        </PageSurface>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {suppliers.map((supplier) => (
            <SupplierDirectoryCard
              key={supplier.actor_id}
              supplier={supplier}
              summary={formatPublicSupplierSummary(supplier)}
              categoryNames={supplier.industries}
              myDealsCount={dealsBySupplier.get(supplier.actor_id) ?? 0}
            />
          ))}
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </PageFrame>
  )
}
