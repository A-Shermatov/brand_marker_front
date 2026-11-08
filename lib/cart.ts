import { resolveFileUrl } from "@/lib/file-url"
import { getPricingMoq, priceForQty, resolveListPrice } from "@/lib/item-display"
import type { CartItem, CartLineMode, CatalogItemWithRelations } from "@/types"

/** A cart line for a catalog item: a purchase when it has a price, else a price request. */
export function cartLineFromItem(
  item: CatalogItemWithRelations,
  options: { supplierName?: string; mode?: CartLineMode } = {},
): Omit<CartItem, "qty"> {
  const list = resolveListPrice(item.pricing)
  const image = [...item.media]
    .sort((a, b) => a.sort_order - b.sort_order)
    .find((entry) => entry.media_type === "image" && entry.file_url)
  const tiers =
    item.pricing?.pricing_type === "tiered"
      ? item.pricing.tiers.map((tier) => ({ min_qty: tier.min_qty, price: tier.price }))
      : undefined
  return {
    listingId: String(item.id),
    title: item.title,
    price: priceForQty(item.pricing, getPricingMoq(item.pricing)) ?? list?.price ?? 0,
    kind: item.type,
    supplierId: item.actor_id,
    supplierName: options.supplierName,
    mode: options.mode ?? (list ? "buy" : "quote"),
    imageUrl: image ? resolveFileUrl(image.file_url) : null,
    currency: item.pricing?.currency ?? list?.currency ?? "TJS",
    unit: item.type === "product" ? "шт" : "усл.",
    minQty: getPricingMoq(item.pricing),
    tiers,
    categoryId: item.category?.slug,
    categoryLabel: item.category?.name,
  }
}

/** Unit price for the line's amount: the deepest volume tier it reaches. */
export function cartUnitPrice(line: Pick<CartItem, "price" | "qty" | "tiers">): number {
  if (line.tiers?.length) {
    const sorted = [...line.tiers].sort((a, b) => a.min_qty - b.min_qty)
    let unit = sorted[0]!.price
    for (const tier of sorted) if (line.qty >= tier.min_qty) unit = tier.price
    return unit
  }
  return line.price
}

/** A line is bought only when it has a price and is not a price request. */
export const isPurchase = (line: CartItem) => (line.mode ?? "buy") === "buy" && line.price > 0

export const cartLineTotal = (line: CartItem) => (isPurchase(line) ? cartUnitPrice(line) * line.qty : 0)
