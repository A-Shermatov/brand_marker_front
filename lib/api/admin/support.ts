import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketListItem,
  SupportTicketStatus,
} from "@/types/support"
import { apiFetch } from "../client"

const PREFIX = "/admin/support"

export type AdminSupportListParams = PageParams & {
  status?: SupportTicketStatus | "all"
}

export const adminSupportApi = {
  /** Start a conversation with a person: their open support chat on that side, or a new one. */
  openForUser: (userId: number, side?: "buyer" | "supplier") =>
    apiFetch<SupportTicket>(`${PREFIX}/users/${userId}/ticket`, {
      method: "POST",
      body: JSON.stringify({ side: side ?? null }),
    }),

  list: (params: AdminSupportListParams = {}) => {
    const { status = "open", page, pageSize } = params
    return apiFetch<Page<SupportTicketListItem>>(
      `${PREFIX}/tickets${buildPageQuery({ page, pageSize, status })}`,
    )
  },

  get: (ticketId: number) =>
    apiFetch<SupportTicketDetail>(`${PREFIX}/tickets/${ticketId}`),

  unreadCount: () => apiFetch<{ count: number }>(`${PREFIX}/unread-count`),

  sendMessage: (ticketId: number, text: string, file?: File | null) => {
    const form = new FormData()
    if (text) form.append("text", text)
    if (file) form.append("file", file)
    return apiFetch<SupportMessage>(`${PREFIX}/tickets/${ticketId}/messages`, {
      method: "POST",
      body: form,
    })
  },

  markDelivered: (ticketId: number, messageId: number) =>
    apiFetch<SupportMessage>(
      `${PREFIX}/tickets/${ticketId}/messages/${messageId}/delivered`,
      { method: "POST" },
    ),

  markRead: (ticketId: number) =>
    apiFetch<{ message_ids: number[]; messages?: SupportMessage[] }>(
      `${PREFIX}/tickets/${ticketId}/messages/read`,
      { method: "POST" },
    ),

  closeTicket: (ticketId: number) =>
    apiFetch<SupportTicket>(`${PREFIX}/tickets/${ticketId}/close`, {
      method: "POST",
    }),
}
