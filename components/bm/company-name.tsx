import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { normalizeReputationTier } from "@/lib/trust-levels"
import { TrustMark } from "@/components/bm/trust-mark"

type CompanyNameSize = "sm" | "md" | "lg" | "xl"

type CompanyNameProps = {
  name: React.ReactNode
  verified?: boolean
  /** Reliability tier: silver / gold / diamond */
  tier?: string | null
  size?: CompanyNameSize
  className?: string
  nameClassName?: string
  /** Colour of the document-check seal, for dark surfaces. */
  sealClassName?: string
  /** Element for the name itself (h1 on profile pages). */
  as?: "span" | "h1" | "h2" | "h3" | "p"
}

const SIZES: Record<CompanyNameSize, { text: string; mark: number; seal: string; gap: string }> = {
  // Whole-pixel sizes; up to 24 px the marks switch to their sharp small drawing.
  sm: { text: "text-[13.5px]", mark: 18, seal: "size-4", gap: "gap-1" },
  md: { text: "text-[15px]", mark: 20, seal: "size-[18px]", gap: "gap-1.5" },
  lg: { text: "text-[18px]", mark: 24, seal: "size-5", gap: "gap-1.5" },
  xl: { text: "text-[26px] leading-tight tracking-[-0.02em]", mark: 34, seal: "size-6", gap: "gap-2" },
}

/**
 * Company name with its marks, in a fixed order: document check, then the
 * earned reliability mark. Every mark has a tooltip. A paid plan is not a mark
 * next to the name: it shows as a highlighted card in lists (see promoted.tsx).
 */
export function CompanyName({
  name,
  verified = false,
  tier,
  size = "md",
  className,
  nameClassName,
  sealClassName,
  as: Name = "span",
}: CompanyNameProps) {
  const s = SIZES[size]
  const trust = normalizeReputationTier(tier)

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center", s.gap, className)}>
      <Name className={cn("min-w-0 truncate font-semibold text-ink", s.text, nameClassName)}>
        {name}
      </Name>
      {verified || trust !== "none" ? (
        <span className={cn("inline-flex shrink-0 items-center", s.gap)}>
          {verified ? (
            <span title="Компания проверена по документам" className="inline-flex">
              <SealCheckIcon
                weight="fill"
                className={cn("text-brand-600", s.seal, sealClassName)}
                aria-label="Компания проверена по документам"
                role="img"
              />
            </span>
          ) : null}
          {trust !== "none" ? <TrustMark tier={trust} size={s.mark} /> : null}
        </span>
      ) : null}
    </span>
  )
}
