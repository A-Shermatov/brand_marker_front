import type { VerificationStatus } from "./company"
import type { ProposalStatus } from "./proposal"

export const RFQ_TYPES = ["product", "service"] as const

export type RfqType = (typeof RFQ_TYPES)[number]

export const BUDGET_TYPES = ["fixed", "range", "open"] as const

export type BudgetType = (typeof BUDGET_TYPES)[number]

export const RFQ_VISIBILITY_OPTIONS = ["public", "invited_only"] as const

export type RfqVisibility = (typeof RFQ_VISIBILITY_OPTIONS)[number]

export const RFQ_STATUSES = [
  "draft",
  "published",
  "receiving_proposals",
  "supplier_selected",
  "contract_created",
  "in_progress",
  "completed",
  "cancelled",
  "expired",
  "disputed",
  "archived",
] as const

export type RfqStatus = (typeof RFQ_STATUSES)[number]

export type RfqAttachment = {
  id: string
  rfq_id: string
  file_name: string
  file_url: string
  file_type: string
}

export type RfqBuyerSummary = {
  id: number
  kind: "individual" | "company"
  display_name: string
  rating: number
  verification_status: VerificationStatus | null
  city: string | null
  country: string | null
  legal_name?: string | null
  description?: string | null
  website?: string | null
  completed_contracts?: number
}

type RfqBase = {
  id: string
  actor_id: string
  created_by: string
  title: string
  description: string | null
  category_id: string
  budget_type: BudgetType
  budget_from: number | null
  budget_to: number | null
  currency: string
  deadline: string
  visibility: RfqVisibility
  status: RfqStatus
  invited_supplier_ids?: number[]
  catalog_item_id?: number | null
  is_catalog_offer?: boolean
  /** Set when a moderator hid or closed the RFQ */
  moderation_reason?: string | null
  moderated_at?: string | null
  created_at: string
  updated_at: string
}

export type ProductRfq = RfqBase & {
  type: "product"
  quantity: number
  delivery_country: string
  delivery_city: string
  delivery_address: string | null
  delivery_date: string
}

export type ServiceRfq = RfqBase & {
  type: "service"
  project_duration: string
  start_date: string
  team_size_required: number | null
  experience_required: string | null
}

export type Rfq = ProductRfq | ServiceRfq

export type RfqWithRelations = Rfq & {
  attachments: RfqAttachment[]
  buyer?: RfqBuyerSummary
  is_invited?: boolean
  is_catalog_offer?: boolean
  catalog_item_id?: number | null
  my_proposal_status?: ProposalStatus | null
  my_contract_id?: number | null
}

type RfqBaseCreate = Omit<
  RfqBase,
  "id" | "created_at" | "updated_at"
> & {
  status?: RfqStatus
  invited_supplier_ids?: number[]
}

export type ProductRfqCreate = RfqBaseCreate & {
  type: "product"
  quantity: number
  delivery_country: string
  delivery_city: string
  delivery_address?: string | null
  delivery_date: string
}

export type ServiceRfqCreate = RfqBaseCreate & {
  type: "service"
  project_duration: string
  start_date: string
  team_size_required?: number | null
  experience_required?: string | null
}

export type RfqCreate = ProductRfqCreate | ServiceRfqCreate

export type ProductRfqUpdate = Partial<
  Omit<ProductRfq, "id" | "created_at" | "updated_at" | "type">
>

export type ServiceRfqUpdate = Partial<
  Omit<ServiceRfq, "id" | "created_at" | "updated_at" | "type">
>

export type RfqUpdate = ProductRfqUpdate | ServiceRfqUpdate

export type RfqAttachmentCreate = Omit<RfqAttachment, "id">

export type RfqAttachmentUpdate = Partial<
  Omit<RfqAttachmentCreate, "rfq_id">
>
