"use client"

import { usePathname } from "next/navigation"

/**
 * The content of a cabinet page settles into place when the page opens, so a
 * change of section reads as a movement and not as a blink. Keyed by the path
 * only: switching a filter or a tab in the address keeps the page still.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="bm-page">
      {children}
    </div>
  )
}
