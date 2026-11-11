import type { ReactNode } from "react"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type RequestFact = {
  icon: PhosphorIcon
  label: string
  value: ReactNode
  /** A second, quieter line: «осталось 7 дней». */
  hint?: ReactNode
  /** Draw the hint in amber: little time left, or something to mind. */
  attention?: boolean
  /** Take the whole row: an address, or a fact that stands alone. */
  wide?: boolean
}

/**
 * One fact about a request — the budget, a deadline, where to deliver — as a
 * small tile: an icon that says what it is, a quiet label, the value in bold.
 * A row of them answers "what are the terms?" at a glance.
 */
export function FactTile({
  icon: Icon,
  label,
  value,
  hint,
  attention = false,
  wide = false,
  className,
}: RequestFact & { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-xl border border-line bg-canvas/70 p-3.5",
        wide && "sm:col-span-full",
        className,
      )}
    >
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-card text-brand-600"
        aria-hidden
      >
        <Icon weight="duotone" className="size-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-[12.5px] leading-tight text-mute">{label}</dt>
        <dd className="mt-1">
          <span className="block wrap-break-word text-[15px] font-semibold leading-snug text-ink">{value}</span>
          {hint ? (
            <span
              className={cn(
                "mt-0.5 block text-[12.5px] leading-snug",
                attention ? "font-medium text-amber-700" : "text-mute",
              )}
            >
              {hint}
            </span>
          ) : null}
        </dd>
      </div>
    </div>
  )
}

/** Fact tiles in a grid: one across on a phone, then two, and three where the page is wide. */
export function FactGrid({
  facts,
  columns = 3,
  className,
}: {
  facts: RequestFact[]
  columns?: 2 | 3
  className?: string
}) {
  return (
    <dl className={cn("grid gap-2.5 sm:grid-cols-2", columns === 3 && "lg:grid-cols-3", className)}>
      {facts.map((fact) => (
        <FactTile key={fact.label} {...fact} />
      ))}
    </dl>
  )
}
