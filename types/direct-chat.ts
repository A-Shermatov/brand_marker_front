import type { MessageDeliveryStatus } from "./contract"

export type DirectChatMessage = {
  id: number
  conversation_id: number
  sender_id: number
  sender_name?: string
  /** Role in the company the sender speaks for (director, admin, moderator, accountant). */
  sender_role?: string | null
  sender_company?: string | null
  /** Public link to the sender's photo. */
  sender_avatar?: string | null
  text: string
  created_at?: string | null
  status?: MessageDeliveryStatus
  delivered_at?: string | null
  viewed_at?: string | null
}

export type DirectChatThread = {
  id: number
  buyer_actor_id: number
  supplier_actor_id: number
  counterpart_actor_id: number
  counterpart_name: string
  /** The other side's picture: company logo or the person's photo. */
  counterpart_avatar?: string | null
  unread_count: number
  last_message: DirectChatMessage | null
  messages: DirectChatMessage[]
}
