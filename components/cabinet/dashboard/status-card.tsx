import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

export type StatusFact = {
  label: string
  value: React.ReactNode
  /** Something here waits for the person: the number is drawn in amber. */
  attention?: boolean
}

type StatusCardProps = {
  /** The same icon and name the menu uses for this part of the cabinet. */
  icon: PhosphorIcon
  title: string
  facts: StatusFact[]
  href: string
  linkLabel: string
  loading?: boolean
}

/**
 * One part of the cabinet on the home page: its name as in the menu, two or
 * three numbers in plain words, and the way in. The home page is a map of the
 * cabinet, so the cards mirror the menu and teach where things are.
 */
export function StatusCard({ icon: Icon, title, facts, href, linkLabel, loading = false }: StatusCardProps) {
  return (
    <section
      aria-label={title}
      className="flex flex-col rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgb(14_22_48/0.04)]"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600" aria-hidden>
          <Icon weight="duotone" className="size-5" />
        </span>
        <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
      </div>
      <dl className="mt-4 grid flex-1 content-start gap-2.5">
        {facts.map((fact) => (
          <div key={fact.label} className="flex items-baseline justify-between gap-3">
            <dt className="min-w-0 text-[14px] text-ink-soft">{fact.label}</dt>
            <dd
              className={cn(
                "shrink-0 whitespace-nowrap text-[17px] font-semibold tnum",
                fact.attention ? "text-amber-700" : "text-ink",
              )}
            >
              {loading ? (
                <span className="inline-block h-[18px] w-14 rounded-md align-middle bm-shimmer" aria-label="Загрузка" />
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        href={href}
        className="group mt-4 inline-flex h-9 items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 text-[13.5px] font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      >
        {linkLabel}
        <ArrowRightIcon
          weight="bold"
          className="size-3.5 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700"
          aria-hidden
        />
      </Link>
    </section>
  )
}

/** A plain heading for a block of the home page, with one line on what it is. */
export function HomeHeading({ title, hint, badge }: { title: string; hint?: string; badge?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] text-ink">
        {title}
        {badge}
      </h2>
      {hint ? <p className="mt-0.5 text-[13.5px] text-mute">{hint}</p> : null}
    </div>
  )
}
