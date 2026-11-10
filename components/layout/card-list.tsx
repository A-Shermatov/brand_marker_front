import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

/**
 * Lists of the platform as cards, one item per row: what it is on the left
 * (meta line, title, who), the numbers and the one next step on the right.
 * Same look everywhere, so a person reads every list the same way.
 */

export type CardTone = "brand" | "safe" | "warn" | "danger" | "muted"

const BAR: Record<CardTone, string> = {
  brand: "bg-brand-500",
  safe: "bg-safe-500",
  warn: "bg-amber-500",
  danger: "bg-red-500",
  muted: "bg-line-strong",
}

const PILL: Record<CardTone, string> = {
  brand: "bg-brand-50 text-brand-700",
  safe: "bg-safe-50 text-safe-700",
  warn: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  muted: "bg-surface-muted text-mute",
}

export function CardList({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <ul aria-label={label} className={cn("grid gap-3 bm-stagger", className)}>
      {children}
    </ul>
  )
}

/** One item. `tone` draws a bar on the left: the state at a glance. */
export function ListCard({
  tone,
  dim = false,
  className,
  children,
  ...rest
}: {
  tone?: CardTone
  /** Closed, past or archived: still there, quieter. */
  dim?: boolean
  className?: string
  children: React.ReactNode
} & Omit<React.HTMLAttributes<HTMLLIElement>, "className" | "children">) {
  return (
    <li
      className={cn(
        "relative overflow-hidden rounded-2xl border border-line bg-card transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-[0_10px_24px_-16px_rgb(0_80_200/0.45)]",
        dim && "opacity-75",
        className,
      )}
      {...rest}
    >
      {tone ? <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", BAR[tone])} /> : null}
      {children}
    </li>
  )
}

/** Left: what it is. Right (`aside`): numbers and the next step; under it on phones. */
export function ListCardBody({
  aside,
  asideClassName,
  children,
}: {
  aside?: React.ReactNode
  asideClassName?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "grid gap-4 p-4 pl-5 md:items-center md:gap-8",
        aside ? "md:grid-cols-[minmax(0,1fr)_auto]" : null,
      )}
    >
      <div className="grid min-w-0 gap-1.5">{children}</div>
      {aside ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-3 md:flex-nowrap md:border-t-0 md:pt-0",
            asideClassName,
          )}
        >
          {aside}
        </div>
      ) : null}
    </div>
  )
}

/** Small facts above the title: category, kind, number. */
export function CardMeta({ children }: { children: React.ReactNode }) {
  return <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-mute">{children}</p>
}

export function CardChip({ tone = "brand", children }: { tone?: CardTone; children: React.ReactNode }) {
  return <span className={cn("rounded-md px-2 py-0.5 font-medium", PILL[tone])}>{children}</span>
}

/** Document number (З‑1234, БМ‑12): quiet, monospaced. */
export function CardNo({ children }: { children: React.ReactNode }) {
  return <span className="mono text-faint">{children}</span>
}

export function CardTitle({ href, children }: { href?: string; children: React.ReactNode }) {
  const className = "line-clamp-2 text-[16.5px] font-semibold leading-snug text-ink"
  return href ? (
    <Link href={href} className={cn(className, "hover:text-brand-700")}>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  )
}

/** A line under the title: who, from where, extra details. */
export function CardLine({ icon: Icon, className, children }: { icon?: PhosphorIcon; className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-soft", className)}>
      {Icon ? <Icon className="size-4 shrink-0 text-mute" aria-hidden /> : null}
      {children}
    </p>
  )
}

/** A labelled number on the right: "Бюджет / 6 000 TJS". */
export function CardFact({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("grid", className)}>
      <span className="text-[12px] text-mute">{label}</span>
      <b className="whitespace-nowrap text-[16px] font-semibold text-ink tnum">{children}</b>
    </div>
  )
}

/** A rounded state badge with an optional icon: "Осталось 9 дней", "Оплачено". */
export function StatusPill({
  tone = "brand",
  icon: Icon,
  className,
  children,
}: {
  tone?: CardTone
  icon?: PhosphorIcon
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-medium",
        PILL[tone],
        className,
      )}
    >
      {Icon ? <Icon weight="bold" className="size-4" aria-hidden /> : null}
      {children}
    </span>
  )
}

/** The next step at the end of the aside, aligned the same in every card. */
export function CardAction({ children }: { children: React.ReactNode }) {
  return <div className="ml-auto md:w-[160px] md:text-right">{children}</div>
}
