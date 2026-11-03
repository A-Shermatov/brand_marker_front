"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import {
  normalizeReputationTier,
  reputationTierHint,
  type ReputationTier,
} from "@/lib/trust-levels"

type TrustMarkProps = {
  tier: ReputationTier | string | null | undefined
  size?: number
  className?: string
  /** Turn off shimmer and sparkles (dense lists, print). */
  still?: boolean
  /** Decorative when the tier is already written next to it. */
  decorative?: boolean
}

type Point = [number, number]

// Heater shield used by the empty, silver and gold marks (viewBox 0 0 48 48).
const SHIELD =
  "M24 4.2 39.6 9.5c.8.3 1.4 1 1.4 1.9V22c0 10-6.6 17.4-17 21.8C13.6 39.4 7 32 7 22V11.4c0-.9.6-1.6 1.4-1.9Z"
const SHIELD_INNER =
  "M24 7.6 37.6 12.2V22c0 8.5-5.5 14.8-13.6 18.5C15.9 36.8 10.4 30.5 10.4 22v-9.8Z"
const GLOSS = "M7 9h34v11c-9.5-4.2-23.5-3.4-34 3.2Z"
const STAR =
  "M24 14.6l2.2 5.6 6 .3-4.7 3.8 1.6 5.8L24 26.8l-5.1 3.3 1.6-5.8-4.7-3.8 6-.3Z"

// Diamond: a cut crystal in the shape of a shield. Eight-sided outline,
// a bevelled magenta rim and a violet core split into four facets.
const CRYSTAL_OUTER: Point[] = [
  [6.8, 8.6],
  [24, 5],
  [41.2, 8.6],
  [42.8, 22.4],
  [35, 36.2],
  [24, 44.6],
  [13, 36.2],
  [5.2, 22.4],
]
const CRYSTAL_INNER: Point[] = [
  [12.8, 13.4],
  [24, 10.6],
  [35.2, 13.4],
  [36.4, 22.6],
  [30.2, 31.8],
  [24, 37.2],
  [17.8, 31.8],
  [11.6, 22.6],
]
const CRYSTAL_CORE: Point = [22.6, 21.6]
// Rim facets lit from the top left, clockwise from the top-left edge.
const RIM_COLORS = ["#FFA6EC", "#F768D9", "#D936B9", "#AE1F99", "#8B137E", "#A91D93", "#D53DBD", "#FF8AE3"]
const CORE_FACETS: { points: number[]; fill: string }[] = [
  { points: [7, 0, 1], fill: "#B77BFF" },
  { points: [1, 2, 3], fill: "#8640F0" },
  { points: [3, 4, 5], fill: "#4B129F" },
  { points: [5, 6, 7], fill: "#6A24CF" },
]

const pts = (...p: Point[]) => p.map(([x, y]) => `${x},${y}`).join(" ")

function sparkle(x: number, y: number, s: number) {
  const k = s * 0.22
  return `M${x} ${y - s}Q${x + k} ${y - k} ${x + s} ${y}Q${x + k} ${y + k} ${x} ${y + s}Q${x - k} ${y + k} ${x - s} ${y}Q${x - k} ${y - k} ${x} ${y - s}Z`
}

function Crystal({ uid, animate, compact }: { uid: string; animate: boolean; compact: boolean }) {
  const n = CRYSTAL_OUTER.length
  const outline = pts(...CRYSTAL_OUTER)
  return (
    <>
      <defs>
        <linearGradient id={`${uid}core`} x1="0.2" y1="0" x2="0.75" y2="1">
          <stop offset="0" stopColor="#A35CFF" />
          <stop offset="0.55" stopColor="#6A22D6" />
          <stop offset="1" stopColor="#3A0C8C" />
        </linearGradient>
        <radialGradient id={`${uid}glow`} cx="0.45" cy="0.28" r="0.55">
          <stop offset="0" stopColor="#E9CCFF" stopOpacity={0.75} />
          <stop offset="1" stopColor="#E9CCFF" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}clip-crystal`}>
          <polygon points={outline} />
        </clipPath>
      </defs>

      {/* Rim: one bevel per side between the outer and inner outlines. */}
      {CRYSTAL_OUTER.map((point, i) => {
        const next = (i + 1) % n
        return (
          <polygon
            key={i}
            points={pts(point, CRYSTAL_OUTER[next]!, CRYSTAL_INNER[next]!, CRYSTAL_INNER[i]!)}
            fill={RIM_COLORS[i]}
          />
        )
      })}

      {/* Core: violet face with four facets meeting off-centre. */}
      <polygon points={pts(...CRYSTAL_INNER)} fill={`url(#${uid}core)`} />
      {CORE_FACETS.map(({ points, fill }, i) => (
        <polygon
          key={i}
          points={pts(...points.map((p) => CRYSTAL_INNER[p]!), CRYSTAL_CORE)}
          fill={fill}
          opacity={0.55}
        />
      ))}
      <polygon points={pts(...CRYSTAL_INNER)} fill={`url(#${uid}glow)`} />
      <polygon
        className={animate ? "bm-facet" : undefined}
        points={pts(CRYSTAL_INNER[7]!, CRYSTAL_INNER[0]!, CRYSTAL_INNER[1]!, CRYSTAL_CORE)}
        fill="#fff"
        opacity={animate ? undefined : 0.12}
      />

      {/* Inner edge of the rim, highlights and an outline that holds up at 16 px. */}
      <polygon
        points={pts(...CRYSTAL_INNER)}
        fill="none"
        stroke="#FF4FA3"
        strokeOpacity={0.85}
        strokeWidth={0.9}
        strokeLinejoin="round"
      />
      <polygon points={pts([8.8, 9.6], [23.4, 6.5], [22.9, 9.6], [12.6, 12.6])} fill="#fff" opacity={0.55} />
      <polygon points={pts([6.6, 21.4], [8.4, 10.8], [11.2, 13.8], [10.2, 21.8])} fill="#fff" opacity={0.28} />
      <polygon
        points={outline}
        fill="none"
        stroke="#4A0A47"
        strokeOpacity={0.45}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {animate ? (
        <>
          <g clipPath={`url(#${uid}clip-crystal)`}>
            <rect className="bm-mark-sweep" x={-24} y={-6} width={13} height={60} fill={`url(#${uid}sweep)`} />
          </g>
          {compact ? null : (
            <g fill="#fff">
              <path className="bm-tw" d={sparkle(40, 8.5, 3.2)} />
              <path className="bm-tw" style={{ animationDelay: "0.9s" }} d={sparkle(17.5, 17, 1.9)} />
              <path className="bm-tw" style={{ animationDelay: "1.7s" }} d={sparkle(8, 30, 2.2)} />
            </g>
          )}
        </>
      ) : null}
    </>
  )
}

/**
 * Reliability mark. Silver and gold are engraved shields; diamond is a cut
 * violet crystal with a magenta rim, so it stands out in any list.
 */
export function TrustMark({
  tier,
  size = 32,
  className,
  still = false,
  decorative = false,
}: TrustMarkProps) {
  const uid = useId().replace(/:/g, "")
  const id = normalizeReputationTier(tier)
  const compact = size < 28
  const animate = !still && (id === "diamond" || (id === "gold" && !compact))
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": reputationTierHint(id) }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      data-tier={id}
      className={cn(
        "shrink-0 overflow-visible",
        animate && id === "diamond" && "bm-glow-diamond",
        animate && id === "gold" && "bm-glow-gold",
        className,
      )}
      {...a11y}
    >
      {decorative ? null : <title>{reputationTierHint(id)}</title>}
      <defs>
        <linearGradient id={`${uid}silver-rim`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#F1F3F5" />
          <stop offset="0.55" stopColor="#AEB5BF" />
          <stop offset="1" stopColor="#7C848F" />
        </linearGradient>
        <linearGradient id={`${uid}silver-face`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#C6CBD3" />
        </linearGradient>
        <linearGradient id={`${uid}gold-rim`} x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FBE38C" />
          <stop offset="0.5" stopColor="#D79A1E" />
          <stop offset="1" stopColor="#99610A" />
        </linearGradient>
        <linearGradient id={`${uid}gold-face`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFF3C9" />
          <stop offset="0.55" stopColor="#F2C14C" />
          <stop offset="1" stopColor="#D8961A" />
        </linearGradient>
        <linearGradient id={`${uid}sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.75} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}clip-shield`}>
          <path d={SHIELD} />
        </clipPath>
      </defs>

      {id === "none" ? (
        <>
          <path d={SHIELD} fill="#EFEEEA" stroke="#D2D0C9" strokeWidth={1.4} />
          <path
            d="M17.5 24.5l4.6 4.5 8.9-9"
            fill="none"
            stroke="#C2C0B8"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {id === "silver" ? (
        <>
          <path d={SHIELD} fill={`url(#${uid}silver-rim)`} />
          <path d={SHIELD_INNER} fill={`url(#${uid}silver-face)`} />
          <path d={GLOSS} fill="#fff" opacity={0.35} clipPath={`url(#${uid}clip-shield)`} />
          <path
            d="M17 24.6l4.9 4.8 9.4-9.6"
            fill="none"
            stroke="#4B535E"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {id === "gold" ? (
        <>
          <path d={SHIELD} fill={`url(#${uid}gold-rim)`} />
          <path d={SHIELD_INNER} fill={`url(#${uid}gold-face)`} />
          <path d={GLOSS} fill="#fff" opacity={0.3} clipPath={`url(#${uid}clip-shield)`} />
          <path
            d={STAR}
            fill="#8A5600"
            stroke="#8A5600"
            strokeWidth={1.1}
            strokeLinejoin="round"
            transform="translate(0 1.2)"
          />
          {animate ? (
            <g clipPath={`url(#${uid}clip-shield)`}>
              <rect className="bm-mark-sweep" x={-24} y={-6} width={14} height={60} fill={`url(#${uid}sweep)`} />
            </g>
          ) : null}
        </>
      ) : null}

      {id === "diamond" ? <Crystal uid={uid} animate={animate} compact={compact} /> : null}
    </svg>
  )
}
