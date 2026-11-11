/**
 * The B glyph, drawn once and reused: at the heart of the reliability and plan
 * marks and in their exported icons.
 *
 * A bold B with a "play" triangle cut into its stem: two cuts meet at the
 * waist (from the top-left and from the bottom-left), then one runs on right.
 * Native box: 100 units; the letter spans x 16–89, y 8–92.
 */

import type { SVGProps } from "react"

export const LOGO_B =
  "M16 8H57C73 8 83 17 83 29.5C83 37.5 79 43.5 72 46.5C82.5 49.5 89 57.5 89 69C89 82.5 79 92 62 92H16Z"
export const LOGO_CUT = "M4 12.5 50 50.5H67M50 50.5 10 99"

const CENTER_X = 52.5
const CENTER_Y = 50
const HEIGHT = 84
const r = (v: number) => Math.round(v * 1000) / 1000

type Layer = SVGProps<SVGPathElement> & {
  /** Shift down in the caller's units (shadows, engraving). */
  dy?: number
}

type LogoGlyphProps = {
  /** Unique per drawing: the id of the cut mask. */
  uid: string
  /** Centre and height of the letter in the caller's units. */
  x: number
  y: number
  height: number
  /** Width of the cuts in the caller's units. */
  cut: number
  /** Painted back to front; stroke widths are in the caller's units. */
  layers: Layer[]
  "data-part"?: string
}

/** The B with its cuts, centred on (x, y), painted as one or more layers. */
export function LogoGlyph({ uid, x, y, height, cut, layers, ...rest }: LogoGlyphProps) {
  const s = height / HEIGHT
  const mask = `${uid}-cut`
  return (
    <g transform={`translate(${r(x - CENTER_X * s)} ${r(y - CENTER_Y * s)}) scale(${r(s)})`} {...rest}>
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <path d={LOGO_CUT} fill="none" stroke="#000" strokeWidth={r(cut / s)} strokeLinejoin="miter" />
        </mask>
      </defs>
      {layers.map(({ dy = 0, strokeWidth, ...paint }, i) => (
        <path
          key={i}
          d={LOGO_B}
          mask={`url(#${mask})`}
          transform={dy ? `translate(0 ${r(dy / s)})` : undefined}
          strokeWidth={typeof strokeWidth === "number" ? r(strokeWidth / s) : strokeWidth}
          {...paint}
        />
      ))}
    </g>
  )
}
