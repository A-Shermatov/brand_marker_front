import Link from "next/link"
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"

export type BreakdownRow = {
  label: string
  value: number
  href: string
  color: string
  hint?: string
}

type BreakdownCardProps = {
  title: string
  rows: BreakdownRow[]
  footer?: React.ReactNode
}

/** Counts by stage with proportional bars; every row opens the filtered list. */
export function BreakdownCard({ title, rows, footer }: BreakdownCardProps) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <section className="flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
      <h2 className="text-[15.5px] font-semibold text-ink">{title}</h2>
      <ul className="mt-3 grid flex-1 content-start gap-1">
        {rows.map((row) => (
          <li key={row.label}>
            <Link
              href={row.href}
              className="group grid gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-muted/70"
            >
              <span className="flex items-center gap-2 text-[14px]">
                <span className="min-w-0 flex-1 truncate text-ink-soft group-hover:text-ink">{row.label}</span>
                <b className="font-semibold text-ink tnum">{row.value}</b>
                <CaretRightIcon className="size-3.5 text-faint" aria-hidden />
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${row.value ? Math.max(4, (row.value / max) * 100) : 0}%`, background: row.color }}
                />
              </span>
              {row.hint ? <span className="text-[12px] text-mute">{row.hint}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-3 border-t border-line pt-3">{footer}</div> : null}
    </section>
  )
}
