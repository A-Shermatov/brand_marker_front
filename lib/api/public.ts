import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type { CatalogSort } from "@/lib/marketplace-routes"
import type {
  CatalogItemWithRelations,
  PublicBuyer,
  PublicCompanyDetail,
  PublicSupplier,
  Review,
  RfqWithRelations,
} from "@/types"
import { apiFetch } from "./client"

export type PublicCatalogParams = PageParams & {
  verified?: boolean
  invoice?: boolean
  sort?: CatalogSort
  catalog_type?: "product" | "service"
}

export type PublicSuppliersParams = PageParams & {
  verified?: boolean
}

export type CategoryTree = {
  id: number
  name: string
  slug: string
  children?: CategoryTree[]
}

export type PlatformSettingsInput = {
  commission_percent: number
  commission_min: number
  max_contract_amount: number | null
  /** Smallest commission part the bank accepts when it splits a payment (0 = no split). */
  min_payment_part?: number
}

export type PlatformSettings = PlatformSettingsInput & {
  currency: string
}

export const publicApi = {
  categories: () => apiFetch<CategoryTree[]>("/public/categories"),

  platformSettings: () => apiFetch<PlatformSettings>("/public/platform-settings"),

  suppliers: (q?: string, category?: string, params: PublicSuppliersParams = {}) =>
    apiFetch<Page<PublicSupplier>>(
      `/public/suppliers${buildPageQuery({
        ...params,
        q,
        category,
        verified: params.verified || undefined,
      })}`,
    ),

  supplier: (actorId: number) =>
    apiFetch<PublicSupplier>(`/public/suppliers/${actorId}`),

  buyer: (actorId: number) =>
    apiFetch<PublicBuyer>(`/public/buyers/${actorId}`),

  supplierCatalog: (actorId: number, params: PageParams = {}) =>
    apiFetch<Page<CatalogItemWithRelations>>(
      `/public/suppliers/${actorId}/catalog${buildPageQuery(params)}`,
    ),

  supplierReviews: (actorId: number, params: PageParams = {}) =>
    apiFetch<Page<Review>>(
      `/public/suppliers/${actorId}/reviews${buildPageQuery(params)}`,
    ),

  buyerReviews: (actorId: number, params: PageParams = {}) =>
    apiFetch<Page<Review>>(
      `/public/buyers/${actorId}/reviews${buildPageQuery(params)}`,
    ),

  company: (id: number) => apiFetch<PublicCompanyDetail>(`/public/companies/${id}`),

  companyReviews: (id: number, params: PageParams = {}) =>
    apiFetch<Page<Review>>(
      `/public/companies/${id}/reviews${buildPageQuery(params)}`,
    ),

  companyCatalog: (id: number, params: PageParams = {}) =>
    apiFetch<Page<CatalogItemWithRelations>>(
      `/public/companies/${id}/catalog${buildPageQuery(params)}`,
    ),

  catalog: (q?: string, category?: string, params: PublicCatalogParams = {}) =>
    apiFetch<Page<CatalogItemWithRelations>>(
      `/public/catalog${buildPageQuery({
        ...params,
        q,
        category,
        verified: params.verified || undefined,
        invoice: params.invoice || undefined,
        sort: params.sort && params.sort !== "pop" ? params.sort : undefined,
      })}`,
    ),

  catalogItem: (id: number) =>
    apiFetch<CatalogItemWithRelations>(`/public/catalog/items/${id}`),

  rfqs: (params: PageParams = {}) =>
    apiFetch<Page<RfqWithRelations>>(`/public/rfqs${buildPageQuery(params)}`),
}
