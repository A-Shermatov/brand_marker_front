"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/** Soft background tints for initials; a name always gets the same one. */
const TINTS = [
  "bg-brand-100 text-brand-700",
  "bg-safe-100 text-safe-700",
  "bg-amber-100 text-amber-800",
  "bg-red-100 text-red-700",
  "bg-surface-muted text-ink-soft",
]

export const initialsFrom = (name: string, fallback = "?") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || fallback

const tintFor = (name: string) => {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return TINTS[hash % TINTS.length]
}

/**
 * A person's or a company's picture: their photo when they uploaded one,
 * otherwise their initials on a tint that stays the same for the same name.
 */
export function UserAvatar({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string | null
  name: string
  size?: number
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) }
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={style}
        onError={() => setBroken(true)}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-line", className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-line",
        tintFor(name),
        className,
      )}
    >
      {initialsFrom(name)}
    </span>
  )
}
