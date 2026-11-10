import { cn } from "@/lib/utils"

/**
 * "Done": a circle closes and a tick is drawn in it, once. For the moments
 * a person waits for — the payment went through, the request is published.
 * With reduced motion the finished mark is simply shown.
 */
export function SuccessCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 52" fill="none" className={cn("size-8", className)} aria-hidden>
      <circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        className="bm-check-ring"
      />
      <path
        d="M15.5 27l7 7 14-15"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="bm-check-tick"
      />
    </svg>
  )
}
