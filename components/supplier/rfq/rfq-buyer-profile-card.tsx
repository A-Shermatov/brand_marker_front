import Link from "next/link"
import { BuildingsIcon as Building2, MapPinIcon as MapPin, ShieldCheckIcon as ShieldCheck, UserIcon as User } from "@phosphor-icons/react/dist/ssr"
import type { RfqBuyerSummary } from "@/types/rfq"
import { BuyerRating } from "@/components/supplier/rfq/buyer-rating"
import { CompanyName } from "@/components/bm"
import { formatCount } from "@/lib/format"
import { profileMarks } from "@/lib/supplier-marks"

type RfqBuyerProfileCardProps = {
  buyer: RfqBuyerSummary | undefined
}

const verificationLabel = {
  verified: "Верифицирован",
  pending: "На проверке",
  needs_documents: "На проверке",
  rejected: "Отклонён",
  unverified: "Не проверен",
} as const

export const RfqBuyerProfileCard = ({ buyer }: RfqBuyerProfileCardProps) => {
  if (!buyer) {
    return (
      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">Профиль покупателя</h2>
        <p className="text-sm text-muted-foreground">Данные недоступны</p>
      </section>
    )
  }

  const isIndividual = buyer.kind === "individual"
  const BuyerIcon = isIndividual ? User : Building2

  return (
    <section className="bg-card border border-border rounded-xl p-6 lg:sticky lg:top-24">
      <h2 className="text-sm font-semibold text-foreground mb-4">Профиль покупателя</h2>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <BuyerIcon size={22} className="text-primary" />
        </div>
        <div className="min-w-0">
          <CompanyName as="p" name={buyer.display_name} {...profileMarks(buyer)} size="sm" nameClassName="font-bold" />
          {buyer.legal_name && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{buyer.legal_name}</p>
          )}
          {isIndividual && (
            <p className="text-[10px] font-semibold text-muted-foreground mt-1">Физическое лицо</p>
          )}
          <div className="mt-2">
            <BuyerRating rating={buyer.rating} />
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        {(buyer.city || buyer.country) && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin size={14} className="flex-shrink-0" />
            <span>{[buyer.city, buyer.country].filter(Boolean).join(", ")}</span>
          </div>
        )}
        {buyer.verification_status && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck size={14} className="flex-shrink-0" />
            <span>{verificationLabel[buyer.verification_status]}</span>
          </div>
        )}
        {buyer.completed_contracts != null && buyer.completed_contracts > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            {formatCount(buyer.completed_contracts, "завершённая сделка", "завершённые сделки", "завершённых сделок")} на платформе
          </p>
        )}
      </div>

      {buyer.description && (
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed line-clamp-4">
          {buyer.description}
        </p>
      )}

      {buyer.website && (
        <Link
          href={buyer.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-semibold text-primary hover:underline mt-3"
        >
          {isIndividual ? "Сайт" : "Сайт компании"}
        </Link>
      )}
    </section>
  )
}
