import Link from "next/link"
import { BuildingsIcon as Building2, MapPinIcon as MapPin, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import type { PublicBuyer } from "@/types"
import { BuyerRating } from "@/components/supplier/rfq/buyer-rating"
import { formatCount } from "@/lib/format"

type ContractBuyerCardProps = {
  buyer: PublicBuyer | null | undefined
  loading?: boolean
}

const verificationLabel: Record<string, string> = {
  verified: "Верифицирован",
  pending: "На проверке",
  rejected: "Отклонён",
  needs_documents: "Нужны документы",
  unverified: "Не проверен",
}

export const ContractBuyerCard = ({ buyer, loading }: ContractBuyerCardProps) => {
  if (loading) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Заказчик</h2>
        <div className="h-20 animate-pulse rounded-lg bg-secondary" />
      </section>
    )
  }

  if (!buyer) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Заказчик</h2>
        <p className="text-sm text-muted-foreground">Данные недоступны</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-foreground">Заказчик</h2>

      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Building2 size={22} className="text-primary" />
        </div>
        <div className="min-w-0">
          <Link
            href={`/supplier/customers/${buyer.actor_id}`}
            className="text-sm font-bold text-foreground hover:text-primary hover:underline"
          >
            {buyer.display_name}
          </Link>
          {buyer.legal_name && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {buyer.legal_name}
            </p>
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheck size={14} className="flex-shrink-0" />
          <span>
            {verificationLabel[buyer.verification_status] ?? buyer.verification_status}
          </span>
        </div>
        {(buyer.completed_contracts ?? 0) > 0 && (
          <p className="pt-1 text-xs text-muted-foreground">
            {formatCount(
              buyer.completed_contracts ?? 0,
              "завершённая сделка",
              "завершённые сделки",
              "завершённых сделок",
            )}{" "}
            на платформе
          </p>
        )}
      </div>
    </section>
  )
}
