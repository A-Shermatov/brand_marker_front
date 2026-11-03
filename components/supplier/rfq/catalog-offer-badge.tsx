import { ShoppingBagIcon as ShoppingBag } from "@phosphor-icons/react/dist/ssr"
import { statusPillClass } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

type CatalogOfferBadgeProps = {
  className?: string
}

export const CatalogOfferBadge = ({ className }: CatalogOfferBadgeProps) => (
  <span
    className={cn(statusPillClass, "gap-1 bg-amber-500/10 text-amber-700", className)}
    title="Запрос на покупку или торг по вашей позиции в каталоге"
  >
    <ShoppingBag size={12} aria-hidden="true" />
    На мой каталог
  </span>
)
