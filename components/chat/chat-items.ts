import type { ChatItem } from "@/components/chat/chat-thread"
import { messageAffiliation } from "@/lib/message-author"
import type { MessageDeliveryStatus } from "@/types"

type AnyMessage = {
  id: number
  sender_id: number
  sender_name?: string | null
  sender_avatar?: string | null
  sender_role?: string | null
  sender_company?: string | null
  text: string
  created_at?: string | null
  status?: string | null
}

/** Any chat message from the API, in the shape the chat view draws. */
export const toChatItem = (message: AnyMessage, fallbackName: string): ChatItem => ({
  id: message.id,
  senderId: message.sender_id,
  senderName: message.sender_name?.trim() || fallbackName || "Участник",
  senderAvatar: message.sender_avatar ?? null,
  affiliation: messageAffiliation(message) || null,
  text: message.text,
  createdAt: message.created_at ?? null,
  status: (message.status as MessageDeliveryStatus | null) ?? undefined,
})
