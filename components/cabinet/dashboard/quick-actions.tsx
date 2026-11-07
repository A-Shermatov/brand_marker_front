import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"

export type QuickAction = {
  href: string
  label: string
  Icon: PhosphorIcon
}

type QuickActionsProps = {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map(({ href, label, Icon }) => (
        <Link
          key={href + label}
          href={href}
          className="flex items-center gap-2.5 rounded-2xl border border-line bg-card px-3.5 py-3 text-[14px] font-semibold text-ink transition hover:border-line-strong hover:shadow-[0_10px_24px_-12px_rgba(28,28,26,.18)]"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-ink">
            <Icon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 leading-snug">{label}</span>
        </Link>
      ))}
    </div>
  )
}
