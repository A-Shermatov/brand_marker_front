import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type {
  ProposalMessage,
  ProposalMessageThread,
  ProposalUpdate,
  ProposalWithRelations,
  RfqWithRelations,
} from "@/types"
import { apiFetch } from "../client"

const RFQ_PREFIX = "/supplier/rfqs"
const PROPOSAL_PREFIX = "/supplier/proposals"

export const supplierRfqsApi = {
  board: (
    params: PageParams & { q?: string; source?: string; category_ids?: string } = {},
  ) =>
    apiFetch<Page<RfqWithRelations>>(`${RFQ_PREFIX}/board${buildPageQuery(params)}`),

  /** Categories in which this employee is notified about new requests. */
  subscriptions: () =>
    apiFetch<{ category_ids: number[] }>(`${RFQ_PREFIX}/subscriptions`),

  saveSubscriptions: (categoryIds: number[]) =>
    apiFetch<{ category_ids: number[] }>(`${RFQ_PREFIX}/subscriptions`, {
      method: "PUT",
      body: JSON.stringify({ category_ids: categoryIds }),
    }),

  get: (id: string) => apiFetch<RfqWithRelations>(`${RFQ_PREFIX}/${id}`),

  submitProposal: (rfqId: string, data: {
    price: number
    currency: string
    delivery_time?: string
    message?: string
  }) =>
    apiFetch<ProposalWithRelations>(`${RFQ_PREFIX}/${rfqId}/proposals`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

export const supplierProposalsApi = {
  list: (params: PageParams = {}) =>
    apiFetch<Page<ProposalWithRelations>>(`${PROPOSAL_PREFIX}/${buildPageQuery(params)}`),

  update: (id: number, data: ProposalUpdate) =>
    apiFetch<ProposalWithRelations>(`${PROPOSAL_PREFIX}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  withdraw: (id: number) =>
    apiFetch<ProposalWithRelations>(`${PROPOSAL_PREFIX}/${id}/withdraw`, { method: "POST" }),

  accept: (id: number) =>
    apiFetch<{ proposal: ProposalWithRelations; contract_id: number }>(
      `${PROPOSAL_PREFIX}/${id}/accept`,
      { method: "POST" },
    ),

  reject: (id: number) =>
    apiFetch<ProposalWithRelations>(`${PROPOSAL_PREFIX}/${id}/reject`, {
      method: "POST",
    }),

  listMessageThreads: () =>
    apiFetch<ProposalMessageThread[]>(`${PROPOSAL_PREFIX}/message-threads`),

  getMessageThread: (id: number) =>
    apiFetch<ProposalMessageThread>(`${PROPOSAL_PREFIX}/${id}/thread`),

  listMessages: (id: number) =>
    apiFetch<ProposalMessage[]>(`${PROPOSAL_PREFIX}/${id}/messages`),

  sendMessage: (id: number, text: string) =>
    apiFetch<ProposalMessage>(`${PROPOSAL_PREFIX}/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
}
