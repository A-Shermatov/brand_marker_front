import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type { CartLineMode, PaymentMode } from "@/types"
import { apiFetch } from "./client"

export type ApprovalStatus = "wait" | "auto" | "approved" | "rejected"

export type PurchaseApproval = {
  id: number
  company_id: number | null
  requester_user_id: number
  who_name: string
  who_role: string
  limit_label: string
  title: string
  supplier_name: string
  amount: number
  currency: string
  reason: string
  status: ApprovalStatus
  rfq_id: string | null
  rfq_ids: string[]
  cart_items: Array<{
    item_id: number
    qty: number
    title?: string
    unit_price?: number
    line_total?: number
    currency?: string
  }>
  decided_by: number | null
  decided_at: string | null
  created_at: string
}

export type CartCheckoutItem = {
  item_id: number
  qty: number
  /** "quote" asks the supplier to name the price instead of buying. */
  mode?: CartLineMode
}

export type CartCheckoutResponse = {
  approval: PurchaseApproval
  rfq_ids: string[]
  offers_created: boolean
}

export const approvalsApi = {
  list: (
    params: PageParams & { status?: "wait" | "hist" | "all" } = {},
  ) =>
    apiFetch<Page<PurchaseApproval>>(
      `/buyer/approvals${buildPageQuery(params)}`,
    ),

  checkout: (data: {
    items: CartCheckoutItem[]
    idempotency_key?: string
    payment_mode?: PaymentMode
  }) =>
    apiFetch<CartCheckoutResponse>("/buyer/approvals/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  decide: (id: number, action: "approved" | "rejected") =>
    apiFetch<PurchaseApproval>(`/buyer/approvals/${id}/decide`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
}
