export const PAYMENT_TYPES = [
  "full_prepayment",
  "split_payment",
  "milestone",
  "full_postpayment",
] as const

export type PaymentType = (typeof PAYMENT_TYPES)[number]

export const PAYMENT_MILESTONE_STATUSES = [
  "pending",
  "awaiting_payment",
  "funded",
  "in_progress",
  "submitted",
  "approved",
  "released",
  "refunded",
  "disputed",
  "overdue",
  "cancelled",
] as const

export type PaymentMilestoneStatus =
  (typeof PAYMENT_MILESTONE_STATUSES)[number]

export const PAYMENT_MILESTONE_TRIGGERS = [
  "contract_signed",
  "delivery_accepted",
] as const

export type PaymentMilestoneTrigger =
  (typeof PAYMENT_MILESTONE_TRIGGERS)[number]

export type PaymentMilestone = {
  id: number
  contract_id: number
  title: string
  percentage: number
  amount: number
  trigger: PaymentMilestoneTrigger | string
  status: PaymentMilestoneStatus
  commission_amount?: number
}

export type PaymentPlan = {
  id: number
  contract_id: number
  payment_type: PaymentType
}

export type PaymentPlanWithMilestones = PaymentPlan & {
  milestones: PaymentMilestone[]
}

export type PaymentPlanCreate = Omit<PaymentPlan, "id">

export type PaymentPlanUpdate = Partial<PaymentPlanCreate>

export type PaymentMilestoneCreate = Omit<PaymentMilestone, "id" | "status"> & {
  status?: PaymentMilestoneStatus
}

export type PaymentMilestoneUpdate = Partial<
  Omit<PaymentMilestone, "id" | "contract_id">
>

export type PaymentMilestoneInput = {
  title: string
  percentage: number
  trigger: PaymentMilestoneTrigger
}

export type ProposalAcceptInput = {
  payment_type: PaymentType
  milestones?: PaymentMilestoneInput[]
  /** Leave out to keep what the buyer chose in the request. */
  payment_mode?: PaymentMode
  /** Price the buyer saw; the API refuses the accept if the supplier changed it. */
  expected_price?: number
}

/**
 * How the buyer pays. "escrow": the bank holds the money until the buyer
 * accepts the work. "direct": the money goes to the supplier as soon as it is paid.
 */
export type PaymentMode = "escrow" | "direct"
