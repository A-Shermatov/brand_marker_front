import type {
  ContractWithRelations,
  Currency,
  InvoiceStatus,
  SupplierBalanceSummary,
  Withdrawal,
  WithdrawalBank,
  WithdrawalDestinationType,
  WithdrawalStatus,
} from "@/types"
import { WITHDRAWAL_BANKS } from "@/types"
import { getEscrowSummary, PENDING_MILESTONE_STATUSES } from "@/lib/contract-display"

export { WITHDRAWAL_BANKS }

export const withdrawalBankLabel = (bank: WithdrawalBank | string | null | undefined): string => {
  switch (bank) {
    case "alif":
      return "Alif"
    case "dc":
      return "DC"
    case "eskhata":
      return "Eskhata"
    default:
      return bank ? String(bank) : "Банк"
  }
}

const RESERVED_WITHDRAWAL_STATUSES: WithdrawalStatus[] = [
  "pending",
  "processing",
]

export const withdrawalStatusMeta: Record<
  WithdrawalStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Ожидает",
    className: "bg-warning/10 text-warning",
  },
  processing: {
    label: "В обработке",
    className: "bg-info/10 text-info",
  },
  completed: {
    label: "Выполнен",
    className: "bg-success/10 text-success",
  },
  failed: {
    label: "Ошибка",
    className: "bg-destructive/10 text-destructive",
  },
  cancelled: {
    label: "Отменён",
    className: "bg-muted text-muted-foreground",
  },
}

export const invoiceStatusMeta: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Черновик",
    className: "bg-muted text-muted-foreground",
  },
  issued: {
    label: "Выставлен",
    className: "bg-info/10 text-info",
  },
  paid: {
    label: "Оплачен",
    className: "bg-success/10 text-success",
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

export const destinationTypeLabel = (
  type: WithdrawalDestinationType,
): string => (type === "bank" ? "Банковский счёт" : "Кошелёк")

const getSupplierMilestones = (
  contracts: ContractWithRelations[],
  actorId: number,
) =>
  contracts
    .filter((c) => c.supplier_actor_id === actorId)
    .flatMap((c) => c.payment_plan?.milestones ?? [])

export const getRevenueFromContracts = (
  contracts: ContractWithRelations[],
  actorId: number,
): number =>
  getSupplierMilestones(contracts, actorId)
    .filter((m) => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0)

export const getPendingFromContracts = (
  contracts: ContractWithRelations[],
  actorId: number,
): number =>
  getSupplierMilestones(contracts, actorId)
    .filter((m) => PENDING_MILESTONE_STATUSES.includes(m.status))
    .reduce((sum, m) => sum + m.amount, 0)

export const getEscrowLockedFromContracts = (
  contracts: ContractWithRelations[],
  actorId: number,
): number =>
  contracts
    .filter((c) => c.supplier_actor_id === actorId)
    .reduce((sum, contract) => {
      const summary = getEscrowSummary(contract)
      return sum + summary.held + summary.disputed
    }, 0)

export const getSupplierBalances = (
  actorId: number,
  contracts: ContractWithRelations[],
  withdrawals: Withdrawal[],
  currency: Currency = "TJS",
): SupplierBalanceSummary => {
  const actorWithdrawals = withdrawals.filter((w) => w.actor_id === actorId)
  const revenue = getRevenueFromContracts(contracts, actorId)
  const completedTotal = actorWithdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + w.amount, 0)
  const reservedTotal = actorWithdrawals
    .filter((w) => RESERVED_WITHDRAWAL_STATUSES.includes(w.status))
    .reduce((sum, w) => sum + w.amount, 0)

  const available = Math.max(0, revenue - completedTotal - reservedTotal)

  return {
    available,
    pending: getPendingFromContracts(contracts, actorId),
    escrowLocked: getEscrowLockedFromContracts(contracts, actorId),
    currency,
  }
}
