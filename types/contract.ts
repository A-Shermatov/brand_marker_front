import type { Currency } from "./proposal"
import type {
  PaymentPlanWithMilestones,
  PaymentType,
} from "./payment"

export const CONTRACT_STATUSES = [
  "pending_payment",
  "active",
  "delivered",
  "completed",
  "cancelled",
  "disputed",
] as const

export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export const WORK_SUBMISSION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
] as const

export type WorkSubmissionStatus =
  (typeof WORK_SUBMISSION_STATUSES)[number]

export const WORK_SUBMISSION_TYPES = ["delivery", "work"] as const

export type WorkSubmissionType = (typeof WORK_SUBMISSION_TYPES)[number]

export type MessageAttachment = {
  id: number
  message_id: number
  file_name: string
  file_url: string
  file_type: string
}

export type MessageDeliveryStatus = "sent" | "delivered" | "viewed"

export type Message = {
  id: number
  conversation_id: number
  sender_id: number
  sender_name?: string
  /** Role in the company the sender speaks for (director, admin, moderator, accountant). */
  sender_role?: string | null
  sender_company?: string | null
  text: string
  attachment: MessageAttachment | null
  created_at?: string
  status?: MessageDeliveryStatus
  delivered_at?: string | null
  viewed_at?: string | null
}

export type Conversation = {
  id: number
  contract_id: number
}

export type ConversationWithMessages = Conversation & {
  messages: Message[]
}

export type ContractFile = {
  id: number
  contract_id: number
  file_name: string
  file_url: string
  file_type: string
  uploaded_by: number
  uploaded_by_name?: string | null
  uploaded_by_side?: "buyer" | "supplier" | null
  created_at: string
}

export type SubmissionAssetKind = "image" | "video" | "file" | "link"

export type SubmissionAsset = {
  kind: SubmissionAssetKind
  name: string
  url: string
  file_type?: string | null
}

export type WorkSubmission = {
  id: number
  contract_id: number
  type: WorkSubmissionType
  note: string
  status: WorkSubmissionStatus
  submitted_at: string
  file_names: string[]
  assets?: SubmissionAsset[]
}

export const DISPUTE_STATUSES = [
  "open",
  "under_review",
  "resolved",
  "appealed",
] as const

export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

export type DisputeEvidence = {
  id: number
  file_name: string
  file_url: string
  file_type: string
  note: string | null
  uploaded_by_actor_id: number | null
  created_at: string
}

export type ContractDispute = {
  id: number
  status: DisputeStatus
  opened_by_actor_id: number | null
  buyer_statement: string | null
  supplier_statement: string | null
  admin_instructions: string | null
  created_at: string
  updated_at: string
  evidence: DisputeEvidence[]
}

export type Contract = {
  id: number
  rfq_id: string
  proposal_id: number
  buyer_actor_id: number
  supplier_actor_id: number
  title: string
  description: string | null
  agreed_amount: number
  currency: Currency
  start_date: string
  due_date: string
  payment_type: PaymentType
  created_at: string
  status: ContractStatus
  commission_amount?: number
  commission_percent?: number | null
  commission_min?: number | null
}

export type ContractWithRelations = Contract & {
  payment_plan: PaymentPlanWithMilestones | null
  conversation: ConversationWithMessages | null
  files: ContractFile[]
  submissions: WorkSubmission[]
  dispute?: ContractDispute | null
}

export type ContractCreate = Omit<
  Contract,
  "id" | "status" | "created_at"
> & {
  status?: ContractStatus
}

export type ContractUpdate = Partial<
  Omit<
    Contract,
    "id" | "rfq_id" | "proposal_id" | "buyer_actor_id" | "supplier_actor_id" | "created_at"
  >
>

export type ConversationCreate = Omit<Conversation, "id">

export type MessageCreate = Omit<Message, "id">

export type MessageAttachmentCreate = Omit<MessageAttachment, "id">

export type ContractFileCreate = Omit<ContractFile, "id">

export type WorkSubmissionCreate = Omit<WorkSubmission, "id" | "submitted_at" | "status"> & {
  status?: WorkSubmissionStatus
}
