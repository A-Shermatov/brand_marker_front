"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { MOCK_BUYER_SPEND, MOCK_SPEND_NOTE } from "@/lib/mock/buyer-spend"

type SpendChartProps = {
  /** Monthly pairs [label, amount]. Falls back to mock when empty. */
  series?: [string, number][]
  note?: string
  year?: number
}

const formatNum = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n)

export const SpendChart = ({
  series,
  note = MOCK_SPEND_NOTE,
  year = 2026,
}: SpendChartProps) => {
  const [view, setView] = useState<"chart" | "table">("chart")
  const data = series && series.length > 0 ? series : MOCK_BUYER_SPEND

  const { ticks, top, H } = useMemo(() => {
    const max = Math.max(...data.map(([, v]) => v), 1)
    const H = 150
    const ticks = [0, 50000, 100000, 150000, 200000].filter(
      (t) => t <= Math.ceil(max / 50000) * 50000,
    )
    const top = ticks[ticks.length - 1] || 50000
    return { ticks, top, H }
  }, [data])

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-mute">
          Расходы по месяцам, TJS
        </span>
        <div className="flex overflow-hidden rounded border border-line text-[12px]">
          {(
            [
              ["chart", "График"],
              ["table", "Таблица"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              className={cn(
                "px-2.5 py-1 transition",
                view === k
                  ? "bg-brand-500 text-white"
                  : "hover:bg-canvas",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <table className="w-full text-[14px]">
          <tbody className="divide-y divide-line">
            {data.map(([m, v]) => (
              <tr key={m}>
                <td className="py-2">
                  {m} {year}
                </td>
                <td className="mono py-2 text-right">{formatNum(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative pl-12" style={{ height: H + 28 }}>
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute right-0 left-0 flex items-center gap-2"
              style={{ bottom: 28 + (t / top) * H }}
            >
              <span className="mono w-10 text-right text-[11px] text-mute">
                {t ? `${formatNum(t / 1000)}k` : "0"}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
          ))}
          <div className="absolute top-0 right-0 bottom-7 left-12 flex items-end gap-3 sm:gap-5">
            {data.map(([m, v], i) => {
              const last = i === data.length - 1
              const h = Math.max(2, (v / top) * H)
              return (
                <div
                  key={m}
                  tabIndex={0}
                  className="bar-col relative flex h-full flex-1 items-end justify-center outline-none"
                >
                  <div
                    className={cn(
                      "w-full max-w-[36px] rounded-t-[3px]",
                      last ? "bg-brand-500" : "bg-brand-200",
                    )}
                    style={{ height: h }}
                  />
                  <div
                    className={cn(
                      "bar-tip mono absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded bg-brand-500 px-2 py-1 text-[12px] text-white",
                      last ? "right-0" : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    {m}: {formatNum(v)} TJS
                  </div>
                  {last ? (
                    <span
                      className="mono absolute text-[11.5px] font-semibold"
                      style={{ bottom: h + 4 }}
                    >
                      {formatNum(Math.round(v / 1000))}k
                    </span>
                  ) : null}
                  <span className="absolute -bottom-6 text-[12px] text-mute">
                    {m}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {note ? (
        <p className="mt-3 text-[12.5px] text-mute">{note}</p>
      ) : null}
    </div>
  )
}
