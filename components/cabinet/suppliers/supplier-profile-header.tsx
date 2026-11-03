"use client"

import { BuildingsIcon as Building2, MapPinIcon as MapPin, GlobeIcon as Globe, ChatTextIcon as MessageSquare, UserIcon as User, UserPlusIcon as UserPlus } from "@phosphor-icons/react/dist/ssr"
import type { Category, PublicSupplier } from "@/types"
import { SupplierRatingLine, SupplierVerifiedBadge } from "@/components/cabinet/suppliers/supplier-trust-badges"
import { CompanyName } from "@/components/bm"
import { supplierMarks } from "@/lib/supplier-marks"

type SupplierProfileHeaderProps = {
  supplier: PublicSupplier
  categories: Category[]
  onContact: () => void
  onInvite: () => void
}

export const SupplierProfileHeader = ({
  supplier,
  categories,
  onContact,
  onInvite,
}: SupplierProfileHeaderProps) => {
  const isIndividual = supplier.kind === "individual"
  const Icon = isIndividual ? User : Building2

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Icon size={28} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CompanyName
              as="h1"
              name={supplier.display_name}
              {...supplierMarks(supplier)}
              size="lg"
              nameClassName="text-[22px] tracking-[-0.02em]"
            />
            <SupplierVerifiedBadge supplier={supplier} />
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {isIndividual ? "Физлицо" : "Компания"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <SupplierRatingLine supplier={supplier} />
            {(supplier.city || supplier.country) && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={12} />
                {[supplier.city, supplier.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      {supplier.description && (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          {supplier.description}
        </p>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="text-[11px] bg-secondary text-foreground px-2.5 py-1 rounded-lg font-medium"
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-5">
        <button
          type="button"
          onClick={onContact}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-colors"
        >
          <MessageSquare size={16} /> Написать
        </button>
        <button
          type="button"
          onClick={onInvite}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={16} /> Пригласить к заявке
        </button>
        {supplier.website && (
          <a
            href={supplier.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-primary/30 text-primary text-sm font-bold hover:bg-secondary transition-colors"
          >
            <Globe size={16} /> Сайт
          </a>
        )}
      </div>
    </div>
  )
}
