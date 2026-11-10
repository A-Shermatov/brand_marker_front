import Link from "next/link"
import { BuildingsIcon as Building2, MapPinIcon as MapPin, ShieldCheckIcon as ShieldCheck, UserIcon as User } from "@phosphor-icons/react/dist/ssr"
import type { PublicSupplier } from "@/types"
import { BuyerRating } from "@/components/supplier/rfq/buyer-rating"
import { CompanyName } from "@/components/bm"
import { supplierMarks } from "@/lib/supplier-marks"

type SupplierProposalInfoProps = {
  supplier: PublicSupplier | undefined
  supplierId: number
  supplierName: string
}

const verificationLabel: Record<string, string> = {
  verified: "Верифицирован",
  pending: "На проверке",
  needs_documents: "На проверке",
  rejected: "Отклонён",
  unverified: "Не проверен",
}

export const SupplierProposalInfo = ({
  supplier,
  supplierId,
  supplierName,
}: SupplierProposalInfoProps) => {
  const profileHref = `/customer/suppliers/${supplierId}`
  const isIndividual = supplier?.kind === "individual"
  const Icon = isIndividual ? User : Building2

  return (
    <div className="flex items-start gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted">
        <Icon size={22} className="text-ink-soft" />
      </div>
      <div className="flex-1 min-w-0">
        <Link href={profileHref} className="flex min-w-0 hover:[&_*]:text-brand-700">
          <CompanyName
            name={supplierName}
            {...(supplier ? supplierMarks(supplier) : {})}
            size="md"
          />
        </Link>
        {supplier ? (
          <>
            <p className="text-xs text-muted-foreground mt-0.5">
              Профиль, портфолио и прошлые работы
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <BuyerRating rating={supplier.rating} compact />
              <span className="text-xs text-muted-foreground">
                {supplier.reviews_count} отзывов
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              {(supplier.city || supplier.country) && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin size={12} className="flex-shrink-0" />
                  <span className="wrap-anywhere">
                    {[supplier.city, supplier.country].filter(Boolean).join(", ")}
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="flex-shrink-0" />
                {verificationLabel[supplier.verification_status]}
              </span>
            </div>
            {supplier.active_catalog_count > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {supplier.active_catalog_count} позиций в каталоге
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">
            Открыть профиль поставщика
          </p>
        )}
      </div>
    </div>
  )
}
