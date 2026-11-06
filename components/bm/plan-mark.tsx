"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import { normalizePlan, planMarkHint, type PaidPlan } from "@/lib/subscription"

type PlanMarkProps = {
  plan: string | null | undefined
  size?: number
  className?: string
  decorative?: boolean
  /** Turn off the mini animation (tables, print). */
  still?: boolean
}

type Tier = PaidPlan | "free"

type TileStyle = {
  tile: [string, string]
  rim: string
  /** Gold light passing over the tile */
  shine?: boolean
}

// Square tiles, deliberately unlike the shield-shaped reliability marks, so a
// paid plan never reads as an earned one. Each plan has its own glyph.
const STYLES: Record<Tier, TileStyle> = {
  free: { tile: ["#F4F5F7", "#D6DAE0"], rim: "#BFC5CD" },
  start: { tile: ["#5C90F2", "#2B57CC"], rim: "#FFFFFF" },
  pro: { tile: ["#FFE07A", "#E2A22A"], rim: "#B97C10", shine: true },
  business: { tile: ["#33322F", "#0B0B0A"], rim: "#C9963A", shine: true },
}

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

function Glyph({ tier, uid, animate, delay }: { tier: Tier; uid: string; animate: boolean; delay: string }) {
  const style = animate ? { animationDelay: delay } : undefined
  if (tier === "free") {
    return (
      <path
        data-glyph="check"
        d="M7.6 12.4l3 3 5.9-6.2"
        fill="none"
        stroke="#4B535E"
        strokeWidth={2.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }
  if (tier === "start") {
    return (
      <path
        data-glyph="bolt"
        className={animate ? "bm-plan-flash" : undefined}
        style={style}
        d="M13.4 4.4 7.3 13.1h4.1l-.9 6.5 6.3-9.1h-4.1Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
    )
  }
  if (tier === "pro") {
    return (
      <g data-glyph="crown" fill="#3A2800">
        <path d="M5.8 15.4V8.9l3.6 2.9L12 7.3l2.6 4.5 3.6-2.9v6.5Z" strokeLinejoin="round" />
        <rect x="5.8" y="16.4" width="12.4" height="2" rx="0.7" />
      </g>
    )
  }
  return (
    <g data-glyph="gem">
      <g fill="none" stroke={`url(#${uid}gold)`} strokeLinejoin="round" strokeLinecap="round">
        <path d="M7.4 10 9.8 6.9h4.4l2.4 3.1L12 17.4Z" strokeWidth={1.4} />
        <path d="M7.4 10h9.2M9.8 6.9 11 10l1 7.4 1-7.4 1.2-3.1" strokeWidth={0.9} />
      </g>
      <path
        className={animate ? "bm-tw" : undefined}
        style={style}
        d={sparkle(18.3, 5.6, 1.9)}
        fill="#FFE7A3"
        opacity={animate ? undefined : 0.9}
      />
    </g>
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
  const uid = useId().replace(/:/g, "")
  const style = STYLES[tier]
  const animate = !still && tier !== "free"
  const delay = `${offsetFor(uid)}s`
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label }

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
          <stop offset="0" stopColor={style.tile[0]} />
          <stop offset="1" stopColor={style.tile[1]} />
        </linearGradient>
        <linearGradient id={`${uid}gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEFB8" />
          <stop offset="1" stopColor="#D49B2C" />
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
        stroke={style.rim}
        strokeOpacity={tier === "start" ? 0.35 : 0.6}
        strokeWidth={0.8}
      />
      {tier === "start" ? (
        // Diagonal glass stripe across the blue tile.
        <path d="M15.5 1h3.2L5.2 23H2Z" fill="#FFFFFF" opacity={0.16} clipPath={`url(#${uid}c)`} />
      ) : (
        <path d="M1 7.5A6.5 6.5 0 0 1 7.5 1h9A6.5 6.5 0 0 1 23 7.5V9C16 7 8 7 1 10Z" fill="#FFFFFF" opacity={0.14} />
      )}
      {style.shine && animate ? (
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
