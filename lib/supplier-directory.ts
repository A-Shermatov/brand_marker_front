import type {
  CatalogItemWithRelations,
  Category,
  CompanyWithRelations,
  PublicSupplier,
} from "@/types"
import { DEMO_BUYER_ACTOR_IDS } from "@/lib/mock/companies"

export const isSupplierCompany = (company: CompanyWithRelations): boolean => {
  if (company.actor_types?.includes("supplier")) return true
  if (company.actor_type) return company.actor_type === "supplier"
  return !DEMO_BUYER_ACTOR_IDS.includes(
    company.id as (typeof DEMO_BUYER_ACTOR_IDS)[number],
  )
}

export const isBuyerCompany = (company: CompanyWithRelations): boolean =>
  !isSupplierCompany(company)

export const getSupplierCategories = (
  items: CatalogItemWithRelations[],
): Category[] => {
  const seen = new Map<number, Category>()
  for (const item of items) {
    if (item.status !== "active" || !item.category) continue
    seen.set(item.category.id, item.category)
  }
  return [...seen.values()]
}

export const getActiveCatalogItemsCount = (
  items: CatalogItemWithRelations[],
): number => items.filter((i) => i.status === "active").length

export const formatSupplierCatalogSummary = (
  company: CompanyWithRelations,
  activeItemsCount: number,
  categories: Category[],
): string => {
  const parts: string[] = []
  if (activeItemsCount > 0) {
    parts.push(`${activeItemsCount} поз. в каталоге`)
  }
  if (categories.length > 0) {
    parts.push(categories.slice(0, 2).map((c) => c.name).join(", "))
  }
  if (parts.length === 0 && company.description) {
    return company.description.slice(0, 80)
  }
  return parts.join(" · ") || "Поставщик на платформе"
}

export const formatPublicSupplierSummary = (supplier: PublicSupplier): string => {
  const parts: string[] = []
  if (supplier.active_catalog_count > 0) {
    parts.push(`${supplier.active_catalog_count} поз. в каталоге`)
  }
  if (supplier.industries.length > 0) {
    parts.push(supplier.industries.slice(0, 2).join(", "))
  }
  if (parts.length === 0 && supplier.description) {
    return supplier.description.slice(0, 80)
  }
  if (parts.length === 0 && supplier.kind === "individual") {
    return "Индивидуальный поставщик"
  }
  return parts.join(" · ") || "Поставщик на платформе"
}

export const computeSupplierSuccessRate = (
  completed: number,
  disputed: number,
): number | null => {
  const total = completed + disputed
  if (total <= 0) return null
  return Math.round((completed / total) * 1000) / 10
}

export const toPublicSupplierFromCompany = (
  company: CompanyWithRelations,
  activeCatalogCount = 0,
): PublicSupplier => {
  const completed = company.stats?.completed_contracts ?? 0
  const active = company.stats?.active_contracts ?? 0
  const disputed = company.stats?.disputes_count ?? 0
  return {
    actor_id: company.id,
    kind: "company",
    display_name: company.title,
    company_id: company.id,
    city: company.city,
    country: company.country,
    description: company.description,
    website: company.website,
    rating: company.rating,
    verification_status: company.verification_status,
    reviews_count: company.reviews?.length ?? 0,
    industries: company.profile?.industries ?? [],
    active_catalog_count: activeCatalogCount,
    trust_level: "basic",
    completed_contracts: completed,
    active_contracts: active,
    disputed_contracts: disputed,
    success_rate: computeSupplierSuccessRate(completed, disputed),
  }
}

export const matchesSupplierSearch = (
  company: CompanyWithRelations,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    company.title,
    company.legal_name,
    company.description,
    company.city,
    company.country,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}

export const companyMatchesCategorySlug = (
  categories: Category[],
  slug: string,
): boolean => {
  if (!slug) return true
  return categories.some((c) => c.slug === slug)
}
