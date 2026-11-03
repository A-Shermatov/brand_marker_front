import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type MetricTileProps = {
  label: string
  value: string
  /** Full value for native tooltip when the display value is truncated/compact. */
  valueTitle?: string
  /** Plain-language explanation of what the number means. */
  hint?: string
  href?: string
  valueClassName?: string
  /** Optional icon — template v5 stats have no icon. */
  Icon?: PhosphorIcon
}

export const MetricTile = ({
  Icon,
  label,
  value,
  valueTitle,
  hint,
  href,
  valueClassName,
}: MetricTileProps) => {
  const content = (
    <>
      {Icon ? (
        <div className="flex min-w-0 items-center gap-2 text-[14px] text-mute">
          <Icon size={16} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </div>
      ) : (
        <span className="truncate text-[14px] text-mute">{label}</span>
      )}
      <div
        title={valueTitle ?? value}
        className={cn(
          "tnum min-w-0 truncate text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink",
          valueClassName,
        )}
      >
        {value}
      </div>
      {hint ? <div className="truncate text-[13px] text-mute">{hint}</div> : null}
    </>
  )
  const className =
    "grid min-w-0 content-start gap-1.5 overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]"

  if (!href) return <div className={className}>{content}</div>
  return (
    <Link
      href={href}
      className={cn(className, "transition hover:border-line-strong")}
    >
      {content}
    </Link>
  )
}
