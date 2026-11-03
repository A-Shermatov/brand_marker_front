import { UserCheckIcon as UserCheck } from "@phosphor-icons/react/dist/ssr"
import { statusPillClass } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

type InvitedRfqBadgeProps = {
  className?: string
}

export const InvitedRfqBadge = ({ className }: InvitedRfqBadgeProps) => (
  <span
    className={cn(statusPillClass, "gap-1 bg-primary/10 text-primary", className)}
    title="Заказчик отправил эту заявку лично вам"
  >
    <UserCheck size={12} aria-hidden="true" />
    Персональная заявка
  </span>
)
