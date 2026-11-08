import { useQuery } from "@tanstack/react-query"
import {
  publicApi,
  type PublicCatalogParams,
  type PublicSuppliersParams,
} from "@/lib/api/public"
import { isApiEnabled } from "@/lib/api/config"
import type { PageParams } from "@/lib/pagination"

export const publicKeys = {
  all: ["public"] as const,
  categories: () => [...publicKeys.all, "categories"] as const,
  platformSettings: () => [...publicKeys.all, "platform-settings"] as const,
  suppliers: (
    q?: string,
    category?: string,
    page = 1,
    filters: Pick<PublicSuppliersParams, "verified"> = {},
  ) =>
    [
      ...publicKeys.all,
      "suppliers",
      q ?? "",
      category ?? "",
      page,
      filters.verified ? "1" : "0",
    ] as const,
  supplier: (id: number) => [...publicKeys.all, "supplier", id] as const,
  buyer: (id: number) => [...publicKeys.all, "buyer", id] as const,
  buyerReviews: (id: number, page = 1) =>
    [...publicKeys.all, "buyer-reviews", id, page] as const,
  supplierCatalog: (id: number, page = 1) =>
    [...publicKeys.all, "supplier-catalog", id, page] as const,
  supplierReviews: (id: number, page = 1) =>
    [...publicKeys.all, "supplier-reviews", id, page] as const,
  itemReviews: (id: number, page = 1) =>
    [...publicKeys.all, "item-reviews", id, page] as const,
  company: (id: number) => [...publicKeys.all, "company", id] as const,
  companyCatalog: (id: number, page = 1) =>
    [...publicKeys.all, "company-catalog", id, page] as const,
  companyReviews: (id: number, page = 1) =>
    [...publicKeys.all, "company-reviews", id, page] as const,
  catalog: (
    q?: string,
    category?: string,
    page = 1,
    filters: Pick<PublicCatalogParams, "verified" | "invoice" | "sort"> = {},
  ) =>
    [
      ...publicKeys.all,
      "catalog",
      q ?? "",
      category ?? "",
      page,
      filters.verified ? "1" : "0",
      filters.invoice ? "1" : "0",
      filters.sort ?? "pop",
    ] as const,
  catalogItem: (id: number) => [...publicKeys.all, "catalog-item", id] as const,
  rfqs: (page = 1) => [...publicKeys.all, "rfqs", page] as const,
}

export const usePublicCategoriesQuery = (enabled = true) =>
  useQuery({
    queryKey: publicKeys.categories(),
    queryFn: () => publicApi.categories(),
    enabled: enabled && isApiEnabled(),
    staleTime: 5 * 60 * 1000,
  })

export const usePlatformSettingsQuery = (enabled = true) =>
  useQuery({
    queryKey: publicKeys.platformSettings(),
    queryFn: () => publicApi.platformSettings(),
    enabled: enabled && isApiEnabled(),
    staleTime: 60 * 1000,
  })

export const usePublicSuppliersQuery = (
  q?: string,
  category?: string,
  enabled = true,
  params: PublicSuppliersParams = {},
) =>
  useQuery({
    queryKey: publicKeys.suppliers(q, category, params.page ?? 1, {
      verified: params.verified,
    }),
    queryFn: () => publicApi.suppliers(q, category, params),
    enabled: enabled && isApiEnabled(),
  })

export const usePublicSupplierQuery = (id: number, enabled = true) =>
  useQuery({
    queryKey: publicKeys.supplier(id),
    queryFn: () => publicApi.supplier(id),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicBuyerQuery = (id: number, enabled = true) =>
  useQuery({
    queryKey: publicKeys.buyer(id),
    queryFn: () => publicApi.buyer(id),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicBuyerReviewsQuery = (
  id: number,
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: publicKeys.buyerReviews(id, params.page ?? 1),
    queryFn: () => publicApi.buyerReviews(id, params),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicSupplierCatalogQuery = (
  id: number,
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: publicKeys.supplierCatalog(id, params.page ?? 1),
    queryFn: () => publicApi.supplierCatalog(id, params),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicSupplierReviewsQuery = (
  id: number,
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: publicKeys.supplierReviews(id, params.page ?? 1),
    queryFn: () => publicApi.supplierReviews(id, params),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicItemReviewsQuery = (
  itemId: number,
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: publicKeys.itemReviews(itemId, params.page ?? 1),
    queryFn: () => publicApi.itemReviews(itemId, params),
    enabled: enabled && isApiEnabled() && itemId > 0,
  })

export const usePublicCompanyQuery = (id: number, enabled = true) =>
  useQuery({
    queryKey: publicKeys.company(id),
    queryFn: () => publicApi.company(id),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicCompanyCatalogQuery = (
  id: number,
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: publicKeys.companyCatalog(id, params.page ?? 1),
    queryFn: () => publicApi.companyCatalog(id, params),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicCompanyReviewsQuery = (
  id: number,
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: publicKeys.companyReviews(id, params.page ?? 1),
    queryFn: () => publicApi.companyReviews(id, params),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicCatalogQuery = (
  q?: string,
  category?: string,
  enabled = true,
  params: PublicCatalogParams = {},
) =>
  useQuery({
    queryKey: publicKeys.catalog(q, category, params.page ?? 1, {
      verified: params.verified,
      invoice: params.invoice,
      sort: params.sort,
    }),
    queryFn: () => publicApi.catalog(q, category, params),
    enabled: enabled && isApiEnabled(),
  })

export const usePublicCatalogItemQuery = (id: number, enabled = true) =>
  useQuery({
    queryKey: publicKeys.catalogItem(id),
    queryFn: () => publicApi.catalogItem(id),
    enabled: enabled && isApiEnabled() && id > 0,
  })

export const usePublicRfqsQuery = (enabled = true, params: PageParams = {}) =>
  useQuery({
    queryKey: publicKeys.rfqs(params.page ?? 1),
    queryFn: () => publicApi.rfqs(params),
    enabled: enabled && isApiEnabled(),
  })
