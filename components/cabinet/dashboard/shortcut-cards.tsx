import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr"

export type Shortcut = {
  title: string
  text: string
  icon: PhosphorIcon
  /** A page to open, or an action (the support chat). */
  href?: string
  onClick?: () => void
}

const CARD =
  "group flex w-full items-center gap-3.5 rounded-2xl border border-line bg-card p-4 text-left transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-[0_10px_24px_-16px_rgb(0_80_200/0.45)]"

/** Other ways into the platform, shown while the cabinet is still empty. */
export function ShortcutCards({ label, items }: { label: string; items: Shortcut[] }) {
  return (
    <ul aria-label={label} className="grid gap-3 md:grid-cols-3 bm-stagger">
      {items.map(({ title, text, icon: Icon, href, onClick }) => {
        const body = (
          <>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon weight="duotone" className="size-[22px]" aria-hidden />
            </span>
            <span className="grid min-w-0 flex-1">
              <b className="text-[15px] font-semibold text-ink">{title}</b>
              <span className="text-[13.5px] leading-snug text-mute">{text}</span>
            </span>
            <CaretRightIcon
              className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
              aria-hidden
            />
          </>
        )
        return (
          <li key={title}>
            {href ? (
              <Link href={href} className={CARD}>
                {body}
              </Link>
            ) : (
              <button type="button" onClick={onClick} className={CARD}>
                {body}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
