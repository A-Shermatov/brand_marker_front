export const ORDER_KINDS = ["product", "service"] as const

export type Listing = any 

export type OrderKind = (typeof ORDER_KINDS)[number]

export const PAYMENT_SCHEMES = ["prepay", "half", "postpay"] as const

export type PaymentScheme = (typeof PAYMENT_SCHEMES)[number]

export type EscrowStatus = "none" | "held" | "released" | "disputed" | "refunded"

/** "buy": at the published price; "quote": the supplier is asked to name it. */
export type CartLineMode = "buy" | "quote"

export type CartItem = {
  listingId: string
  title: string
  /** Unit price at the smallest order; 0 when the price is on request. */
  price: number
  qty: number
  kind: OrderKind
  supplierId: number
  /** Older carts saved lines without a mode: those are purchases. */
  mode?: CartLineMode
  supplierName?: string
  imageUrl?: string | null
  currency?: string
  unit?: string
  /** Smallest order the supplier accepts. */
  minQty?: number
  /** Volume prices: the unit price drops from `min_qty` on. */
  tiers?: { min_qty: number; price: number }[]
  color?: string
  sku?: string
  categoryId?: string
  categoryLabel?: string
}
