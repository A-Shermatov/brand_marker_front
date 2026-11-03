import { cn } from "@/lib/utils"
import {
  normalizeReputationTier,
  reputationTierHint,
  trustLevelMeta,
  type ReputationTier,
} from "@/lib/trust-levels"
import { TrustMark } from "@/components/bm/trust-mark"

type ReputationBadgeProps = {
  tier: string | null | undefined
  className?: string
  showLabel?: boolean
  size?: number
}

const TONES: Record<Exclude<ReputationTier, "none">, string> = {
  silver: "bg-[#F1F2F4] text-[#48505B] ring-[#D6DADF]",
  gold: "bg-[#FBF3DC] text-[#744E00] ring-[#EACB7C]",
  diamond:
    "bg-[linear-gradient(100deg,#3A0C7A,#7A22C8_55%,#C2389F)] text-white ring-[#FF7BD5]/60 shadow-[0_1px_6px_rgba(170,40,170,.35)]",
}

/** Reliability mark with its name, for profile headers and cards. */
export function ReputationBadge({
  tier,
  className,
  showLabel = true,
  size = 18,
}: ReputationBadgeProps) {
  const id = normalizeReputationTier(tier)
  const meta = trustLevelMeta(id)
  if (id === "none" || !meta) return null

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset",
        size <= 16 ? "h-5 pl-0.5 pr-2 text-[11.5px]" : "h-6 pl-0.5 pr-2.5 text-[12.5px]",
        TONES[id],
        className,
      )}
      title={reputationTierHint(id)}
    >
      <TrustMark tier={id} size={size <= 16 ? 16 : 20} decorative />
      {showLabel ? <span>{meta.name}</span> : null}
    </span>
  )
}
