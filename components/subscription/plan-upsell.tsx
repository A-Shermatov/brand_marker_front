"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRightIcon, RocketLaunchIcon, XIcon } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { useSubscriptionQuery } from "@/hooks/api/use-supplier-subscription-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSavedValue } from "@/hooks/use-saved-value"
import { isApiEnabled } from "@/lib/api/config"
import { PLAN_SIDE_COPY, planName, type PlanSide } from "@/lib/subscription"
import type { SubscriptionPlan } from "@/lib/store/subscription-store"
import { cn } from "@/lib/utils"

const HIDE_FOR_MS = 14 * 24 * 60 * 60 * 1000

const TITLES: Record<PlanSide, string> = {
  buyer: "Поднимите заявки на первое место",
  supplier: "Поднимите товары и предложения на первое место",
}

type PlanUpsellProps = {
  side: PlanSide
  /** Where the strip stands, so hiding it in one place keeps it in another. */
  place: string
  className?: string
}

/**
 * One line that says what a plan would change right here, with the way to the
 * tariff page. Shown only to someone without a plan, and it stays hidden for
 * two weeks once closed: an offer, not a nag. With a plan on, the same place
 * confirms that it works.
 */
export function PlanUpsell({ side, place, className }: PlanUpsellProps) {
  const hydrated = useHydrated()
  const enabled = hydrated && isApiEnabled()
  const { data: subscription } = useSubscriptionQuery(side, enabled)
  const key = `bm-plan-upsell:${side}:${place}`
  const saved = useSavedValue(key)
  const [closed, setClosed] = useState(false)
  const copy = PLAN_SIDE_COPY[side]

  if (!enabled || !subscription || saved === undefined) return null

  if (subscription.is_active) {
    return (
      <p
        data-testid="plan-active-note"
        className={cn(
          "flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13.5px] text-amber-800",
          className,
        )}
      >
        <RocketLaunchIcon weight="fill" className="size-4 shrink-0" aria-hidden />
        <span>
          Тариф «{planName(subscription.plan as SubscriptionPlan)}» работает: {copy.active.charAt(0).toLowerCase()}
          {copy.active.slice(1)}
        </span>
      </p>
    )
  }

  const hiddenUntil = saved ? Number(saved) : 0
  if (closed || hiddenUntil > Date.now()) return null

  const hide = () => {
    setClosed(true)
    try {
      window.localStorage.setItem(key, String(Date.now() + HIDE_FOR_MS))
    } catch {
      // Private mode: the strip is hidden until the page is opened again.
    }
  }

  return (
    <aside
      aria-label="Подписка"
      data-testid="plan-upsell"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 bm-rise",
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800" aria-hidden>
        <RocketLaunchIcon weight="duotone" className="size-5" />
      </span>
      <div className="min-w-[220px] flex-1">
        <p className="text-[14.5px] font-semibold text-ink">{TITLES[side]}</p>
        <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">{copy.idle}</p>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <Link href={copy.href}>
          Посмотреть тарифы
          <ArrowRightIcon weight="bold" className="size-3.5" aria-hidden />
        </Link>
      </Button>
      <button
        type="button"
        onClick={hide}
        aria-label="Скрыть предложение о подписке"
        className="grid size-8 shrink-0 place-items-center rounded-md text-mute transition-colors hover:bg-amber-100 hover:text-ink"
      >
        <XIcon className="size-4" aria-hidden />
      </button>
    </aside>
  )
}
