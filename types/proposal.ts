export const CURRENCIES = ["TJS", "USD", "EUR", "KZT", "CNY"] as const

export type Currency = (typeof CURRENCIES)[number]

export const PROPOSAL_STATUSES = [
  "submitted",
  "viewed",
  "shortlisted",
  "pending_supplier",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
] as const

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]

export type ProposalAttachment = {
  id: number
  proposal_id: number
  file_name: string
  file_url: string
  file_type: string
}

export type Proposal = {
  id: number
  rfq_id: string
  supplier_actor_id: number
  price: number
  currency: Currency
  delivery_time: string | null
  message: string | null
  status: ProposalStatus
  created_at: string
}

export type ProposalWithRelations = Proposal & {
  attachment: ProposalAttachment | null
}

export type ProposalCreate = Omit<
  Proposal,
  "id" | "status" | "created_at"
> & {
  status?: ProposalStatus
}

export type ProposalUpdate = Partial<
  Omit<Proposal, "id" | "rfq_id" | "supplier_actor_id" | "created_at">
>

export type ProposalAttachmentCreate = Omit<ProposalAttachment, "id">

export type ProposalAttachmentUpdate = Partial<
  Omit<ProposalAttachmentCreate, "proposal_id">
>

export type ProposalMessage = {
  id: number
  proposal_id: number
  sender_id: number
  sender_name: string
  /** Role in the company the sender speaks for (director, admin, moderator, accountant). */
  sender_role?: string | null
  sender_company?: string | null
  text: string
  created_at: string
}

export type ProposalMessageThread = {
  proposal_id: number
  rfq_id: string
  rfq_title: string
  status: ProposalStatus
  counterpart_actor_id: number
  counterpart_name: string
  message_count: number
  last_message: Omit<ProposalMessage, "proposal_id"> | null
}
