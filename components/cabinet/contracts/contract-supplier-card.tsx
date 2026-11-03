import { BuildingsIcon as Building2, MapPinIcon as MapPin, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import type { CompanyWithRelations } from "@/types"
import { BuyerRating } from "@/components/supplier/rfq/buyer-rating"

type ContractSupplierCardProps = {
  supplier: CompanyWithRelations | undefined
  supplierTitle?: string
}

const verificationLabel = {
  verified: "Верифицирован",
  pending: "На проверке",
  needs_documents: "На проверке",
  rejected: "Отклонён",
  unverified: "Не проверен",
} as const

export const ContractSupplierCard = ({ supplier, supplierTitle }: ContractSupplierCardProps) => {
  if (!supplier) {
    return (
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Исполнитель</h2>
        <p className="text-sm font-bold text-foreground">{supplierTitle ?? "Данные недоступны"}</p>
      </section>
    )
  }

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-sm font-semibold text-foreground mb-4">Исполнитель</h2>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Building2 size={22} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{supplier.title}</p>
          {supplier.legal_name && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{supplier.legal_name}</p>
          )}
          <div className="mt-2">
            <BuyerRating rating={supplier.rating} />
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        {(supplier.city || supplier.country) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={14} className="flex-shrink-0" />
            <span>{[supplier.city, supplier.country].filter(Boolean).join(", ")}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck size={14} className="flex-shrink-0" />
          <span>{verificationLabel[supplier.verification_status]}</span>
        </div>
      </div>
    </section>
  )
}
