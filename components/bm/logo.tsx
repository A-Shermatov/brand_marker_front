"use client"

import { useId } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BRAND_NAME, BRAND_WORDMARK_PARTS } from "@/lib/brand"

type BrandLogoProps = {
  href?: string
  /** On the blue brand field: the mark and the name in white. */
  dark?: boolean
  small?: boolean
  className?: string
  showWordmark?: boolean
}

/**
 * The deal mark: buyer and supplier as two rounded diamonds that meet; where
 * they overlap, a tick — the deal went through.
 *
 * Geometry in a 72 × 48 box: each diamond is 48 across, the right one starts
 * at the centre of the left, so the overlap is a diamond half their size.
 */
const SIDE = 24 * Math.SQRT2
const RADIUS = 7.5

const diamond = (cx: number) => ({
  x: cx - SIDE / 2,
  y: 24 - SIDE / 2,
  width: SIDE,
  height: SIDE,
  rx: RADIUS,
  transform: `rotate(45 ${cx} 24)`,
})

const TICK = "M31.2 24.6 34.7 28 40.9 20.8"

type MarkColors = { left: string; right: string; overlap: string; tick: string }

/** Light pages and dark theme follow the CSS tokens; `mono` sits on brand blue. */
const THEMED: MarkColors = {
  left: "var(--logo-left)",
  right: "var(--logo-right)",
  overlap: "var(--logo-overlap)",
  tick: "var(--logo-tick)",
}
const MONO: MarkColors = {
  left: "rgb(255 255 255 / 0.62)",
  right: "rgb(255 255 255 / 0.42)",
  overlap: "#FFFFFF",
  tick: "var(--logo-left)",
}

export function LogoMark({ dark = false, className }: { dark?: boolean; className?: string }) {
  // Ids unique per mark: a copy inside a hidden menu must not own the clip.
  const id = `bm-logo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const c = dark ? MONO : THEMED
  return (
    <svg className={cn("shrink-0", className)} viewBox="0 0 72 48" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-left`}>
          <rect {...diamond(24)} />
        </clipPath>
      </defs>
      <rect {...diamond(24)} fill={c.left} />
      <rect {...diamond(48)} fill={c.right} />
      {/* The clip sits on a group: on the rotated rect it would turn with it. */}
      <g clipPath={`url(#${id}-left)`}>
        <rect {...diamond(48)} fill={c.overlap} />
      </g>
      <path
        d={TICK}
        fill="none"
        stroke={c.tick}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BrandLogo({
  href = "/",
  dark = false,
  small = false,
  className,
  showWordmark = true,
}: BrandLogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex max-w-none shrink-0 select-none items-center gap-2 whitespace-nowrap",
        className,
      )}
    >
      <LogoMark dark={dark} className={small ? "h-[22px] w-[33px]" : "h-[26px] w-[39px]"} />
      {showWordmark ? (
        <span
          className={cn(
            "whitespace-nowrap leading-none font-bold tracking-[-0.035em]",
            small ? "text-[18px]" : "text-[21px]",
          )}
        >
          {/* Paired like the mark: "brand" in the buyer's blue, "market" in the
              supplier's navy (pale on navy, white tones on brand blue). */}
          <span className={dark ? "text-white" : "text-[var(--logo-left)]"}>{BRAND_WORDMARK_PARTS[0]}</span>
          {"\u00a0"}
          <span className={dark ? "text-white/75" : "text-[var(--logo-right)]"}>{BRAND_WORDMARK_PARTS[1]}</span>
        </span>
      ) : null}
    </span>
  )

  if (!href) return content
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 whitespace-nowrap"
      aria-label={`${BRAND_NAME} — на главную`}
    >
      {content}
    </Link>
  )
}
