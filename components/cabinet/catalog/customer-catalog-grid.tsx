"use client"

import { useMemo } from "react"
import { ShoppingCartIcon, TagIcon } from "@phosphor-icons/react/dist/ssr"
import { ServiceCard } from "@/components/marketplace/service-card"
import { Button } from "@/components/ui/button"
import { useMappedMarketplaceServices } from "@/hooks/api/use-supplier-name"
import { useAddToCart } from "@/hooks/use-add-to-cart"
import { useHydrated } from "@/hooks/use-hydrated"
import { resolveListPrice } from "@/lib/item-display"
import { useCartStore } from "@/lib/store/cart-store"
import type { CatalogItemWithRelations } from "@/types"

type CustomerCatalogGridProps = {
  items: CatalogItemWithRelations[]
  emptyText?: string
}

/** Catalog inside the buyer's cabinet: product cards that open in the cabinet and go to the cart. */
export const CustomerCatalogGrid = ({
  items,
  emptyText = "Позиции не найдены",
}: CustomerCatalogGridProps) => {
  const services = useMappedMarketplaceServices(items)
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const addToCart = useAddToCart()
  const hydrated = useHydrated()
  const inCart = useCartStore((s) => s.items)
  const cartIds = useMemo(
    () => new Set(hydrated ? inCart.map((line) => line.listingId) : []),
    [hydrated, inCart],
  )

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-card p-8 text-center text-[14px] text-mute">
        {emptyText}
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4" aria-label="Товары и услуги">
      {services.map((service) => {
        const item = byId.get(service.id)
        if (!item) return null
        const priced = resolveListPrice(item.pricing) != null
        const added = cartIds.has(String(item.id))
        return (
          <li key={service.id} className="grid">
            <ServiceCard
              service={service}
              href={`/customer/catalog/${service.id}`}
              actions={
                <Button
                  type="button"
                  size="sm"
                  variant={added ? "outline" : priced ? "default" : "outline"}
                  className="w-full"
                  aria-label={`${priced ? "В корзину" : "Запросить цену"}: ${item.title}`}
                  onClick={() =>
                    addToCart(item, {
                      mode: priced ? "buy" : "quote",
                      supplierName: service.provider,
                    })
                  }
                >
                  {priced ? (
                    <ShoppingCartIcon className="size-4" aria-hidden />
                  ) : (
                    <TagIcon className="size-4" aria-hidden />
                  )}
                  {added ? "Ещё в корзину" : priced ? "В корзину" : "Запросить цену"}
                </Button>
              }
            />
          </li>
        )
      })}
    </ul>
  )
}
