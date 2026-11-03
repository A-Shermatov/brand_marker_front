"use client"

import { useEffect, useState } from "react"
import { ClockIcon as Clock } from "@phosphor-icons/react/dist/ssr"
import type { ContractStatus } from "@/types"
import { cn } from "@/lib/utils"
import { formatIsoDate } from "@/lib/format"
import {
  formatCountdownLabel,
  getTimeRemaining,
  isUrgentDeadline,
  shouldShowContractCountdown,
  type TimeRemaining,
} from "@/lib/deadline"

type DeadlineCountdownProps = {
  dueDate: string
  status: ContractStatus
  variant?: "compact" | "prominent"
  showAbsoluteDate?: boolean
  className?: string
}

const getCountdownColor = (remaining: TimeRemaining) => {
  if (remaining.expired) return "text-destructive"
  if (isUrgentDeadline(remaining)) return "text-warning"
  return "text-foreground"
}

export const DeadlineCountdown = ({
  dueDate,
  status,
  variant = "compact",
  showAbsoluteDate = false,
  className,
}: DeadlineCountdownProps) => {
  const showCountdown = shouldShowContractCountdown(status)
  const [remaining, setRemaining] = useState(() => getTimeRemaining(dueDate))

  useEffect(() => {
    if (!showCountdown) return
    const update = () => setRemaining(getTimeRemaining(dueDate))
    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [dueDate, showCountdown])

  if (!showCountdown) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        до {formatIsoDate(dueDate)}
      </span>
    )
  }

  const label = formatCountdownLabel(remaining)
  const colorClass = getCountdownColor(remaining)

  if (variant === "prominent") {
    return (
      <div className={cn("text-right", className)}>
        {showAbsoluteDate && (
          <p className="text-xs text-muted-foreground">до {formatIsoDate(dueDate)}</p>
        )}
        <p
          className={cn("text-sm font-bold mt-0.5 flex items-center justify-end gap-1.5", colorClass)}
          aria-live="polite"
          aria-atomic="true"
        >
          <Clock size={14} className="flex-shrink-0" />
          <span>{remaining.expired ? label : `Осталось ${label}`}</span>
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      <p
        className={cn("text-xs font-semibold flex items-center gap-1", colorClass)}
        aria-live="polite"
        aria-atomic="true"
      >
        <Clock size={11} className="flex-shrink-0" />
        <span>{label}</span>
      </p>
      {showAbsoluteDate && (
        <p className="text-[10px] text-muted-foreground">до {formatIsoDate(dueDate)}</p>
      )}
    </div>
  )
}
