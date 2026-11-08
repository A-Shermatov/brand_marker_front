import { create } from "zustand"
import { persist } from "zustand/middleware"
import { cartLineTotal } from "@/lib/cart"
import type { CartItem, CartLineMode } from "@/types"

interface CartState {
  items: CartItem[]
  /** Adds the amount to a line already in the cart; a new mode replaces the old one. */
  add: (item: Omit<CartItem, "qty">, qty?: number) => void
  setQty: (listingId: string, qty: number) => void
  setMode: (listingId: string, mode: CartLineMode) => void
  remove: (listingId: string) => void
  clear: () => void
  total: () => number
  count: () => number
}

const clampQty = (line: Pick<CartItem, "minQty">, qty: number) =>
  Math.min(99_999, Math.max(line.minQty ?? 1, Math.floor(qty) || 1))

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.listingId === item.listingId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.listingId === item.listingId
                  ? { ...i, ...item, qty: clampQty(item, i.qty + qty) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, qty: clampQty(item, qty) }] }
        }),
      setQty: (listingId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.listingId === listingId ? { ...i, qty: clampQty(i, qty) } : i,
          ),
        })),
      setMode: (listingId, mode) =>
        set((state) => ({
          items: state.items.map((i) => (i.listingId === listingId ? { ...i, mode } : i)),
        })),
      remove: (listingId) =>
        set((state) => ({ items: state.items.filter((i) => i.listingId !== listingId) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + cartLineTotal(i), 0),
      count: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "bm-cart" },
  ),
)
