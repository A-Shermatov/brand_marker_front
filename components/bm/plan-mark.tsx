"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { normalizePlan, planMarkHint, type PaidPlan } from "@/lib/subscription"
import { PLAN_LOOKS, PLAN_RANKS, SMALL_MARK_MAX, SmallPlanGlyph } from "@/components/bm/small-marks"

type PlanMarkProps = {
  plan: string | null | undefined
  size?: number
  className?: string
  decorative?: boolean
  /** Turn off the mini animation (tables, print). */
  still?: boolean
}

type Tier = PaidPlan | "free"

/** Stable per-instance offset so marks on one page do not move in lockstep. */
const offsetFor = (seed: string) => {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (h % 23) / 10
}

function sparkle(x: number, y: number, s: number) {
  const k = s * 0.24
  return `M${x} ${y - s}Q${x + k} ${y - k} ${x + s} ${y}Q${x + k} ${y + k} ${x} ${y + s}Q${x - k} ${y + k} ${x - s} ${y}Q${x - k} ${y - k} ${x} ${y - s}Z`
}

/** Chevron rows (top y of each) on the 24-unit grid, per number of ranks. */
const RANK_ROWS: Record<number, number[]> = { 1: [10.1], 2: [7.9, 12.5], 3: [6.1, 10.4, 14.7] }
const chevron = (y: number) => `M6.6 ${y + 4.2} 12 ${y} 17.4 ${y + 4.2}`

function Glyph({ tier, uid, animate, delay }: { tier: Tier; uid: string; animate: boolean; delay: string }) {
  const style = animate ? { animationDelay: delay } : undefined
  const look = PLAN_LOOKS[tier]
  if (tier === "free") {
    return (
      <path
        data-glyph="check"
        d="M7.6 12.4l3 3 5.9-6.2"
        fill="none"
        stroke={look.ink}
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }
  const ranks = PLAN_RANKS[tier]
  return (
    <>
      <g
        data-glyph={`rank-${ranks}`}
        className={animate && tier === "start" ? "bm-plan-flash" : undefined}
        style={style}
        fill="none"
        stroke={look.ink === "gold" ? `url(#${uid}gold)` : look.ink}
        strokeWidth={ranks === 3 ? 2.4 : 2.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {RANK_ROWS[ranks]!.map((y) => (
          <path key={y} d={chevron(y)} />
        ))}
      </g>
      {tier === "business" ? (
        <path
          className={animate ? "bm-tw" : undefined}
          style={style}
          d={sparkle(18.6, 5.4, 1.7)}
          fill="#FFE78A"
          opacity={animate ? undefined : 0.9}
        />
      ) : null}
    </>
  )
}

function Tile({ tier, size, className, decorative, still, label }: {
  tier: Tier
  size: number
  className?: string
  decorative: boolean
  still: boolean
  label: string
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const look = PLAN_LOOKS[tier]
  const animate = !still && tier !== "free"
  const delay = `${offsetFor(uid)}s`
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label }

  if (size <= SMALL_MARK_MAX) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        data-plan={tier}
        data-size="small"
        className={cn("shrink-0", className)}
        {...a11y}
      >
        {decorative ? null : <title>{label}</title>}
        <SmallPlanGlyph tier={tier} uid={uid} moving={animate} delay={delay} />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      data-plan={tier}
      className={cn("shrink-0", className)}
      {...a11y}
    >
      {decorative ? null : <title>{label}</title>}
      <defs>
        <linearGradient id={`${uid}t`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={look.tile[0]} />
          <stop offset="1" stopColor={look.tile[1]} />
        </linearGradient>
        <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE78A" />
          <stop offset="1" stopColor="#F2A900" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x="1" y="1" width="22" height="22" rx="6.5" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill={`url(#${uid}t)`} />
      <rect
        x="1.6"
        y="1.6"
        width="20.8"
        height="20.8"
        rx="6"
        fill="none"
        stroke={look.edge}
        strokeOpacity={look.edgeOpacity}
        strokeWidth={0.9}
      />
      {/* Soft gloss over the top of the tile. */}
      <path d="M1 7.5A6.5 6.5 0 0 1 7.5 1h9A6.5 6.5 0 0 1 23 7.5V9C16 7 8 7 1 10Z" fill="#FFFFFF" opacity={tier === "start" ? 0.5 : 0.14} />
      {(tier === "pro" || tier === "business") && animate ? (
        <g clipPath={`url(#${uid}c)`}>
          <rect
            className="bm-plan-sweep"
            style={{ animationDelay: delay }}
            x={-14}
            y={-4}
            width={8}
            height={32}
            fill={`url(#${uid}s)`}
          />
        </g>
      ) : null}
      <Glyph tier={tier} uid={uid} animate={animate} delay={delay} />
    </svg>
  )
}

/** Subscription plan mark (Старт / Про / Бизнес) shown next to a company name. */
export function PlanMark({ plan, size = 20, className, decorative = false, still = false }: PlanMarkProps) {
  const id = normalizePlan(plan)
  if (!id) return null
  return (
    <Tile tier={id} size={size} className={className} decorative={decorative} still={still} label={planMarkHint(id)} />
  )
}

/** The free tier, for tariff tables only: never shown next to names. */
export function FreePlanMark({ size = 20, className }: { size?: number; className?: string }) {
  return <Tile tier="free" size={size} className={className} decorative still label="Без подписки" />
}
