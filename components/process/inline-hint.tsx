import { WarningIcon as AlertTriangle, InfoIcon as Info, LockIcon as Lock } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type InlineHintVariant = "info" | "escrow" | "warning"

const VARIANTS: Record<InlineHintVariant, { Icon: PhosphorIcon; box: string; icon: string }> = {
  info: { Icon: Info, box: "bg-brand-50 text-brand-900", icon: "text-brand-600" },
  escrow: { Icon: Lock, box: "bg-brand-50 text-brand-900", icon: "text-brand-600" },
  warning: { Icon: AlertTriangle, box: "bg-amber-50 text-amber-900", icon: "text-amber-600" },
}

type InlineHintProps = {
  children: React.ReactNode
  variant?: InlineHintVariant
  className?: string
}

export const InlineHint = ({ children, variant = "info", className }: InlineHintProps) => {
  const { Icon, box, icon } = VARIANTS[variant]
  return (
    <div className={cn("flex gap-3 rounded-xl p-4 text-sm", box, className)}>
      <Icon size={20} className={cn("shrink-0", icon)} aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}
