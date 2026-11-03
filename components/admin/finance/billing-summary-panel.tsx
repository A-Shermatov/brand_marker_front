"use client"

import Link from "next/link"
import { SurfaceCard } from "@/components/bm"
import { useAdminCompaniesQuery } from "@/hooks/api/use-admin-companies-query"
import { useAdminDashboardQuery } from "@/hooks/api/use-admin-dashboard-query"
import { useAdminFinanceQuery } from "@/hooks/api/use-admin-finance-query"
import { formatCurrency } from "@/lib/format"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

/** HTML `aBilling` summary — revenue mix + VIP supplier counts. */
export function AdminBillingSummaryPanel() {
  const dashboard = useAdminDashboardQuery()
  const subs = useAdminFinanceQuery({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    view: "subscriptions",
    query: "",
  })
  const commission = useAdminFinanceQuery({
    page: 1,
    pageSize: 1,
    view: "commission",
    query: "",
  })
  const vipCompanies = useAdminCompaniesQuery({
    page: 1,
    pageSize: 1,
    status: "all",
    query: "",
    actorType: "supplier",
    vip: true,
  })
  const freeCompanies = useAdminCompaniesQuery({
    page: 1,
    pageSize: 1,
    status: "all",
    query: "",
    actorType: "supplier",
    vip: false,
  })

  const monthly = dashboard.data?.metrics.monthly_revenue ?? null
  const subsTotal = subs.data?.total ?? 0
  const commissionTotal = commission.data?.total ?? 0
  const vipCount = vipCompanies.data?.total ?? 0
  const freeCount = freeCompanies.data?.total ?? 0

  const stats = [
    {
      label: "Доход за месяц",
      value: monthly == null ? "—" : formatCurrency(monthly, "TJS"),
      hint: "все источники",
    },
    {
      label: "Записей комиссии",
      value: String(commissionTotal),
      hint: "операции view=commission",
    },
    {
      label: "Подписки в реестре",
      value: String(subsTotal),
      hint: "платежи подписок",
    },
    {
      label: "VIP поставщики",
      value: String(vipCount),
      hint: `без VIP · ${freeCount}`,
    },
  ]

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <SurfaceCard key={s.label} className="grid gap-1 p-4" padded={false}>
            <span className="text-[12.5px] text-mute">{s.label}</span>
            <b className="tnum text-[22px] font-bold text-ink">{s.value}</b>
            <span className="text-[12.5px] text-mute">{s.hint}</span>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard className="grid gap-3">
        <b className="text-[15px] text-ink">Поставщики по тарифам</b>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-[12px] font-bold text-white">
              VIP
            </span>
            <span>
              <b className="tnum block text-[20px] text-ink">{vipCount}</b>
              <span className="text-[12.5px] text-mute">Платный тариф</span>
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
            <span className="grid size-8 place-items-center rounded-lg bg-line text-[12px] font-bold text-ink">
              Free
            </span>
            <span>
              <b className="tnum block text-[20px] text-ink">{freeCount}</b>
              <span className="text-[12.5px] text-mute">Бесплатный</span>
            </span>
          </div>
        </div>
        <p className="text-[13px] text-mute">
          Цены тарифов и правила знака надёжности — в{" "}
          <Link href="/admin/settings" className="font-semibold text-brand-700 underline">
            настройках
          </Link>
          .
        </p>
      </SurfaceCard>
    </div>
  )
}
