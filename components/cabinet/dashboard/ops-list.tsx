import { ArrowDownLeftIcon as ArrowDownLeft, ArrowUpRightIcon as ArrowUpRight, LockIcon as Lock } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type OpsTone = "hold" | "in" | "out"

export type OpsItem = {
  id: string
  title: string
  meta: string
  amount: string
  status: string
  tone: OpsTone
}

const TONE_ICON: Record<OpsTone, PhosphorIcon> = {
  hold: Lock,
  in: ArrowDownLeft,
  out: ArrowUpRight,
}

const TONE_ICON_CLASS: Record<OpsTone, string> = {
  hold: "bg-surface-muted text-ink-soft",
  in: "bg-brand-50 text-brand-700",
  out: "bg-surface-muted text-mute",
}

const TONE_AMOUNT: Record<OpsTone, string> = {
  hold: "text-ink",
  in: "text-safe-700",
  out: "text-ink",
}

type OpsListProps = {
  items: OpsItem[]
  emptyText?: string
}

export function OpsList({
  items,
  emptyText = "Операций пока нет.",
}: OpsListProps) {
  if (items.length === 0) {
    return <p className="py-4 text-[14px] text-mute">{emptyText}</p>
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => {
        const Icon = TONE_ICON[item.tone]
        return (
          <li key={item.id} className="flex items-start gap-3 py-3">
            <span
              className={cn(
                "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                TONE_ICON_CLASS[item.tone],
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[14px] font-medium text-ink">
                {item.title}
              </b>
              <span className="block text-[12.5px] text-mute tnum">{item.meta}</span>
            </span>
            <span className="shrink-0 text-right">
              <b className={cn("block tnum text-[14px] font-semibold", TONE_AMOUNT[item.tone])}>
                {item.amount}
              </b>
              <span className="text-[12px] text-mute">{item.status}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
