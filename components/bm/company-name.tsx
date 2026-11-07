import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { normalizeReputationTier } from "@/lib/trust-levels"
import { normalizePlan } from "@/lib/subscription"
import { TrustMark } from "@/components/bm/trust-mark"
import { PlanMark } from "@/components/bm/plan-mark"

type CompanyNameSize = "sm" | "md" | "lg" | "xl"

type CompanyNameProps = {
  name: React.ReactNode
  verified?: boolean
  /** Reliability tier: silver / gold / diamond */
  tier?: string | null
  /** Active subscription plan: start / pro / business */
  plan?: string | null
  size?: CompanyNameSize
  className?: string
  nameClassName?: string
  /** Element for the name itself (h1 on profile pages). */
  as?: "span" | "h1" | "h2" | "h3" | "p"
}

const SIZES: Record<CompanyNameSize, { text: string; mark: number; plan: number; seal: string; gap: string }> = {
  // Whole-pixel sizes; up to 24 px the marks switch to their sharp small drawing.
  sm: { text: "text-[13.5px]", mark: 18, plan: 16, seal: "size-4", gap: "gap-1" },
  md: { text: "text-[15px]", mark: 20, plan: 18, seal: "size-[18px]", gap: "gap-1.5" },
  lg: { text: "text-[18px]", mark: 24, plan: 20, seal: "size-5", gap: "gap-1.5" },
  xl: { text: "text-[26px] leading-tight tracking-[-0.02em]", mark: 34, plan: 26, seal: "size-6", gap: "gap-2" },
}

/**
 * Company name with its marks, in a fixed order: document check, earned
 * reliability mark, then the paid plan. Every mark has a tooltip.
 */
export function CompanyName({
  name,
  verified = false,
  tier,
  plan,
  size = "md",
  className,
  nameClassName,
  as: Name = "span",
}: CompanyNameProps) {
  const s = SIZES[size]
  const trust = normalizeReputationTier(tier)
  const paid = normalizePlan(plan)

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center", s.gap, className)}>
      <Name className={cn("min-w-0 truncate font-semibold text-ink", s.text, nameClassName)}>
        {name}
      </Name>
      {verified || trust !== "none" || paid ? (
        <span className={cn("inline-flex shrink-0 items-center", s.gap)}>
          {verified ? (
            <span title="Компания проверена по документам" className="inline-flex">
              <SealCheckIcon
                weight="fill"
                className={cn("text-brand-600", s.seal)}
                aria-label="Компания проверена по документам"
                role="img"
              />
            </span>
          ) : null}
          {trust !== "none" ? <TrustMark tier={trust} size={s.mark} /> : null}
          {paid ? <PlanMark plan={paid} size={s.plan} /> : null}
        </span>
      ) : null}
    </span>
  )
}
