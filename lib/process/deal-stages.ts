import type { ContractWithRelations, PaymentMilestone } from "@/types"

export type DealRole = "buyer" | "supplier"

export type DealStepKey = "contract" | "payment" | "work" | "acceptance" | "done"

export type DealPhase =
  | "prepay"
  | "work"
  | "acceptance"
  | "postpay"
  | "release"
  | "done"
  | "disputed"
  | "cancelled"

export type DealStep = {
  key: DealStepKey
  label: string
}

const STEP_LABELS: Record<DealStepKey, string> = {
  contract: "Договор",
  payment: "Оплата",
  work: "Работа",
  acceptance: "Приёмка",
  done: "Завершено",
}

const PREPAY_ORDER: DealStepKey[] = ["contract", "payment", "work", "acceptance", "done"]
const POSTPAY_ORDER: DealStepKey[] = ["contract", "work", "acceptance", "payment", "done"]

const UNPAID_STATUSES: PaymentMilestone["status"][] = ["pending", "awaiting_payment"]

type DealContract = Pick<ContractWithRelations, "status" | "payment_type" | "payment_plan" | "dispute">

const getMilestones = (contract: DealContract): PaymentMilestone[] =>
  contract.payment_plan?.milestones ?? []

export const isPostpaymentDeal = (contract: DealContract): boolean => {
  const milestones = getMilestones(contract)
  if (milestones.length === 0) return contract.payment_type === "full_postpayment"
  return milestones.every((m) => m.trigger === "delivery_accepted")
}

export const getDealSteps = (contract: DealContract): DealStep[] =>
  (isPostpaymentDeal(contract) ? POSTPAY_ORDER : PREPAY_ORDER).map((key) => ({
    key,
    label: STEP_LABELS[key],
  }))

export const getUnpaidMilestone = (contract: DealContract): PaymentMilestone | undefined =>
  getMilestones(contract).find((m) => UNPAID_STATUSES.includes(m.status))

export const getFundedMilestone = (contract: DealContract): PaymentMilestone | undefined =>
  getMilestones(contract).find((m) => m.status === "funded")

const hasUnpaidPrepayment = (contract: DealContract): boolean =>
  getMilestones(contract).some(
    (m) => m.trigger === "contract_signed" && UNPAID_STATUSES.includes(m.status),
  )

const isDisputeActive = (contract: DealContract): boolean =>
  contract.status === "disputed"
  || (contract.dispute != null && contract.dispute.status !== "resolved")

export const getDealPhase = (contract: DealContract): DealPhase => {
  if (contract.status === "cancelled") return "cancelled"
  if (isDisputeActive(contract)) return "disputed"
  if (contract.status === "completed") {
    if (getUnpaidMilestone(contract)) return "postpay"
    if (getFundedMilestone(contract)) return "release"
    return "done"
  }
  if (contract.status === "delivered") return "acceptance"
  if (contract.status === "pending_payment" && hasUnpaidPrepayment(contract)) return "prepay"
  return "work"
}

const PHASE_STEP: Record<Exclude<DealPhase, "disputed" | "cancelled">, DealStepKey> = {
  prepay: "payment",
  work: "work",
  acceptance: "acceptance",
  postpay: "payment",
  release: "payment",
  done: "done",
}

/** Index of the current step in `getDealSteps`; `-1` when the deal is cancelled. */
export const getDealStepIndex = (contract: DealContract): number => {
  const phase = getDealPhase(contract)
  const steps = getDealSteps(contract)
  if (phase === "cancelled") return -1
  if (phase === "disputed") {
    const key: DealStepKey = contract.status === "delivered" ? "acceptance" : "work"
    return steps.findIndex((s) => s.key === key)
  }
  return steps.findIndex((s) => s.key === PHASE_STEP[phase])
}

export const DEAL_NEXT_STEP: Record<DealRole, Record<DealPhase, string>> = {
  buyer: {
    prepay: "Оплатите сделку на гарантию площадки",
    work: "Поставщик выполняет работу",
    acceptance: "Проверьте и примите работу",
    postpay: "Оплатите принятую работу",
    release: "Подтвердите выплату поставщику",
    done: "Сделка завершена",
    disputed: "Идёт спор — решение примет администратор",
    cancelled: "Сделка отменена",
  },
  supplier: {
    prepay: "Ждём оплату покупателя",
    work: "Выполните и сдайте работу",
    acceptance: "Ждём приёмку покупателем",
    postpay: "Ждём оплату покупателя",
    release: "Ждём подтверждения выплаты",
    done: "Деньги зачислены",
    disputed: "Идёт спор — решение примет администратор",
    cancelled: "Сделка отменена",
  },
}

const ACTION_PHASES: Record<DealRole, DealPhase[]> = {
  buyer: ["prepay", "acceptance", "postpay", "release"],
  supplier: ["work"],
}

export const dealNeedsAction = (role: DealRole, contract: DealContract): boolean =>
  ACTION_PHASES[role].includes(getDealPhase(contract))

export const isDealOpen = (contract: DealContract): boolean => {
  const phase = getDealPhase(contract)
  return phase !== "done" && phase !== "cancelled"
}

export type DealListTab = "all" | "active" | "completed" | "disputed" | "cancelled"

const matchesDealTab = (phase: DealPhase, tab: DealListTab): boolean => {
  if (tab === "all") return true
  if (tab === "completed") return phase === "done"
  if (tab === "disputed") return phase === "disputed"
  if (tab === "cancelled") return phase === "cancelled"
  return phase !== "done" && phase !== "disputed" && phase !== "cancelled"
}

/**
 * Tabs follow the deal phase, not the raw status: a `completed` contract that still waits
 * for postpayment or payout confirmation stays in "active". Deals needing action come first.
 */
export const filterDealsByTab = <T extends DealContract>(
  contracts: T[],
  tab: DealListTab,
  role: DealRole,
): T[] =>
  contracts
    .filter((contract) => matchesDealTab(getDealPhase(contract), tab))
    .sort((a, b) => Number(dealNeedsAction(role, b)) - Number(dealNeedsAction(role, a)))
