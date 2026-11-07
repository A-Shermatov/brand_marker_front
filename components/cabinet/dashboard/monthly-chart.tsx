"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartBarIcon } from "@phosphor-icons/react/dist/ssr"
import type { MonthPoint } from "@/lib/dashboard-series"
import { monthOverMonth, seriesTotal } from "@/lib/dashboard-series"
import { cn } from "@/lib/utils"

export type ChartSeries = {
  key: string
  label: string
  color: string
}

type MonthlyChartProps = {
  title: string
  points: MonthPoint[]
  series: ChartSeries[]
  currency?: string
  emptyText: string
  loading?: boolean
}

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(value)

const short = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1).replace(".0", "")} млн`
    : value >= 1000
      ? `${Math.round(value / 1000)} тыс`
      : String(Math.round(value))

/** Stacked monthly bars with the period total and the change against last month. */
export function MonthlyChart({
  title,
  points,
  series,
  currency = "TJS",
  emptyText,
  loading = false,
}: MonthlyChartProps) {
  const primary = series[0]!
  const total = series.reduce((sum, s) => sum + seriesTotal(points, s.key), 0)
  const change = monthOverMonth(points, primary.key)
  const data = points.map((p) => ({ label: p.label, ...p.values }))
  const empty = !loading && total <= 0

  return (
    <section className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15.5px] font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
            {loading ? "—" : `${money(total)} ${currency}`}
          </p>
          <p className="mt-1 text-[12.5px] text-mute">
            за {points.length} мес.
            {change !== null ? (
              <span className={cn("ml-1.5 font-medium", change >= 0 ? "text-brand-700" : "text-red-700")}>
                {change >= 0 ? "+" : ""}
                {change}% к прошлому месяцу
              </span>
            ) : null}
          </p>
        </div>
        {series.length > 1 ? (
          <ul className="flex flex-wrap gap-3 text-[12.5px] text-ink-soft">
            {series.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-4 min-h-[180px] flex-1">
        {empty ? (
          <div className="grid h-full min-h-[180px] place-items-center rounded-xl border border-dashed border-line-strong text-center">
            <div className="grid justify-items-center gap-2 px-6">
              <ChartBarIcon weight="duotone" className="size-7 text-faint" aria-hidden />
              <p className="max-w-xs text-[13.5px] text-mute">{emptyText}</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--mute)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={short}
                tick={{ fontSize: 12, fill: "var(--faint)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--surface-muted)" }}
                formatter={(value: number, name: string) => [
                  `${money(value)} ${currency}`,
                  series.find((s) => s.key === name)?.label ?? name,
                ]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  boxShadow: "0 12px 24px -12px rgba(28,28,26,.25)",
                  fontSize: 13,
                }}
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="month"
                  fill={s.color}
                  radius={i === series.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={44}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
