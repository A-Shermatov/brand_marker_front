"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { normalizePlan, planMarkHint, type PaidPlan } from "@/lib/subscription"

type PlanMarkProps = {
  plan: string | null | undefined
  size?: number
  className?: string
  decorative?: boolean
  /** Turn off the chevron animation (tables, print). */
  still?: boolean
}

type PlanStyle = {
  tile: [string, string]
  glyph: [string, string]
  chevrons: number[]
  stroke: number
  amp: number
  rim: string
  /** Gold light passing over the tile */
  shine?: boolean
}

// Square tiles with rank chevrons: deliberately unlike the shield-shaped
// reliability marks, so a paid plan never reads as an earned one.
const STYLES: Record<PaidPlan, PlanStyle> = {
  start: {
    tile: ["#5E8FEF", "#2E59C2"],
    glyph: ["#FFFFFF", "#E3ECFF"],
    chevrons: [13.4],
    stroke: 2.4,
    amp: 2.6,
    rim: "#FFFFFF",
  },
  pro: {
    tile: ["#2F3F72", "#141C3A"],
    glyph: ["#FFFFFF", "#9CC0FF"],
    chevrons: [10.4, 15.4],
    stroke: 2.3,
    amp: 2.5,
    rim: "#8FB2FF",
  },
  business: {
    tile: ["#2E2D2A", "#0C0C0B"],
    glyph: ["#FFEDB2", "#D29B2E"],
    chevrons: [8.6, 12.8, 17],
    stroke: 2.1,
    amp: 2.3,
    rim: "#C9963A",
    shine: true,
  },
}

/** Stable per-instance offset so marks on one page do not move in lockstep. */
const offsetFor = (seed: string) => {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (h % 23) / 10
}

/** Subscription plan mark (Старт / Про / Бизнес) shown next to a company name. */
export function PlanMark({
  plan,
  size = 20,
  className,
  decorative = false,
  still = false,
}: PlanMarkProps) {
  const uid = useId().replace(/:/g, "")
  const id = normalizePlan(plan)
  if (!id) return null
  const style = STYLES[id]
  const offset = offsetFor(uid)
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": planMarkHint(id) }
  // Bottom chevron first: the rank climbs upwards.
  const order = [...style.chevrons].reverse()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      data-plan={id}
      className={cn("shrink-0", className)}
      {...a11y}
    >
      {decorative ? null : <title>{planMarkHint(id)}</title>}
      <defs>
        <linearGradient id={`${uid}t`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={style.tile[0]} />
          <stop offset="1" stopColor={style.tile[1]} />
        </linearGradient>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={style.glyph[0]} />
          <stop offset="1" stopColor={style.glyph[1]} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFE9A8" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x="1" y="1" width="22" height="22" rx="6.5" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill={`url(#${uid}t)`} />
      <rect
        x="2.1"
        y="2.1"
        width="19.8"
        height="19.8"
        rx="5.5"
        fill="none"
        stroke={style.rim}
        strokeOpacity={0.4}
        strokeWidth={0.8}
      />
      <path d="M1 7.5A6.5 6.5 0 0 1 7.5 1h9A6.5 6.5 0 0 1 23 7.5V9C16 7 8 7 1 10Z" fill="#fff" opacity={0.12} />
      {style.shine && !still ? (
        <g clipPath={`url(#${uid}c)`}>
          <rect
            className="bm-plan-sweep"
            style={{ animationDelay: `${offset}s` }}
            x={-14}
            y={-4}
            width={8}
            height={32}
            fill={`url(#${uid}s)`}
          />
        </g>
      ) : null}
      <g
        fill="none"
        stroke={`url(#${uid}g)`}
        strokeWidth={style.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {order.map((y, i) => (
          <path
            key={y}
            className={still ? undefined : "bm-chev"}
            style={still ? undefined : { animationDelay: `${(offset + i * 0.16).toFixed(2)}s` }}
            d={`M7 ${y + style.amp * 0.75}L12 ${y - style.amp}l5 ${style.amp * 1.75}`}
          />
        ))}
      </g>
    </svg>
  )
}
