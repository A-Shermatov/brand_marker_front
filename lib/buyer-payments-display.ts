import type { ContractWithRelations, Currency } from "@/types"
import type { PaymentHistoryItem } from "@/lib/api/payments"

export type PaymentHistoryEventType = "funding" | "release" | "refund"

export type PaymentHistoryEvent = {
  id: string
  contractId: number
  milestoneId: number
  title: string
  amount: number
  currency: Currency
  type: PaymentHistoryEventType
  at: string
}

export type OutgoingPaymentRow = PaymentHistoryEvent & {
  contractTitle: string
  supplierActorId: number
}

export type EscrowFundingRow = {
  contractId: number
  contractTitle: string
  milestoneId: number
  title: string
  amount: number
  currency: Currency
  status: string
  supplierActorId: number
}

const historyTypeForStatus = (
  status: string,
): PaymentHistoryEventType | null => {
  if (status === "funded") return "funding"
  if (status === "released") return "release"
  if (status === "refunded") return "refund"
  return null
}

export const mapApiPaymentHistoryEvent = (
  item: PaymentHistoryItem,
): PaymentHistoryEvent => ({
  id: `${item.contract_id}-${item.milestone_id}-${item.event}`,
  contractId: item.contract_id,
  milestoneId: item.milestone_id,
  title: item.title,
  amount: item.amount,
  currency: item.currency as Currency,
  type: (item.event === "release"
    ? "release"
    : item.event === "refund"
      ? "refund"
      : "funding") as PaymentHistoryEventType,
  at: item.created_at,
})

export const buildPaymentHistoryFromContract = (
  contract: ContractWithRelations,
  eventsAt?: Record<string, string>,
): PaymentHistoryEvent[] => {
  const milestones = contract.payment_plan?.milestones ?? []
  const events: PaymentHistoryEvent[] = []

  for (const milestone of milestones) {
    const type = historyTypeForStatus(milestone.status)
    if (!type) continue
    const key = `${contract.id}-${milestone.id}-${type}`
    events.push({
      id: key,
      contractId: contract.id,
      milestoneId: milestone.id,
      title: milestone.title,
      amount: milestone.amount,
      currency: contract.currency,
      type,
      at: eventsAt?.[key] ?? contract.created_at,
    })
  }

  return events.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  )
}

export const paymentHistoryTypeLabel: Record<PaymentHistoryEventType, string> = {
  funding: "Безопасная оплата",
  release: "Выплата поставщику",
  refund: "Возврат",
}
