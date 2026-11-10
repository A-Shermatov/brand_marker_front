"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
  ArrowRightIcon,
  BriefcaseIcon,
  MapPinIcon,
  PackageIcon,
  ShieldCheckIcon,
  LightningIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { usePublicRfqsQuery } from "@/hooks/api/use-public-query"
import { useCategoryOptions } from "@/hooks/use-category-options"
import { formatCurrency, formatRelativeIso, formatRfqBudget } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { RfqWithRelations } from "@/types"

/** How many requests show at once, and how often the next one arrives. */
const VISIBLE = 4
const EVERY_MS = 3200

/**
 * Requests from buyers, arriving one after another: the newest slides in at
 * the top with its budget, the oldest leaves at the bottom. Suppliers see
 * there is demand; a click opens the request (after signing in).
 */
export function LandingLiveRequests() {
  const { data } = usePublicRfqsQuery(true, { page: 1, pageSize: 16 })
  const pool = useMemo(() => data?.items ?? [], [data])
  const total = data?.total ?? 0
  // What the latest requests are worth together, by their lower budget bound.
  const budgetSum = pool.reduce(
    (sum, r) => sum + (r.budget_type !== "open" && r.budget_from ? Number(r.budget_from) : 0),
    0,
  )
  const reduce = useReducedMotion()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reduce || pool.length <= VISIBLE) return
    const timer = window.setInterval(() => setTick((n) => n + 1), EVERY_MS)
    return () => window.clearInterval(timer)
  }, [reduce, pool.length])

  // The feed shows a sliding window over the pool, newest first; each tick
  // brings the next one in at the top.
  const shown = useMemo(() => {
    if (pool.length <= VISIBLE) return pool
    const start = (pool.length - (tick % pool.length)) % pool.length
    return Array.from({ length: VISIBLE }, (_, i) => pool[(start + i) % pool.length]!)
  }, [pool, tick])

  if (pool.length === 0) return null

  return (
    <section
      className="relative overflow-hidden bg-[#0A1733] text-white"
      aria-labelledby="live-requests-title"
    >
      {/* A soft lime glow behind the feed, and a faint blue one behind the text. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_320px_at_78%_40%,rgb(217_245_70/0.16),transparent_70%),radial-gradient(600px_400px_at_10%_0%,rgb(47_128_255/0.28),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:px-8">
        <div className="grid content-start gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-volt-400/15 px-3 py-1 text-[13px] font-semibold text-volt-300 ring-1 ring-volt-400/30">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-volt-400 opacity-70 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-volt-400" />
            </span>
            Заявки прямо сейчас
          </span>
          <h2 id="live-requests-title" className="text-[30px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[34px]">
            Покупатели ищут поставщиков каждый день
          </h2>
          <p className="max-w-[460px] text-[16px] leading-relaxed text-[#C5D3F2]">
            Здесь видны свежие заявки с бюджетами. Поставщики отвечают предложением, покупатель
            выбирает лучшее — и платит через банк‑партнёр.
          </p>
          <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
            <div>
              <dt className="text-[13px] text-[#93A6CC]">Открытых заявок</dt>
              <dd className="text-[28px] font-bold text-volt-400 tnum">{total}</dd>
            </div>
            {budgetSum > 0 ? (
              <div>
                <dt className="text-[13px] text-[#93A6CC]">Бюджеты свежих заявок</dt>
                <dd className="text-[28px] font-bold text-volt-400 tnum">
                  <span className="text-[15px] font-medium text-[#93A6CC]">от </span>
                  {formatCurrency(budgetSum, pool.find((r) => r.budget_from)?.currency ?? "TJS")}
                </dd>
              </div>
            ) : null}
          </dl>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="border-volt-500/40 bg-volt-400 font-semibold text-volt-ink hover:bg-volt-300 dark:border-volt-500/40 dark:hover:bg-volt-300"
            >
              <Link href="/supplier/rfqs">
                Смотреть все заявки <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/register?role=supplier">Стать поставщиком</Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <ul className="grid gap-3" aria-label="Свежие заявки покупателей" aria-live="off">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((rfq, index) => (
                <motion.li
                  key={rfq.id}
                  layout
                  initial={{ opacity: 0, y: -28, scale: 0.97 }}
                  animate={{ opacity: index === VISIBLE - 1 ? 0.55 : 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 24, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                >
                  <LiveRequestCard rfq={rfq} fresh={index === 0 && tick > 0} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {/* The list fades out at the bottom, as if it went on. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0A1733] to-transparent" />
        </div>
      </div>
    </section>
  )
}

function LiveRequestCard({ rfq, fresh }: { rfq: RfqWithRelations; fresh: boolean }) {
  const { getRfqCategoryLabel } = useCategoryOptions()
  const category = getRfqCategoryLabel(rfq.category_id)
  const priced = rfq.budget_type !== "open" && Boolean(rfq.budget_from)
  const Icon = rfq.type === "product" ? PackageIcon : BriefcaseIcon
  const direct = rfq.payment_mode === "direct"
  return (
    <Link
      href={`/supplier/rfqs/${rfq.id}`}
      className={cn(
        "group grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-card p-4 transition-[border-color,box-shadow]",
        fresh
          ? "border-volt-400 shadow-[0_0_0_3px_rgb(217_245_70/0.25),0_16px_32px_-18px_rgb(0_0_0/0.6)]"
          : "border-transparent hover:border-volt-400/60",
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" weight="duotone" aria-hidden />
      </span>
      <span className="grid min-w-0 gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-mute">
          {category ? <span className="font-medium text-brand-700">{category}</span> : null}
          {rfq.type === "product" && rfq.quantity ? <span>· {rfq.quantity} шт</span> : null}
          {rfq.type === "product" && rfq.delivery_city ? (
            <span className="inline-flex items-center gap-0.5">
              · <MapPinIcon className="size-3.5" aria-hidden /> {rfq.delivery_city}
            </span>
          ) : null}
        </span>
        <span className="truncate text-[15.5px] font-semibold text-ink group-hover:text-brand-700">
          {rfq.title}
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-mute">
          {direct ? (
            <LightningIcon className="size-3.5 text-amber-600" aria-hidden />
          ) : (
            <ShieldCheckIcon className="size-3.5 text-safe-500" aria-hidden />
          )}
          {direct ? "оплата сразу" : "с гарантией"} · {formatRelativeIso(rfq.created_at)}
        </span>
      </span>
      <span className="text-right">
        <b className={cn("block text-[16px] font-bold tnum", priced ? "text-ink" : "text-mute")}>
          {priced
            ? formatRfqBudget(rfq.budget_type, rfq.budget_from, rfq.budget_to, rfq.currency)
            : "Цена — ваша"}
        </b>
        <span className="text-[12px] text-mute">{priced ? "бюджет" : "ждёт предложений"}</span>
      </span>
    </Link>
  )
}
