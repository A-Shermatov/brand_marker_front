import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import { apiFetch } from "../client"

export type AdminChatKind = "contract" | "proposal"
export type AdminChatFilter = "all" | "flag" | "disp"

export type AdminChatListItem = {
  id: string
  kind: AdminChatKind
  thread_id: number
  ref_id: number | string
  about: string
  ref_label: string
  party_a: string
  party_b: string
  party_a_company_id: number | null
  party_b_company_id: number | null
  last_text: string
  last_at: string | null
  flagged: boolean
  has_dispute: boolean
}

export type AdminChatMessage = {
  id: number
  sender_id: number | null
  sender_name: string
  /** «other»: somebody who is no longer with either side (left the company). */
  side: "buyer" | "supplier" | "admin" | "other"
  text: string
  created_at: string
  flagged: boolean
  deleted?: boolean
}

export type AdminChatDetail = {
  id: string
  kind: AdminChatKind
  thread_id: number
  ref_id: number | string
  about: string
  ref_label: string
  party_a: string
  party_b: string
  party_a_company_id: number | null
  party_b_company_id: number | null
  flagged: boolean
  has_dispute: boolean
  messages: AdminChatMessage[]
}

export type AdminChatsListParams = PageParams & {
  filter?: AdminChatFilter
  query?: string
}

const PREFIX = "/admin/chats"

export const adminChatsApi = {
  list: (params: AdminChatsListParams = {}) => {
    const { filter = "all", query, page, pageSize } = params
    return apiFetch<Page<AdminChatListItem>>(
      `${PREFIX}${buildPageQuery({
        page,
        pageSize,
        filter: filter === "all" ? undefined : filter,
        query: query?.trim() || undefined,
      })}`,
    )
  },

  get: (chatId: string) => apiFetch<AdminChatDetail>(`${PREFIX}/${encodeURIComponent(chatId)}`),

  sendMessage: (chatId: string, text: string) =>
    apiFetch<AdminChatDetail>(`${PREFIX}/${encodeURIComponent(chatId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  deleteMessage: (chatId: string, messageId: number) =>
    apiFetch<AdminChatDetail>(
      `${PREFIX}/${encodeURIComponent(chatId)}/messages/${messageId}`,
      { method: "DELETE" },
    ),
}
