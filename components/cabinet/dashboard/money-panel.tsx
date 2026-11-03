import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type MoneyStat = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}

type MoneyPanelProps = {
  label: string
  amount: React.ReactNode
  hint?: React.ReactNode
  stats: MoneyStat[]
  actions?: React.ReactNode
  className?: string
}

/**
 * Money at the top of a dashboard: what the bank holds right now, plus a few
 * supporting figures. White and flat so the numbers carry the weight.
 */
export function MoneyPanel({ label, amount, hint, stats, actions, className }: MoneyPanelProps) {
  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(28,28,26,.04)] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
        className,
      )}
    >
      <div className="relative p-5 md:p-6">
        <span className="absolute inset-y-5 left-0 w-[3px] rounded-r-full bg-brand-600 md:inset-y-6" aria-hidden />
        <p className="flex items-center gap-1.5 text-[13.5px] text-mute">
          <LockKeyIcon weight="fill" className="size-4 text-brand-600" aria-hidden />
          {label}
        </p>
        <p className="mt-1.5 text-[34px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">
          {amount}
        </p>
        {hint ? <p className="mt-2 text-[13.5px] text-mute">{hint}</p> : null}
        {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <dl className="grid content-center divide-y divide-line border-t border-line bg-canvas/50 md:border-t-0 md:border-l">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-baseline justify-between gap-4 px-5 py-4">
            <dt className="text-[13.5px] text-mute">{stat.label}</dt>
            <dd className="min-w-0 truncate text-right text-[15.5px] font-semibold text-ink tnum">
              {stat.value}
              {stat.hint ? (
                <span className="block text-[12px] font-normal text-mute">{stat.hint}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
