"use client"

import Link from "next/link"
import { ShoppingCartIcon } from "@phosphor-icons/react/dist/ssr"
import { useHydrated } from "@/hooks/use-hydrated"
import { useCartStore } from "@/lib/store/cart-store"
import { cn } from "@/lib/utils"

/** The cart in the top bar: a trolley with the number of lines waiting in it. */
export function CartButton({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const hydrated = useHydrated()
  const lines = useCartStore((s) => s.items.length)
  const count = hydrated ? lines : 0

  return (
    <Link
      href="/customer/cart"
      aria-label={count ? `Корзина: ${count}` : "Корзина"}
      className={cn(
        "relative inline-flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      <ShoppingCartIcon className="size-5" aria-hidden />
      {withLabel ? <span className="hidden xl:inline">Корзина</span> : null}
      {count > 0 ? (
        <span className="absolute left-[19px] top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-card tnum">
          {count}
        </span>
      ) : null}
    </Link>
  )
}
