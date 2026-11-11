import type { ProposalStatus, RfqWithRelations } from "@/types"

export type SupplierRfqSourceFilter = "all" | "marketplace" | "catalog"

export const isCatalogOfferRfq = (rfq: RfqWithRelations): boolean =>
  Boolean(rfq.is_catalog_offer) ||
  rfq.catalog_item_id != null ||
  rfq.my_proposal_status === "pending_supplier"

export const filterRfqsBySource = (
  rfqs: RfqWithRelations[],
  source: SupplierRfqSourceFilter,
): RfqWithRelations[] => {
  if (source === "all") return rfqs
  if (source === "catalog") return rfqs.filter(isCatalogOfferRfq)
  return rfqs.filter((rfq) => !isCatalogOfferRfq(rfq))
}

/**
 * The order of the supplier's feed. An order from the catalog that waits for
 * this supplier's answer comes first: it is theirs alone. Then requests of
 * buyers with a paid plan — the place the plan pays for — then other catalog
 * orders and personal invitations. Inside each group the server's order stays
 * (a higher plan above a lower one, newer above older).
 */
export const sortSupplierBoardRfqs = (
  rfqs: RfqWithRelations[],
  actorId: number,
  isInvited: (rfq: RfqWithRelations, actorId: number) => boolean,
): RfqWithRelations[] => {
  const rank = (rfq: RfqWithRelations): number => {
    if (rfq.my_proposal_status === "pending_supplier") return 0
    if (rfq.promoted) return 1
    if (isCatalogOfferRfq(rfq)) return 2
    if (isInvited(rfq, actorId)) return 3
    return 4
  }
  return [...rfqs].sort((a, b) => rank(a) - rank(b))
}

export const isPendingCatalogOffer = (
  status: ProposalStatus | null | undefined,
): boolean => status === "pending_supplier"
