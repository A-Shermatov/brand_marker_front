import Link from "next/link"
import { MapPinIcon as MapPin, StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import type { PublicSupplier } from "@/types"
import { performerUrl } from "@/lib/marketplace-routes"
import { CompanyName } from "@/components/bm"
import { supplierMarks } from "@/lib/supplier-marks"
import { reputationTierLabel } from "@/lib/trust-levels"

type CatalogItemSellerCardProps = {
  supplier: PublicSupplier
}

export const CatalogItemSellerCard = ({
  supplier,
}: CatalogItemSellerCardProps) => {
  const marks = supplierMarks(supplier)
  const location = [supplier.city, supplier.country].filter(Boolean).join(", ")

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] text-mute">Поставщик</p>
          <Link
            href={performerUrl(supplier.actor_id)}
            className="mt-1 flex max-w-full hover:[&_*]:text-brand-700"
          >
            <CompanyName
              name={supplier.display_name}
              verified={marks.verified}
              tier={marks.tier}
              plan={marks.plan}
              size="lg"
            />
          </Link>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} aria-hidden="true" />
              {location}
            </p>
          )}
        </div>
        <Link
          href={performerUrl(supplier.actor_id)}
          className="shrink-0 text-sm font-semibold text-primary hover:underline"
        >
          Профиль
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" weight="fill" />
            {supplier.rating.toFixed(1)}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {supplier.reviews_count} отзывов
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-sm font-semibold">{reputationTierLabel(marks.tier)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Уровень доверия</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-sm font-semibold">{supplier.active_catalog_count}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Позиций в каталоге</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-3 py-2">
          <p className="text-sm font-semibold">
            {supplier.success_rate != null
              ? `${Math.round(supplier.success_rate)}%`
              : "—"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Успешные сделки</p>
        </div>
      </div>
    </section>
  )
}
