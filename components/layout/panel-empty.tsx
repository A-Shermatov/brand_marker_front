import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type PanelEmptyProps = {
  icon: PhosphorIcon
  /** What will appear here and when. */
  text: React.ReactNode
  /** The step that fills this block, if there is one. */
  action?: { label: string; href: string }
  /** "ok" is for "nothing left to do", a good state rather than an absence. */
  tone?: "muted" | "ok"
  className?: string
}

/** An empty block on a dashboard: says what will be here instead of "nothing yet". */
export function PanelEmpty({ icon: Icon, text, action, tone = "muted", className }: PanelEmptyProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-3.5",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          tone === "ok" ? "bg-safe-50 text-safe-700" : "bg-surface-muted text-mute",
        )}
        aria-hidden
      >
        <Icon weight={tone === "ok" ? "bold" : "regular"} className="size-[18px]" />
      </span>
      <p className="min-w-0 flex-1 text-[14px] leading-snug text-mute">{text}</p>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-[13.5px] font-semibold text-brand-700 hover:underline"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
