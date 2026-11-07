import type { RfqWithRelations } from "@/types"
import {
  isCatalogOfferRfq,
  isPendingCatalogOffer,
  type SupplierRfqSourceFilter,
} from "@/lib/rfq-board"

export type RfqTypeFilter = "all" | "product" | "service"

export const RFQ_TYPE_FILTER_VALUES = ["all", "product", "service"] as const

export const RFQ_TYPE_FILTER_OPTIONS: { value: RfqTypeFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "product", label: "Товары" },
  { value: "service", label: "Услуги" },
]

export const SUPPLIER_SOURCE_FILTER_VALUES = [
  "all",
  "marketplace",
  "catalog",
] as const

export const SUPPLIER_SOURCE_FILTER_OPTIONS: {
  value: SupplierRfqSourceFilter
  label: string
}[] = [
  { value: "all", label: "Все" },
  { value: "marketplace", label: "С площадки" },
  { value: "catalog", label: "Из каталога" },
]

const formatRfqNoDigits = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  return (digits || rfqId).slice(-4)
}

export const matchesRfqSearch = (
  rfq: RfqWithRelations,
  query: string,
  extraText = "",
): boolean => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const no = formatRfqNoDigits(rfq.id)
  const haystack = [rfq.id, rfq.title, no, `з-${no}`, `з‑${no}`, extraText]
    .join(" ")
    .toLowerCase()
  return haystack.includes(q)
}

export const filterRfqsByType = (
  rfqs: RfqWithRelations[],
  type: RfqTypeFilter,
): RfqWithRelations[] => {
  if (type === "all") return rfqs
  return rfqs.filter((rfq) => rfq.type === type)
}

export { isCatalogOfferRfq, isPendingCatalogOffer }
export type { SupplierRfqSourceFilter }
