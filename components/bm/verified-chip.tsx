import { ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type VerifiedChipProps = {
  verified?: boolean
  compact?: boolean
  className?: string
}

export function VerifiedChip({ verified = true, compact = false, className }: VerifiedChipProps) {
  if (verified) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-safe-50 font-semibold text-safe-700",
          compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-[12px]",
          className,
        )}
      >
        <ShieldCheck className={compact ? "size-3" : "size-3.5"} aria-hidden />
        {compact ? "Проверена" : "Проверенная компания"}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-amber-50 font-semibold text-amber-800",
        compact ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-[12px]",
        className,
      )}
    >
      На проверке
    </span>
  )
}
