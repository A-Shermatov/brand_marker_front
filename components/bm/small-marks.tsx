/**
 * Small versions of the marks for 16–24 px, next to a name in lists, tables,
 * the sidebar. Drawn on a 20-unit grid: flat two-tone fills, edges at least
 * one unit wide, no blur or glow filters and no hairlines, so they stay sharp
 * where the large marks would turn into a smudge.
 */

import type { ReputationTier } from "@/lib/trust-levels"
import { LogoGlyph } from "@/components/bm/logo-glyph"

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
// Our B on the small shields and crystal: cuts a full unit wide, so the
// triangle still reads at 16 px.
const SHIELD_LOGO = { x: 10, y: 9.9, height: 7.6, cut: 1 }
const CRYSTAL_LOGO = { x: 10, y: 10, height: 7.8, cut: 1 }

// Diamond: the same eight-sided crystal as the large mark, one rim, one face, our B.
const CRYSTAL = "M2.8 3.6 10 2.1 17.2 3.6 17.8 9.3 14.6 15.1 10 18.6 5.4 15.1 2.2 9.3Z"
const CRYSTAL_FACE = "M5.3 5.6 10 4.4 14.7 5.6 15.2 9.4 12.6 13.3 10 15.5 7.4 13.3 4.8 9.4Z"
const CRYSTAL_GLOSS = "M5.3 5.6 10 4.4 14.7 5.6 15.1 8.6C12 7.4 8 7.4 4.9 8.6Z"
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
        <LogoGlyph data-part="logo" uid={`${uid}sl`} {...SHIELD_LOGO} layers={[{ fill: "#2F363F" }]} />
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
        <LogoGlyph data-part="logo" uid={`${uid}gl`} {...SHIELD_LOGO} layers={[{ fill: "#6B3F00" }]} />
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
      <LogoGlyph
        data-part="logo"
        uid={`${uid}dl`}
        {...CRYSTAL_LOGO}
        layers={[
          { fill: "#16032F", opacity: 0.65, dy: 0.7 },
          { fill: "#FBF5FF" },
        ]}
      />
      <path d={CRYSTAL} fill="none" stroke="#3E0742" strokeOpacity={0.7} strokeWidth={0.9} strokeLinejoin="round" />
    </>
  )
}

export type SmallPlanTier = "free" | "start" | "pro" | "business"

type PlanLook = {
  tile: [string, string]
  edge: string
  edgeOpacity: number
  /** Colour of the rank chevrons, or "gold" for the gold gradient. */
  ink: string
}

/**
 * Plan tiles: square, unlike the shield of the reliability mark, so a paid
 * plan never reads as an earned one. The level is the number of rank chevrons:
 * Старт one, Про two, Бизнес three.
 */
export const PLAN_LOOKS: Record<SmallPlanTier, PlanLook> = {
  free: { tile: ["#F4F6FA", "#DDE3EC"], edge: "#B9C2CF", edgeOpacity: 1, ink: "#5B6578" },
  start: { tile: ["#F2F7FF", "#D2E2FF"], edge: "#5A8FEF", edgeOpacity: 0.9, ink: "#0050C8" },
  pro: { tile: ["#3B8BFF", "#0047B8"], edge: "#00327F", edgeOpacity: 0.55, ink: "#FFFFFF" },
  business: { tile: ["#173E96", "#06173F"], edge: "#E8B53A", edgeOpacity: 0.95, ink: "gold" },
}

/** Chevron rows (top y of each) on the 20-unit grid, per number of ranks. */
const RANK_ROWS: Record<number, number[]> = { 1: [8.4], 2: [6.6, 10.4], 3: [5.1, 8.6, 12.1] }
const chevron = (y: number) => `M5.6 ${y + 3.4} 10 ${y} 14.4 ${y + 3.4}`
export const PLAN_RANKS: Record<Exclude<SmallPlanTier, "free">, number> = { start: 1, pro: 2, business: 3 }

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
  const look = PLAN_LOOKS[tier]
  const style = moving && delay ? { animationDelay: delay } : undefined
  const ink = look.ink === "gold" ? `url(#${uid}g)` : look.ink
  const ranks = tier === "free" ? 0 : PLAN_RANKS[tier]
  return (
    <>
      <defs>
        <Linear id={`${uid}t`} from={look.tile[0]} to={look.tile[1]} />
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE78A" />
          <stop offset="1" stopColor="#F2A900" />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.5} />
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
        stroke={look.edge}
        strokeOpacity={look.edgeOpacity}
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
          stroke={look.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <g
          data-glyph={`rank-${ranks}`}
          className={moving && tier === "start" ? "bm-plan-flash" : undefined}
          style={style}
          fill="none"
          stroke={ink}
          strokeWidth={ranks === 3 ? 2 : 2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {RANK_ROWS[ranks]!.map((y) => (
            <path key={y} d={chevron(y)} />
          ))}
        </g>
      )}
    </>
  )
}
