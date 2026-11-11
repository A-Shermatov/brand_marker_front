"use client"

import { useId } from "react"
import { cn } from "@/lib/utils"
import {
  normalizeReputationTier,
  reputationTierHint,
  type ReputationTier,
} from "@/lib/trust-levels"
import { SMALL_MARK_MAX, SmallTrustGlyph } from "@/components/bm/small-marks"
import { LogoGlyph } from "@/components/bm/logo-glyph"

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
// Where our B sits on the shields: centre of the inner face, and its size.
const SHIELD_LOGO = { x: 24, y: 23.2, height: 16, cut: 1.7 }

// Diamond: a cut crystal shield with the B glyph. The outline is the
// same eight-sided shape as before. Back to front: a thick polished pink-violet
// metal rim, a magenta inner bevel, a violet face cut into eight facets, an inner
// glow, gloss, our B, then the moving lights. Sides are numbered clockwise
// from the top-left edge; the light comes from the top left.
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
const CRYSTAL_CENTER: Point = [24, 24]
const round2 = (v: number) => Math.round(v * 100) / 100
const CRYSTAL_FACE: Point[] = CRYSTAL_INNER.map(([x, y]) => [
  round2(CRYSTAL_CENTER[0] + (x - CRYSTAL_CENTER[0]) * 0.84),
  round2(CRYSTAL_CENTER[1] + (y - CRYSTAL_CENTER[1]) * 0.84),
])
// Facets meet a little up and to the left, toward the light.
const FACET_APEX: Point = [23.2, 22.4]

// Light level per side: 0 is the brightest, 4 the darkest.
const SIDE_LIGHT = [0, 1, 2, 3, 4, 3, 2, 0]
const RIM_SHADES: [string, string][] = [
  ["#FFEFFC", "#F47CD8"],
  ["#FFC6F2", "#E058C6"],
  ["#F17DD8", "#B02CA0"],
  ["#C03AAD", "#741374"],
  ["#962190", "#520A54"],
]
const BEVEL_SHADES: [string, string][] = [
  ["#FFA3EC", "#D43FC4"],
  ["#F582E3", "#B52CB0"],
  ["#D24DCD", "#8B1D9E"],
  ["#A32BA2", "#5F1079"],
  ["#801B8E", "#440A64"],
]
// Face facets, one per side: violet on the right, magenta on the left.
const FACE_SHADES: [string, string][] = [
  ["#A964F5", "#5A1CC0"],
  ["#8C47EC", "#4A12AC"],
  ["#6D2ED8", "#380B92"],
  ["#4F15AE", "#27066E"],
  ["#3A0D84", "#1C0452"],
  ["#62179F", "#2E0770"],
  ["#8E24A8", "#440B7E"],
  ["#B845D6", "#6A1BB2"],
]

// Our B, optically centred in the crystal face.
const CRYSTAL_LOGO = { x: 24, y: 23.6, height: 15.8, cut: 1.6 }

const pts = (...p: Point[]) => p.map(([x, y]) => `${x},${y}`).join(" ")
const loop = (p: Point[]) => `M${p.map(([x, y]) => `${x} ${y}`).join("L")}Z`
const mid = (a: Point, b: Point): Point => [round2((a[0] + b[0]) / 2), round2((a[1] + b[1]) / 2)]

/**
 * full: float, breathing, glow and moving lights.
 * calm: inner glow and the light streak only; no halo round the B, so a small one stays crisp.
 * none: still.
 */
type CrystalMotion = "full" | "calm" | "none"

function Crystal({ uid, motion }: { uid: string; motion: CrystalMotion }) {
  const n = CRYSTAL_OUTER.length
  const moving = motion !== "none"
  const face = CRYSTAL_FACE
  const [l, tl, t, tr, r] = [face[7]!, face[0]!, face[1]!, face[2]!, face[3]!]
  const gloss = `M${l[0]} ${l[1]}L${tl[0]} ${tl[1]}L${t[0]} ${t[1]}L${tr[0]} ${tr[1]}L${r[0]} ${r[1]}C28.4 19.2 19.6 19.2 ${l[0]} ${l[1]}Z`

  return (
    <g className={motion === "full" ? "bm-d-idle" : undefined}>
      <defs>
        {CRYSTAL_OUTER.map((point, i) => {
          const next = (i + 1) % n
          const [a, b] = RIM_SHADES[SIDE_LIGHT[i]!]!
          const from = mid(point, CRYSTAL_OUTER[next]!)
          const to = mid(CRYSTAL_INNER[i]!, CRYSTAL_INNER[next]!)
          return (
            <linearGradient
              key={`r${i}`}
              id={`${uid}rim${i}`}
              gradientUnits="userSpaceOnUse"
              x1={from[0]}
              y1={from[1]}
              x2={to[0]}
              y2={to[1]}
            >
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          )
        })}
        {CRYSTAL_INNER.map((point, i) => {
          const next = (i + 1) % n
          const [a, b] = BEVEL_SHADES[SIDE_LIGHT[i]!]!
          const from = mid(point, CRYSTAL_INNER[next]!)
          const to = mid(face[i]!, face[next]!)
          return (
            <linearGradient
              key={`b${i}`}
              id={`${uid}bev${i}`}
              gradientUnits="userSpaceOnUse"
              x1={from[0]}
              y1={from[1]}
              x2={to[0]}
              y2={to[1]}
            >
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          )
        })}
        {face.map((point, i) => {
          const from = mid(point, face[(i + 1) % n]!)
          const [a, b] = FACE_SHADES[i]!
          return (
            <linearGradient
              key={`f${i}`}
              id={`${uid}face${i}`}
              gradientUnits="userSpaceOnUse"
              x1={from[0]}
              y1={from[1]}
              x2={FACET_APEX[0]}
              y2={FACET_APEX[1]}
            >
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          )
        })}
        <radialGradient id={`${uid}inner`} gradientUnits="userSpaceOnUse" cx={24} cy={22.8} r={11}>
          <stop offset="0" stopColor="#E98DFF" stopOpacity={0.9} />
          <stop offset="0.5" stopColor="#A63CFF" stopOpacity={0.38} />
          <stop offset="1" stopColor="#6A22D6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}gloss`} gradientUnits="userSpaceOnUse" x1={0} y1={13} x2={0} y2={22}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.42} />
          <stop offset="1" stopColor="#fff" stopOpacity={0.03} />
        </linearGradient>
        <linearGradient id={`${uid}streak`} gradientUnits="userSpaceOnUse" x1={0} y1={8} x2={0} y2={30}>
          <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
          <stop offset="0.6" stopColor="#fff" stopOpacity={0.35} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${uid}letter`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#F6E8FF" />
          <stop offset="0.36" stopColor="#CFA2FF" />
          <stop offset="0.5" stopColor="#8A40E8" />
          <stop offset="0.66" stopColor="#A468F6" />
          <stop offset="1" stopColor="#D9B8FF" />
        </linearGradient>
        {/* Blur for the halo round the B, in the B's own (scaled) units. */}
        <filter id={`${uid}soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={4.8} />
        </filter>
        <filter id={`${uid}spark`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={0.35} />
        </filter>
        <clipPath id={`${uid}clip-crystal`}>
          <polygon points={pts(...CRYSTAL_INNER)} />
        </clipPath>
      </defs>

      {/* Thick metal rim: one bevel per side. */}
      {CRYSTAL_OUTER.map((point, i) => {
        const next = (i + 1) % n
        return (
          <polygon
            key={`rim${i}`}
            points={pts(point, CRYSTAL_OUTER[next]!, CRYSTAL_INNER[next]!, CRYSTAL_INNER[i]!)}
            fill={`url(#${uid}rim${i})`}
          />
        )
      })}
      {/* Polished highlights on the lit top-left edges of the rim. */}
      <polygon points={pts([8.4, 9.8], [23.6, 6.4], [23.2, 8.4], [11.4, 11.6])} fill="#fff" opacity={0.6} />
      <polygon points={pts([6.7, 21.6], [8.1, 10.9], [10.3, 13.1], [9.4, 21.9])} fill="#fff" opacity={0.3} />
      {/* Shadow where the rim meets the crystal. */}
      <polygon
        points={pts(...CRYSTAL_INNER)}
        fill="none"
        stroke="#3A0546"
        strokeOpacity={0.5}
        strokeWidth={1.1}
        strokeLinejoin="round"
      />

      {/* Magenta inner bevel. */}
      {CRYSTAL_INNER.map((point, i) => {
        const next = (i + 1) % n
        return (
          <polygon
            key={`bev${i}`}
            points={pts(point, CRYSTAL_INNER[next]!, face[next]!, face[i]!)}
            fill={`url(#${uid}bev${i})`}
          />
        )
      })}

      {/* Violet face cut into eight facets, lit from within. */}
      {face.map((point, i) => (
        <polygon key={`face${i}`} points={pts(point, face[(i + 1) % n]!, FACET_APEX)} fill={`url(#${uid}face${i})`} />
      ))}
      <polygon
        className={moving ? "bm-d-pulse" : undefined}
        points={pts(...CRYSTAL_INNER)}
        fill={`url(#${uid}inner)`}
        opacity={0.55}
      />
      <path d={gloss} fill={`url(#${uid}gloss)`} />
      <polygon
        points={pts(...face)}
        fill="none"
        stroke="#FFC2F4"
        strokeOpacity={0.55}
        strokeWidth={0.5}
        strokeLinejoin="round"
      />

      {/* Our B: shadow, halo, metal, crisp edge. It never moves on its own. */}
      <LogoGlyph
        data-part="logo"
        uid={`${uid}d`}
        {...CRYSTAL_LOGO}
        layers={[
          { fill: "#12022E", opacity: 0.7, dy: 0.9 },
          ...(motion === "calm"
            ? []
            : [
                {
                  className: moving ? "bm-d-letter-glow" : undefined,
                  fill: "none",
                  stroke: "#FF9CF5",
                  strokeWidth: 1.4,
                  strokeLinejoin: "round" as const,
                  filter: `url(#${uid}soft)`,
                  opacity: 0.5,
                },
              ]),
          {
            fill: `url(#${uid}letter)`,
            stroke: "#FFE6FF",
            strokeOpacity: 0.9,
            strokeWidth: 0.5,
            strokeLinejoin: "round" as const,
          },
        ]}
      />

      {/* An outline that holds up at 16 px. */}
      <polygon
        points={pts(...CRYSTAL_OUTER)}
        fill="none"
        stroke="#4A0A47"
        strokeOpacity={0.5}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />

      {moving ? (
        <g clipPath={`url(#${uid}clip-crystal)`}>
          <polygon
            className="bm-d-streak"
            points={pts([-1, 6], [4.6, 6], [-5.6, 40], [-11.2, 40])}
            fill={`url(#${uid}streak)`}
          />
        </g>
      ) : null}
      {motion === "full" ? (
        <g fill="none" strokeLinecap="round" filter={`url(#${uid}spark)`}>
          <path
            className="bm-d-edge"
            d={loop(CRYSTAL_OUTER)}
            pathLength={100}
            stroke="#FFF2FD"
            strokeWidth={1.1}
            strokeDasharray="2.5 47.5"
          />
          <path
            className="bm-d-edge"
            d={loop(CRYSTAL_INNER)}
            pathLength={100}
            stroke="#FFE0FA"
            strokeOpacity={0.8}
            strokeWidth={0.8}
            strokeDasharray="2 48"
            style={{ animationDelay: "-2.5s" }}
          />
        </g>
      ) : null}
    </g>
  )
}

/**
 * Reliability mark. Silver and gold are shields with our B engraved in the
 * middle; diamond is a cut violet crystal shield with a metal rim and a glowing
 * B, so it stands out in any list.
 */
export function TrustMark({
  tier,
  size = 32,
  className,
  still = false,
  decorative = false,
}: TrustMarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const id = normalizeReputationTier(tier)
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": reputationTierHint(id) }

  if (size <= SMALL_MARK_MAX) {
    // Next to a name: the sharp small drawing, no glow; only the diamond's light streak moves.
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        data-tier={id}
        data-size="small"
        className={cn("shrink-0", className)}
        {...a11y}
      >
        {decorative ? null : <title>{reputationTierHint(id)}</title>}
        <SmallTrustGlyph tier={id} uid={uid} moving={!still && id === "diamond"} />
      </svg>
    )
  }

  const compact = size < 28
  const animate = !still && (id === "diamond" || (id === "gold" && !compact))

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
          <LogoGlyph
            data-part="logo"
            uid={`${uid}s`}
            {...SHIELD_LOGO}
            layers={[
              { fill: "#FFFFFF", opacity: 0.85, dy: 0.7 },
              { fill: "#3D4757" },
            ]}
          />
        </>
      ) : null}

      {id === "gold" ? (
        <>
          <path d={SHIELD} fill={`url(#${uid}gold-rim)`} />
          <path d={SHIELD_INNER} fill={`url(#${uid}gold-face)`} />
          <path d={GLOSS} fill="#fff" opacity={0.3} clipPath={`url(#${uid}clip-shield)`} />
          <LogoGlyph
            data-part="logo"
            uid={`${uid}g`}
            {...SHIELD_LOGO}
            layers={[
              { fill: "#FFF4CF", opacity: 0.8, dy: 0.7 },
              { fill: "#7A4A00" },
            ]}
          />
          {animate ? (
            <g clipPath={`url(#${uid}clip-shield)`}>
              <rect className="bm-mark-sweep" x={-24} y={-6} width={14} height={60} fill={`url(#${uid}sweep)`} />
            </g>
          ) : null}
        </>
      ) : null}

      {id === "diamond" ? <Crystal uid={uid} motion={still ? "none" : compact ? "calm" : "full"} /> : null}
    </svg>
  )
}
