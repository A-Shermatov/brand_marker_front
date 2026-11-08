import type { CatalogReportReason, Currency, PaymentMode } from "@/types"
import { apiFetch } from "./client"

export type CatalogItemReportResponse = {
  id: number
  item_id: number
  reason: CatalogReportReason
  details: string | null
  status: "open" | "resolved" | "dismissed"
  created_at: string
}

/** buy: at the published price; negotiate: the buyer names a price; quote: ask for one. */
export type CatalogOfferKind = "buy" | "negotiate" | "quote"

export type CatalogOfferCreate = {
  kind: CatalogOfferKind
  /** For "negotiate": the buyer's price for the whole order. */
  price?: number
  message?: string
  qty?: number
  payment_mode?: PaymentMode
}

export type CatalogOfferResponse = {
  rfq_id: string
  /** Empty for a price request: the supplier answers with an offer. */
  proposal_id: number | null
  kind: CatalogOfferKind
  price: number | null
  currency: Currency | string
  qty?: number
  payment_mode?: PaymentMode
}

export const catalogApi = {
  reportItem: (
    itemId: number,
    payload: { reason: CatalogReportReason; details?: string },
  ) =>
    apiFetch<CatalogItemReportResponse>(`/catalog/items/${itemId}/reports`, {
      method: "POST",
      body: JSON.stringify({
        reason: payload.reason,
        details: payload.details?.trim() || null,
      }),
    }),

  createOffer: (itemId: number, payload: CatalogOfferCreate) =>
    apiFetch<CatalogOfferResponse>(`/buyer/catalog/items/${itemId}/offers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}
