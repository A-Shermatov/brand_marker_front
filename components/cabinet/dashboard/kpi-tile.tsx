import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type KpiTileProps = {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: PhosphorIcon
  href?: string
  /** Draws attention when something waits for the user */
  tone?: "default" | "brand" | "attention"
}

const TONES = {
  default: "bg-surface-muted text-ink-soft",
  brand: "bg-brand-50 text-brand-700",
  attention: "bg-amber-100 text-amber-800",
}

/** One headline number with what it means; the whole tile opens the section. */
export function KpiTile({ label, value, hint, icon: Icon, href, tone = "default" }: KpiTileProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-medium text-ink-soft">{label}</p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", TONES[tone])}>
          <Icon weight="duotone" className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink tnum">{value}</p>
      {hint ? (
        <p className="mt-2 flex items-center gap-1 text-[12.5px] text-mute">
          <span className="min-w-0 flex-1 truncate">{hint}</span>
          {href ? <CaretRightIcon className="size-3.5 shrink-0 text-faint" aria-hidden /> : null}
        </p>
      ) : null}
    </>
  )
  const className =
    "block rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(28,28,26,.04)] transition-colors"
  return href ? (
    <Link href={href} className={cn(className, "hover:border-line-strong")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}
