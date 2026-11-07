/**
 * Small versions of the marks for 16–24 px, next to a name in lists, tables,
 * the sidebar. Drawn on a 20-unit grid: flat two-tone fills, edges at least
 * one unit wide, no blur or glow filters and no hairlines, so they stay sharp
 * where the large marks would turn into a smudge.
 */

import type { ReputationTier } from "@/lib/trust-levels"

/** Marks at this size or smaller use the small drawing. */
export const SMALL_MARK_MAX = 24

type Grad = { id: string; from: string; to: string; vertical?: boolean }

function Linear({ id, from, to, vertical = false }: Grad) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "0.75"} y2="1">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  )
}

// Shield with straight sides on whole units (x 2.5 and 17.5).
const SHIELD =
  "M10 1.6 16.9 4.1c.4.15.6.5.6.9V9.6c0 4.3-2.9 7.3-7.5 9.2C5.4 16.9 2.5 13.9 2.5 9.6V5c0-.4.2-.75.6-.9Z"
const SHIELD_FACE = "M10 3.6 15.6 5.6V9.6c0 3.4-2.1 5.8-5.6 7.4C6.5 15.4 4.4 13 4.4 9.6V5.6Z"
const CHECK = "M6.7 10 9 12.3 13.4 7.8"
const STAR =
  "M10 6.1 11.03 8.78 13.9 8.93 11.66 10.74 12.41 13.52 10 11.95 7.59 13.52 8.34 10.74 6.1 8.93 8.97 8.78Z"

// Diamond: the same eight-sided crystal as the large mark, one rim, one face, a bold B.
const CRYSTAL = "M2.8 3.6 10 2.1 17.2 3.6 17.8 9.3 14.6 15.1 10 18.6 5.4 15.1 2.2 9.3Z"
const CRYSTAL_FACE = "M5.3 5.6 10 4.4 14.7 5.6 15.2 9.4 12.6 13.3 10 15.5 7.4 13.3 4.8 9.4Z"
const CRYSTAL_GLOSS = "M5.3 5.6 10 4.4 14.7 5.6 15.1 8.6C12 7.4 8 7.4 4.9 8.6Z"
// Stems two units wide, counters at least 1.8 units: readable from 16 px.
const LETTER_B =
  "M6.9 6H10.6C12.1 6 13 6.8 13 8.1C13 9 12.55 9.6 11.85 9.9C12.8 10.2 13.4 11 13.4 12.1C13.4 13.4 12.4 14.2 10.8 14.2H6.9Z" +
  "M8.8 7.5V9.3H10.3C10.85 9.3 11.15 8.95 11.15 8.4C11.15 7.85 10.85 7.5 10.3 7.5Z" +
  "M8.8 10.7V12.75H10.5C11.1 12.75 11.45 12.35 11.45 11.7C11.45 11.1 11.1 10.7 10.5 10.7Z"

/** Contents of a 20 × 20 reliability mark. */
export function SmallTrustGlyph({ tier, uid, moving }: { tier: ReputationTier; uid: string; moving: boolean }) {
  if (tier === "none") {
    return (
      <>
        <path d={SHIELD} fill="#EFEEEA" stroke="#C9C7BF" strokeWidth={1} />
        <path d={CHECK} fill="none" stroke="#B4B2AA" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  }
  if (tier === "silver") {
    return (
      <>
        <defs>
          <Linear id={`${uid}sr`} from="#D5D9DF" to="#68707B" />
          <Linear id={`${uid}sf`} from="#FFFFFF" to="#C9CED6" vertical />
        </defs>
        <path d={SHIELD} fill={`url(#${uid}sr)`} />
        <path d={SHIELD_FACE} fill={`url(#${uid}sf)`} />
        <path d={SHIELD} fill="none" stroke="#4E5661" strokeOpacity={0.55} strokeWidth={0.9} />
        <path d={CHECK} fill="none" stroke="#2F363F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  }
  if (tier === "gold") {
    return (
      <>
        <defs>
          <Linear id={`${uid}gr`} from="#F7D777" to="#93590A" />
          <Linear id={`${uid}gf`} from="#FFF2C6" to="#EDB436" vertical />
        </defs>
        <path d={SHIELD} fill={`url(#${uid}gr)`} />
        <path d={SHIELD_FACE} fill={`url(#${uid}gf)`} />
        <path d={SHIELD} fill="none" stroke="#6E4204" strokeOpacity={0.6} strokeWidth={0.9} />
        <path d={STAR} fill="#7A4700" stroke="#7A4700" strokeWidth={0.9} strokeLinejoin="round" />
      </>
    )
  }
  return (
    <>
      <defs>
        <Linear id={`${uid}dr`} from="#FFA6EE" to="#86188A" />
        <Linear id={`${uid}df`} from="#9D58F4" to="#360A86" />
        <linearGradient id={`${uid}ds`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}dc`}>
          <path d={CRYSTAL_FACE} />
        </clipPath>
      </defs>
      <path d={CRYSTAL} fill={`url(#${uid}dr)`} />
      <path d={CRYSTAL_FACE} fill={`url(#${uid}df)`} />
      <path d={CRYSTAL_GLOSS} fill="#fff" opacity={0.16} />
      {moving ? (
        <g clipPath={`url(#${uid}dc)`}>
          <path className="bm-d-streak" d="M-22 -2h5l-6 24h-5Z" fill={`url(#${uid}ds)`} />
        </g>
      ) : null}
      <g data-part="letter">
        <path d={LETTER_B} fillRule="evenodd" fill="#16032F" opacity={0.65} transform="translate(0 0.7)" />
        <path d={LETTER_B} fillRule="evenodd" fill="#FBF5FF" />
      </g>
      <path d={CRYSTAL} fill="none" stroke="#3E0742" strokeOpacity={0.7} strokeWidth={0.9} strokeLinejoin="round" />
    </>
  )
}

export type SmallPlanTier = "free" | "start" | "pro" | "business"

const TILES: Record<SmallPlanTier, { from: string; to: string; edge: string; edgeOpacity: number }> = {
  free: { from: "#F4F5F7", to: "#D3D8DF", edge: "#AEB5BE", edgeOpacity: 1 },
  start: { from: "#5B90F4", to: "#2551C8", edge: "#1C3F9E", edgeOpacity: 0.7 },
  pro: { from: "#FFE07A", to: "#E09E22", edge: "#A86C08", edgeOpacity: 0.85 },
  business: { from: "#3A3935", to: "#0B0B0A", edge: "#D3A24A", edgeOpacity: 0.95 },
}

/** Contents of a 20 × 20 plan tile. */
export function SmallPlanGlyph({
  tier,
  uid,
  moving,
  delay,
}: {
  tier: SmallPlanTier
  uid: string
  moving: boolean
  delay?: string
}) {
  const tile = TILES[tier]
  const style = moving && delay ? { animationDelay: delay } : undefined
  return (
    <>
      <defs>
        <Linear id={`${uid}t`} from={tile.from} to={tile.to} />
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEFB8" />
          <stop offset="1" stopColor="#D9A033" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${uid}c`}>
          <rect x="1" y="1" width="18" height="18" rx="5" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="18" height="18" rx="5" fill={`url(#${uid}t)`} />
      <rect
        x="1.5"
        y="1.5"
        width="17"
        height="17"
        rx="4.5"
        fill="none"
        stroke={tile.edge}
        strokeOpacity={tile.edgeOpacity}
        strokeWidth={1}
      />
      {moving && (tier === "pro" || tier === "business") ? (
        <g clipPath={`url(#${uid}c)`}>
          <rect className="bm-plan-sweep" style={style} x={-12} y={-3} width={6} height={26} fill={`url(#${uid}s)`} />
        </g>
      ) : null}
      {tier === "free" ? (
        <path
          data-glyph="check"
          d="M6.3 10.3 8.8 12.8 13.8 7.6"
          fill="none"
          stroke="#4B535E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {tier === "start" ? (
        <path
          data-glyph="bolt"
          className={moving ? "bm-plan-flash" : undefined}
          style={style}
          d="M11.4 3.4 5.7 11h3.6l-.9 5.6 6-8h-3.6Z"
          fill="#FFFFFF"
        />
      ) : null}
      {tier === "pro" ? (
        <g data-glyph="crown" fill="#3A2800">
          <path d="M4.6 13V6.2l3.3 2.7L10 4.4l2.1 4.5 3.3-2.7V13Z" />
          <rect x="4.6" y="14" width="10.8" height="1.8" rx="0.5" />
        </g>
      ) : null}
      {tier === "business" ? (
        <g data-glyph="gem">
          <path d="M5.3 8.3 7.6 5.1h4.8l2.3 3.2L10 15.3Z" fill={`url(#${uid}g)`} />
          <path
            d="M5.3 8.3h9.4M7.6 5.1 8.8 8.3 10 15.3 11.2 8.3 12.4 5.1"
            fill="none"
            stroke="#6B4A10"
            strokeWidth={0.9}
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </>
  )
}
