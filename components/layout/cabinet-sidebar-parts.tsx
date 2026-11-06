import Link from "next/link"
import { HeadsetIcon, XIcon } from "@phosphor-icons/react/dist/ssr"
import { BrandLogo, CompanyName } from "@/components/bm"
import { cn } from "@/lib/utils"

export function SidebarTop({ onClose }: { onClose?: () => void }) {
  if (onClose) {
    return (
      <div className="mb-2 flex items-center justify-between border-b border-line pb-3">
        <BrandLogo small />
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-lg text-mute hover:bg-surface-muted hover:text-ink"
          aria-label="Закрыть меню"
        >
          <XIcon className="size-5" />
        </button>
      </div>
    )
  }
  return (
    <div className="hidden h-12 items-center px-1 lg:flex">
      <BrandLogo small />
    </div>
  )
}

type SidebarAccountProps = {
  href: string
  name: string
  role: string
  initials: string
  verified?: boolean
  tier?: string | null
  plan?: string | null
  onClick?: () => void
}

/** Current company with its marks; opens the company page. */
export function SidebarAccount({
  href,
  name,
  role,
  initials,
  verified,
  tier,
  plan,
  onClick,
}: SidebarAccountProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="my-2 flex items-center gap-2.5 rounded-xl border border-line bg-white p-2.5 shadow-[0_1px_2px_rgba(28,28,26,.04)] transition-colors hover:border-line-strong"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-700 text-[12.5px] font-semibold tracking-wide text-white">
        {initials}
      </span>
      <span className="grid min-w-0 flex-1">
        <CompanyName name={name} verified={verified} tier={tier} plan={plan} size="sm" nameClassName="text-[14px]" />
        <span className="truncate text-[12.5px] text-mute">{role}</span>
      </span>
    </Link>
  )
}

export function SidebarSection({
  label,
  children,
  className,
}: {
  label?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      {label ? (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-mute">{label}</p>
      ) : null}
      {children}
    </div>
  )
}

export function SidebarSupport({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-line-strong"
    >
      <HeadsetIcon className="size-5 shrink-0 text-brand-600" aria-hidden />
      <span className="grid min-w-0">
        <span className="text-[14px] font-semibold text-ink">Поддержка</span>
        <span className="truncate text-[12.5px] text-mute">Ответим в чате в течение часа</span>
      </span>
    </button>
  )
}

export const initialsOf = (value: string | null | undefined, fallback: string) =>
  value
    ? value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("") || fallback
    : fallback
