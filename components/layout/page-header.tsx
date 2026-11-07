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
  // Under a section header the title is already on screen as the active tab.
  const inHub = useInSectionHub()
  // Inside a section the trail above the title already leads back.
  const hasTrail = useCabinetCrumbs().length > 1
  const showBack = backHref && !hasTrail
  if (inHub && !backHref) {
    // The section header already names the page: a lone description would
    // only push the list down, so it shows only beside the page's actions.
    if (!actions) return null
    return (
      <div className={cn("mb-3 flex flex-wrap items-center justify-between gap-3", className)}>
        {description ? (
          <p className="min-w-0 max-w-prose truncate text-[13.5px] text-mute">{description}</p>
        ) : (
          <span />
        )}
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
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
