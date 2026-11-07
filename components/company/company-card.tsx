"use client"

import Link from "next/link"
import { BuildingsIcon as Building2, MapPinIcon as MapPin, StarIcon as Star, CheckCircleIcon as CheckCircle2 } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { CompanyWithRelations } from "@/types"

type CompanyCardProps = {
  company: CompanyWithRelations
  isActive: boolean
  editHref: string
  onSwitch: () => void
}

const verificationLabel = (status: CompanyWithRelations["verification_status"]) => {
  if (status === "verified") return "Верифицирована"
  if (status === "rejected") return "Отклонена"
  return "На проверке"
}

export const CompanyCard = ({
  company,
  isActive,
  editHref,
  onSwitch,
}: CompanyCardProps) => (
  <div
    className={cn(
      "rounded-2xl border bg-card p-5 transition-all",
      isActive ? "border-primary ring-2 ring-primary/20" : "border-border",
    )}
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Building2 size={20} className="text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{company.title}</h3>
          {company.legal_name && (
            <p className="text-xs text-muted-foreground truncate">
              {company.legal_name}
            </p>
          )}
        </div>
      </div>
      {isActive && (
        <span className="shrink-0 text-[12.5px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
          Активна
        </span>
      )}
    </div>

    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
      {(company.city || company.country) && (
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {[company.city, company.country].filter(Boolean).join(", ")}
        </span>
      )}
      {company.rating > 0 && (
        <span className="flex items-center gap-1">
          <Star size={12} className="text-amber-500" />
          {company.rating}
        </span>
      )}
      <span className="flex items-center gap-1">
        <CheckCircle2 size={12} />
        {verificationLabel(company.verification_status)}
      </span>
    </div>

    {company.description && (
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {company.description}
      </p>
    )}

    <div className="flex flex-wrap gap-2">
      {!isActive && (
        <button
          type="button"
          onClick={onSwitch}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Сделать активной
        </button>
      )}
      <Link
        href={editHref}
        className="h-9 px-4 rounded-lg border border-input text-xs font-semibold flex items-center hover:bg-secondary transition-colors"
      >
        Редактировать
      </Link>
    </div>
  </div>
)
