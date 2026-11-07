"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { CompanyName } from "@/components/bm"
import { supplierMarks } from "@/lib/supplier-marks"
import { ClockIcon as Clock, ShieldCheckIcon as ShieldCheck, ShieldSlashIcon as ShieldOff, StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import type { PublicSupplier } from "@/types"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const FAV_KEY = "buyer.supFav"

const readFavIds = (): number[] => {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(FAV_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(Number).filter((n) => Number.isFinite(n))
  } catch {
    return []
  }
}

const writeFavIds = (ids: number[]) => {
  localStorage.setItem(FAV_KEY, JSON.stringify(ids))
}

const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return name.trim().slice(0, 2).toUpperCase() || "?"
}

type SupplierDirectoryCardProps = {
  supplier: PublicSupplier
  summary: string
  categoryNames: string[]
  myDealsCount?: number
}

export const SupplierDirectoryCard = ({
  supplier,
  summary,
  categoryNames,
  myDealsCount = 0,
}: SupplierDirectoryCardProps) => {
  const href = `/customer/suppliers/${supplier.actor_id}`
  const kindLabel = supplier.kind === "individual" ? "Физлицо" : "Компания"
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    setFavorited(readFavIds().includes(supplier.actor_id))
  }, [supplier.actor_id])

  const toggleFavorite = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const current = readFavIds()
      const next = current.includes(supplier.actor_id)
        ? current.filter((id) => id !== supplier.actor_id)
        : [...current, supplier.actor_id]
      writeFavIds(next)
      setFavorited(next.includes(supplier.actor_id))
    },
    [supplier.actor_id],
  )

  const ratingLabel =
    supplier.reviews_count > 0 && Number.isFinite(supplier.rating)
      ? supplier.rating.toFixed(1)
      : "—"
  const dealsLabel = String(supplier.completed_contracts ?? 0)
  const onTimeLabel =
    supplier.success_rate != null && Number.isFinite(supplier.success_rate)
      ? `${Math.round(supplier.success_rate)}%`
      : "—"
  const verified = supplier.verification_status === "verified"
  const underReview =
    supplier.verification_status === "pending" ||
    supplier.verification_status === "needs_documents"

  return (
    <article className="grid content-start gap-4 rounded-2xl border border-line bg-card p-5">
      <div className="flex items-start gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-muted text-[15px] font-bold text-ink"
          aria-hidden
        >
          {initialsFromName(supplier.display_name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={href} className="flex min-w-0 hover:[&_*]:text-brand-700">
              <CompanyName name={supplier.display_name} {...supplierMarks(supplier)} size="md" />
            </Link>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-mute">
            <span>{kindLabel}</span>
            {supplier.city ? (
              <>
                <span aria-hidden>·</span>
                <span>{supplier.city}</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            {verified ? (
              <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
                <ShieldCheck className="size-4" aria-hidden />
                Проверен
              </span>
            ) : underReview ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <Clock className="size-4" aria-hidden />
                На проверке
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-mute">
                <ShieldOff className="size-4" aria-hidden />
                Не проверен
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          className={cn(
            "grid size-9 place-items-center rounded-lg hover:bg-canvas",
            favorited ? "text-amber-500" : "text-mute",
          )}
          aria-label={favorited ? "Убрать из избранных" : "В избранные"}
          aria-pressed={favorited}
        >
          <Star
            className={cn("size-5", favorited && "fill-amber-400")}
            aria-hidden weight="fill"
          />
        </button>
      </div>

      {summary ? (
        <p className="line-clamp-2 text-[14px] text-ink/80">{summary}</p>
      ) : null}

      <dl className="grid grid-cols-4 gap-2 rounded-xl bg-canvas p-3 text-center">
        {(
          [
            [ratingLabel, "рейтинг"],
            [dealsLabel, "сделок"],
            ["—", "ответ"],
            [onTimeLabel, "в срок"],
          ] as const
        ).map(([value, label]) => (
          <div key={label}>
            <dd className="tnum text-[15px] font-bold">{value}</dd>
            <dt className="text-[11.5px] text-mute">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 text-[13px] text-mute">
          {categoryNames.length > 0 ? categoryNames.join(", ") : null}
          {myDealsCount > 0 ? (
            <>
              {categoryNames.length > 0 ? " · " : null}
              <b className="text-ink">
                у вас {formatCount(myDealsCount, "сделка", "сделки", "сделок")}
              </b>
            </>
          ) : null}
        </span>
        <Button asChild variant="outline" className="h-9">
          <Link href={href}>Подробнее</Link>
        </Button>
        <Button asChild className="h-9">
          <Link href="/customer/rfqs/new">Запросить цену</Link>
        </Button>
      </div>
    </article>
  )
}
