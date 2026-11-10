"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"

type RouteErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
  /** Where "home" is for this part of the site. */
  homeHref?: string
  homeLabel?: string
}

/**
 * A page failed to open. Says what happened in plain words, offers to try
 * again, and keeps a way out — the menu around it stays in place.
 */
export function RouteError({ error, reset, homeHref = "/", homeLabel = "На главную" }: RouteErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="grid min-h-[55dvh] place-items-center px-4 py-10">
      <div className="grid max-w-[460px] justify-items-center gap-2 text-center bm-rise" role="alert">
        <span className="mb-2 grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700" aria-hidden>
          <WarningCircleIcon weight="duotone" className="size-8" />
        </span>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Страница не открылась</h1>
        <p className="text-[14.5px] leading-relaxed text-mute">
          Это ошибка на нашей стороне, ваши данные не пострадали. Попробуйте ещё раз — обычно это помогает.
          Если не помогло, напишите в поддержку.
        </p>
        {error.digest ? (
          <p className="text-[12.5px] text-faint">Код для поддержки: {error.digest}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset}>
            <ArrowClockwiseIcon weight="bold" className="size-4" />
            Попробовать ещё раз
          </Button>
          <Button asChild variant="outline">
            <Link href={homeHref}>{homeLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
