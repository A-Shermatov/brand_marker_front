"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cartLineFromItem } from "@/lib/cart"
import { useCartStore } from "@/lib/store/cart-store"
import type { CartLineMode, CatalogItemWithRelations } from "@/types"

/**
 * Puts a catalog item in the cart as a purchase or a price request and says
 * so, with a shortcut to the cart.
 */
export function useAddToCart() {
  const router = useRouter()
  const add = useCartStore((s) => s.add)

  return useCallback(
    (
      item: CatalogItemWithRelations,
      options: { qty?: number; mode?: CartLineMode; supplierName?: string } = {},
    ) => {
      const line = cartLineFromItem(item, { supplierName: options.supplierName, mode: options.mode })
      add(line, options.qty ?? line.minQty ?? 1)
      toast.success(line.mode === "quote" ? "Запрос цены добавлен в корзину" : "Добавлено в корзину", {
        description: item.title,
        action: { label: "Корзина", onClick: () => router.push("/customer/cart") },
      })
    },
    [add, router],
  )
}
