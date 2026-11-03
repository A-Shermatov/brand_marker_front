import Link from "next/link"
import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"

export type AttentionItem = {
  id: string
  title: string
  hint: string
  href: string
  Icon: PhosphorIcon
}

type AttentionListProps = {
  items: AttentionItem[]
}

export const AttentionList = ({ items }: AttentionListProps) => {
  if (items.length === 0) {
    return (
      <section aria-label="Требует внимания">
        <span className="text-[13px] font-semibold text-mute">
          Требует внимания
        </span>
        <div className="mt-2 rounded-xl border border-line bg-white p-6 text-[14px] text-mute">
          Сейчас всё в порядке — очереди пусты.
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Требует внимания">
      <span className="text-[13px] font-semibold text-mute">
        Требует внимания
      </span>
      <div className="mt-2 divide-y divide-line rounded-xl border border-line bg-white">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-canvas"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded bg-red-50 text-red-700">
              <item.Icon className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14.5px]">{item.title}</b>
              <span className="text-[13px] text-mute">{item.hint}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-mute" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  )
}
