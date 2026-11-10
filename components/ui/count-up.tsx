"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

type CountUpProps = {
  value: number
  /** How the number is written: money, a plain count… */
  format?: (value: number) => string
  /** Milliseconds for the whole run. */
  duration?: number
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * A number that runs up to its value when it arrives, and from the old value
 * to the new one when it changes — so a figure that just loaded or just
 * moved is noticed. Screen readers get the final value at once.
 */
export function CountUp({ value, format = String, duration = 650 }: CountUpProps) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)

  useIsoLayoutEffect(() => {
    const start = from.current
    from.current = value
    if (start === value || prefersReducedMotion() || !Number.isFinite(value)) {
      setShown(value)
      return
    }
    let frame = 0
    const began = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / duration)
      // Ease out: fast at first, settling at the end.
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(start + (value - start) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  const whole = Number.isInteger(value)
  return (
    <>
      <span aria-hidden>{format(whole ? Math.round(shown) : shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
