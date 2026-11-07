"use client"

import { useId } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LogoGlyph } from "@/components/bm/logo-glyph"

type BrandLogoProps = {
  href?: string
  dark?: boolean
  small?: boolean
  className?: string
  showWordmark?: boolean
}

/**
 * The B mark on a rounded tile: white B on brand blue, or, with `dark`, blue
 * B on a white tile for blue surfaces.
 */
export function LogoMark({ dark = false, className }: { dark?: boolean; className?: string }) {
  // Ids unique per mark: a copy inside a hidden menu must not own the gradient.
  const id = `bm-logo${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  return (
    <svg className={cn("shrink-0", className)} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F80FF" />
          <stop offset="1" stopColor="#0047B8" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="26" fill={dark ? "#FFFFFF" : `url(#${id}-g)`} />
      <LogoGlyph uid={id} x={51} y={50} height={50.4} cut={3.6} layers={[{ fill: dark ? "#0050C8" : "#FFFFFF" }]} />
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
        "inline-flex max-w-none shrink-0 select-none items-center gap-2.5 whitespace-nowrap",
        className,
      )}
    >
      <LogoMark dark={dark} className={small ? "size-8" : "size-9"} />
      {showWordmark ? (
        <span
          className={cn(
            "whitespace-nowrap leading-none font-bold tracking-[-0.025em]",
            small ? "text-[17px]" : "text-[20px]",
            dark ? "text-white" : "text-ink",
          )}
        >
          Brend&nbsp;Market
        </span>
      ) : null}
    </span>
  )

  if (!href) return content
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 whitespace-nowrap"
      aria-label="Brend Market — на главную"
    >
      {content}
    </Link>
  )
}
