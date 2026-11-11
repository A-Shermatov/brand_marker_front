"use client"

import Link from "next/link"
import { CaretLeftIcon as ChevronLeft } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { useCabinetCrumbs, useInSectionHub } from "@/components/layout/section-hub"

type PageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}

export const PageHeader = ({
  title,
  description,
  actions,
  backHref,
  backLabel = "Назад",
  className,
}: PageHeaderProps) => {
  // A page opened from the menu already has its name and description on
  // screen, the same as in the menu: only the page's own actions are added.
  const inHub = useInSectionHub()
  // Inside a section the trail above the title already leads back.
  const hasTrail = useCabinetCrumbs().length > 1
  const showBack = backHref && !hasTrail
  if (inHub && !backHref) {
    if (!actions) return null
    return (
      <div className={cn("mb-3 flex flex-wrap items-center justify-end gap-2", className)}>{actions}</div>
    )
  }
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {showBack ? (
          <Link
            href={backHref}
            className="mb-2 inline-flex h-8 -ml-2 items-center gap-1 rounded-md pl-1.5 pr-2.5 text-[13.5px] font-medium text-mute hover:bg-surface-muted hover:text-ink"
            aria-label={backLabel}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="text-balance text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-prose text-[14.5px] text-mute">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
