"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ReputationBadge, SurfaceCard, TrustMark } from "@/components/bm"
import { PageFrame, PageHeader } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { useAdminCompaniesQuery } from "@/hooks/api/use-admin-companies-query"
import {
  resolveReputationTier,
  reputationTierLabel,
  type ReputationTier,
} from "@/lib/trust-levels"
import { cn } from "@/lib/utils"

const TIER_ORDER: ReputationTier[] = ["diamond", "gold", "silver", "none"]

export default function AdminTrustPage() {
  const [query, setQuery] = useState("")
  const { data, isLoading, isError, refetch } = useAdminCompaniesQuery({
    page: 1,
    pageSize: 100,
    status: "all",
    query: "",
    actorType: "supplier",
    sort: "rating",
    order: "desc",
  })

  const rows = useMemo(() => {
    const items = data?.items ?? []
    return items.map((c) => {
      const completed = Number(c.contracts_count ?? 0)
      const tier = resolveReputationTier({
        verification_status: c.verification_status,
        completed_contracts: completed,
        rating: c.rating,
        success_rate: null,
      })
      return {
        id: c.id,
        title: c.title,
        rating: c.rating,
        completed,
        verified: c.verification_status === "verified",
        verification: c.verification_status,
        tier,
      }
    })
  }, [data?.items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => r.title.toLowerCase().includes(q))
  }, [query, rows])

  const counts = useMemo(() => {
    const base: Record<ReputationTier, number> = {
      none: 0,
      silver: 0,
      gold: 0,
      diamond: 0,
    }
    for (const r of rows) base[r.tier] += 1
    return base
  }, [rows])

  return (
    <PageFrame>
      <PageHeader
        title="Знак надёжности"
        description={`Серебро ${counts.silver} · золото ${counts.gold} · алмаз ${counts.diamond} · без знака ${counts.none}. Выдаётся автоматически, пересчёт по правилам площадки.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIER_ORDER.map((tier) => (
          <SurfaceCard
            key={tier}
            className="flex items-center gap-3 p-4"
            padded={false}
          >
            <TrustMark tier={tier === "none" ? "none" : tier} size={36} />
            <span>
              <b className="tnum block text-[20px] text-ink">{counts[tier]}</b>
              <span className="text-[12.5px] text-mute">
                {reputationTierLabel(tier)}
              </span>
            </span>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard padded={false} className="overflow-hidden">
        <div className="border-b border-line p-4">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск поставщика"
            aria-label="Поиск поставщика"
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="animate-pulse p-8 text-mute">Загрузка…</div>
        ) : isError ? (
          <div className="grid gap-3 p-8 text-center">
            <p className="text-sm text-mute">Не удалось загрузить компании</p>
            <button
              type="button"
              className="mx-auto text-sm font-semibold text-brand-700 underline"
              onClick={() => refetch()}
            >
              Повторить
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-mute">Поставщики не найдены</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead className="border-b border-line bg-canvas text-[12.5px] text-mute">
                <tr>
                  <th className="px-4 py-3 font-semibold">Поставщик</th>
                  <th className="px-4 py-3 font-semibold">Знак надёжности</th>
                  <th className="px-4 py-3 font-semibold">Проверка</th>
                  <th className="px-4 py-3 font-semibold">Сделки</th>
                  <th className="px-4 py-3 font-semibold">Рейтинг</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/companies/${row.id}`}
                        className="font-semibold text-ink hover:underline"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {row.tier !== "none" ? (
                        <ReputationBadge tier={row.tier} />
                      ) : (
                        <span className="whitespace-nowrap text-[13px] text-mute">
                          без знака
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-[13px]",
                          row.verified ? "text-brand-700" : "text-red-600",
                        )}
                      >
                        {row.verified ? "да" : row.verification}
                      </span>
                    </td>
                    <td className="px-4 py-3 tnum">{row.completed}</td>
                    <td className="px-4 py-3 tnum">
                      {row.rating > 0 ? row.rating.toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </PageFrame>
  )
}
