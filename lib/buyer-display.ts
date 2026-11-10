import type { CompanyWithRelations } from "@/types"
import type { RfqBuyerSummary, RfqWithRelations } from "@/types/rfq"

type CompanyLookup = (id: number) => CompanyWithRelations | undefined

export const getRfqBuyerName = (
  rfq: RfqWithRelations,
  getCompany?: CompanyLookup,
): string => {
  if (rfq.buyer?.display_name) return rfq.buyer.display_name
  const company = getCompany?.(Number(rfq.actor_id))
  if (company?.title) return company.title
  if (rfq.created_by && !/^\d+$/.test(rfq.created_by)) return rfq.created_by
  return "Покупатель"
}

export const getRfqBuyerRating = (
  rfq: RfqWithRelations,
  getCompany?: CompanyLookup,
): number => {
  if (rfq.buyer) return rfq.buyer.rating
  return getCompany?.(Number(rfq.actor_id))?.rating ?? 0
}

export const getRfqBuyerSummary = (
  rfq: RfqWithRelations,
  getCompany?: CompanyLookup,
): RfqBuyerSummary | undefined => {
  if (rfq.buyer) return rfq.buyer
  const company = getCompany?.(Number(rfq.actor_id))
  if (!company) return undefined
  return {
    id: Number(rfq.actor_id),
    kind: "company",
    display_name: company.title,
    rating: company.rating,
    verification_status: company.verification_status,
    city: company.city,
    country: company.country,
    legal_name: company.legal_name,
    description: company.description,
    website: company.website,
    completed_contracts: company.stats?.completed_contracts ?? 0,
  }
}
