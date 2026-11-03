"use client"

import { useState } from "react"
import Link from "next/link"
import { PackageIcon as Package, BriefcaseIcon as Briefcase } from "@phosphor-icons/react/dist/ssr"
import type { CatalogItemWithRelations } from "@/types"
import { catalogItemTypeLabel, formatItemPricing, resolveListPrice } from "@/lib/item-display"
import { serviceUrl } from "@/lib/marketplace-routes"
import { Button } from "@/components/ui/button"
import {
  CatalogBuyOfferDialog,
  CatalogNegotiateOfferDialog,
} from "@/components/marketplace/catalog-item-detail/catalog-item-offer-dialogs"

type SupplierCatalogGridProps = {
  items: CatalogItemWithRelations[]
}

export const SupplierCatalogGrid = ({ items }: SupplierCatalogGridProps) => {
  const [activeItem, setActiveItem] = useState<CatalogItemWithRelations | null>(null)
  const [buyOpen, setBuyOpen] = useState(false)
  const [negotiateOpen, setNegotiateOpen] = useState(false)

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
        У исполнителя пока нет опубликованных позиций в каталоге
      </div>
    )
  }

  const listPrice = activeItem ? resolveListPrice(activeItem.pricing) : null

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const price = resolveListPrice(item.pricing)
          return (
            <div key={item.id} className="bg-card border border-border rounded-xl p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  {item.type === "product" ? (
                    <Package size={19} className="text-primary" />
                  ) : (
                    <Briefcase size={19} className="text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[12.5px] font-medium text-muted-foreground">
                    {catalogItemTypeLabel[item.type]}
                  </span>
                  <Link
                    href={serviceUrl(item.id)}
                    className="mt-0.5 block text-sm font-bold leading-snug text-foreground hover:text-primary"
                  >
                    {item.title}
                  </Link>
                  {item.category && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.category.name}</p>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-2.5 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              )}
              <div className="mt-auto space-y-2 pt-3 border-t border-border">
                <div className="text-sm font-semibold text-primary">
                  {formatItemPricing(item.pricing)}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    disabled={!price}
                    onClick={() => {
                      setActiveItem(item)
                      setBuyOpen(true)
                    }}
                  >
                    Купить с гарантией
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setActiveItem(item)
                      setNegotiateOpen(true)
                    }}
                  >
                    Торговаться
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {activeItem && listPrice && (
        <CatalogBuyOfferDialog
          open={buyOpen}
          onOpenChange={setBuyOpen}
          itemId={activeItem.id}
          itemTitle={activeItem.title}
          price={listPrice.price}
          currency={listPrice.currency}
        />
      )}
      {activeItem && (
        <CatalogNegotiateOfferDialog
          open={negotiateOpen}
          onOpenChange={setNegotiateOpen}
          itemId={activeItem.id}
          itemTitle={activeItem.title}
          listPrice={listPrice?.price ?? null}
          currency={listPrice?.currency ?? activeItem.pricing?.currency ?? "TJS"}
        />
      )}
    </>
  )
}
