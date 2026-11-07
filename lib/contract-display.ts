import type { ContractStatus, ContractWithRelations, WorkSubmissionStatus } from "@/types"
import type { PaymentMilestoneStatus } from "@/types"
import { formatCurrency } from "@/lib/format"

export type ContractListTab = "all" | "active" | "completed" | "disputed" | "cancelled"

export const CONTRACT_LIST_TABS: { value: ContractListTab; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "В работе" },
  { value: "completed", label: "Завершённые" },
  { value: "disputed", label: "Споры" },
  { value: "cancelled", label: "Отменённые" },
]

const ACTIVE_STATUSES: ContractStatus[] = [
  "active",
  "pending_payment",
  "delivered",
]

export const filterContractsByTab = (
  contracts: ContractWithRelations[],
  tab: ContractListTab,
): ContractWithRelations[] => {
  if (tab === "all") {
    return contracts
  }
  if (tab === "active") {
    return contracts.filter((c) => ACTIVE_STATUSES.includes(c.status))
  }
  if (tab === "completed") {
    return contracts.filter((c) => c.status === "completed")
  }
  if (tab === "disputed") {
    return contracts.filter((c) => c.status === "disputed")
  }
  return contracts.filter((c) => c.status === "cancelled")
}

const FILE_UPLOAD_CLOSED_STATUSES: ContractStatus[] = ["completed", "cancelled"]

export const canUploadContractFiles = (status: ContractStatus): boolean =>
  !FILE_UPLOAD_CLOSED_STATUSES.includes(status)

export type EscrowSummary = {
  held: number
  released: number
  disputed: number
  currency: string
}

const HELD_STATUSES: PaymentMilestoneStatus[] = [
  "funded",
  "submitted",
  "in_progress",
  "awaiting_payment",
]

export const getEscrowSummary = (
  contract: ContractWithRelations,
): EscrowSummary => {
  const milestones = contract.payment_plan?.milestones ?? []
  return milestones.reduce(
    (acc, milestone) => {
      if (milestone.status === "released") {
        acc.released += milestone.amount
      } else if (milestone.status === "disputed") {
        acc.disputed += milestone.amount
      } else if (HELD_STATUSES.includes(milestone.status)) {
        acc.held += milestone.amount
      }
      return acc
    },
    {
      held: 0,
      released: 0,
      disputed: 0,
      currency: contract.currency,
    },
  )
}

export const escrowSummaryMeta = {
  held: { label: "На гарантии площадки", className: "bg-info/10 text-info" },
  released: { label: "Выплачено", className: "bg-success/10 text-success" },
  disputed: { label: "Спор — деньги на гарантии", className: "bg-destructive/10 text-destructive" },
} as const

export const contractStatusMeta: Record<
  ContractStatus,
  { label: string; className: string }
> = {
  pending_payment: {
    label: "Ожидает оплаты",
    className: "bg-warning/10 text-warning",
  },
  active: {
    label: "В работе",
    className: "bg-primary/10 text-primary",
  },
  delivered: {
    label: "Ждёт приёмки",
    className: "bg-info/10 text-info",
  },
  completed: {
    label: "Завершена",
    className: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Отменена",
    className: "bg-muted text-muted-foreground",
  },
  disputed: {
    label: "Спор",
    className: "bg-destructive/10 text-destructive",
  },
}

export const milestoneStatusMeta: Record<
  PaymentMilestoneStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Ожидает",
    className: "bg-muted text-muted-foreground",
  },
  awaiting_payment: {
    label: "Ожидает оплаты",
    className: "bg-warning/10 text-warning",
  },
  funded: {
    label: "Оплачено",
    className: "bg-info/10 text-info",
  },
  in_progress: {
    label: "В работе",
    className: "bg-muted text-muted-foreground",
  },
  submitted: {
    label: "На проверке",
    className: "bg-warning/10 text-warning",
  },
  approved: {
    label: "Одобрен",
    className: "bg-success/10 text-success",
  },
  released: {
    label: "Выплачен",
    className: "bg-success/10 text-success",
  },
  refunded: {
    label: "Возвращён",
    className: "bg-info/10 text-info",
  },
  disputed: {
    label: "Спор",
    className: "bg-destructive/10 text-destructive",
  },
  overdue: {
    label: "Просрочен",
    className: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "Отменён",
    className: "bg-muted text-muted-foreground",
  },
}

export const workSubmissionStatusMeta: Record<
  WorkSubmissionStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "На проверке",
    className: "bg-warning/10 text-warning",
  },
  accepted: {
    label: "Принято",
    className: "bg-success/10 text-success",
  },
  rejected: {
    label: "Отклонено",
    className: "bg-destructive/10 text-destructive",
  },
}

export const getSubmissionTypeLabel = (type: "delivery" | "work"): string =>
  type === "delivery" ? "Доставка" : "Выполнение работ"

export const formatEscrowSummary = (summary: EscrowSummary): string => {
  const parts: string[] = []
  if (summary.held > 0) {
    parts.push(`${escrowSummaryMeta.held.label}: ${formatCurrency(summary.held, summary.currency)}`)
  }
  if (summary.released > 0) {
    parts.push(`${escrowSummaryMeta.released.label}: ${formatCurrency(summary.released, summary.currency)}`)
  }
  if (summary.disputed > 0) {
    parts.push(`${escrowSummaryMeta.disputed.label}: ${formatCurrency(summary.disputed, summary.currency)}`)
  }
  return parts.length > 0 ? parts.join(" · ") : "Нет движений"
}

export const PENDING_MILESTONE_STATUSES: PaymentMilestoneStatus[] = [
  "awaiting_payment",
  "funded",
  "submitted",
  "in_progress",
]

export const getMilestoneProgress = (contract: ContractWithRelations): number => {
  const milestones = contract.payment_plan?.milestones ?? []
  if (milestones.length === 0) return 0
  const released = milestones
    .filter((m) => m.status === "released")
    .reduce((sum, m) => sum + m.percentage, 0)
  return released
}
