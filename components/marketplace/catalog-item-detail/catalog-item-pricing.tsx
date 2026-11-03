import type { ItemPricing } from "@/types"
import { formatCurrency } from "@/lib/format"
import { formatItemPricing } from "@/lib/item-display"

type CatalogItemPricingProps = {
  pricing: ItemPricing | null
}

const getMoq = (pricing: ItemPricing | null): number | null => {
  if (!pricing) return null
  if (pricing.pricing_type === "tiered" && pricing.tiers.length > 0) {
    return pricing.tiers.reduce(
      (lowest, tier) => (tier.min_qty < lowest ? tier.min_qty : lowest),
      pricing.tiers[0]!.min_qty,
    )
  }
  return 1
}

export const CatalogItemPricing = ({ pricing }: CatalogItemPricingProps) => {
  const moq = getMoq(pricing)
  const headline = formatItemPricing(pricing)
  const showTiers =
    pricing?.pricing_type === "tiered" && pricing.tiers.length > 0

  return (
    <div className="space-y-3">
      <div>
        <div className="text-2xl font-bold text-primary sm:text-3xl">
          {headline}
        </div>
        {moq != null && (
          <p className="mt-1 text-sm text-muted-foreground">
            Минимальный заказ:{" "}
            <span className="font-semibold text-foreground">{moq} шт.</span>
          </p>
        )}
      </div>

      {showTiers && pricing && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-semibold">Кол-во от</th>
                <th className="px-3 py-2 font-semibold">Цена</th>
              </tr>
            </thead>
            <tbody>
              {[...pricing.tiers]
                .sort((a, b) => a.min_qty - b.min_qty)
                .map((tier) => (
                  <tr
                    key={`${tier.min_qty}-${tier.price}`}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2 font-medium">{tier.min_qty} шт.</td>
                    <td className="px-3 py-2 font-semibold text-foreground">
                      {formatCurrency(tier.price, pricing.currency)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
