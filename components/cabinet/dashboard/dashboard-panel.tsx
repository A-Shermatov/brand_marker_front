import Link from "next/link"
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type DashboardPanelProps = {
  title: string
  href?: string
  linkLabel?: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DashboardPanel({
  title,
  href,
  linkLabel = "Все",
  badge,
  children,
  className,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15.5px] font-semibold text-ink">{title}</h2>
          {badge}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-mute hover:text-ink"
          >
            {linkLabel}
            <CaretRightIcon className="size-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}
