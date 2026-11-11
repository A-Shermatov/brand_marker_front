"use client"

import { useEffect, useMemo, useRef, type ReactNode } from "react"
import {
  ChatComposer,
  ChatHeader,
  ChatMessageList,
  ChatThread,
} from "@/components/chat/chat-thread"
import { toChatItem } from "@/components/chat/chat-items"
import {
  useDirectChatQuery,
  useMarkDirectReadMutation,
  useSendDirectMessageMutation,
} from "@/hooks/api/use-direct-chats-query"
import { useDocumentVisible } from "@/hooks/use-document-visible"

type DirectMessagesPanelProps = {
  chatId: number
  role: "buyer" | "supplier"
  currentUserId: number
  counterpartName: string
  counterpartAvatar?: string | null
  headerActions?: ReactNode
  headerChildren?: ReactNode
  /** The other party's profile; the header name links to it. */
  profileHref?: string
  className?: string
}

/** Private messages with a buyer or a supplier, outside any request or deal. */
export const DirectMessagesPanel = ({
  chatId,
  role,
  currentUserId,
  counterpartName,
  counterpartAvatar,
  headerActions,
  headerChildren,
  profileHref,
  className,
}: DirectMessagesPanelProps) => {
  const { data: thread } = useDirectChatQuery(role, chatId, chatId > 0)
  const sendMutation = useSendDirectMessageMutation(role)
  const markReadMutation = useMarkDirectReadMutation(role)
  const documentVisible = useDocumentVisible()
  const messages = useMemo(() => thread?.messages ?? [], [thread])
  const markedReadRef = useRef<string | null>(null)
  const markReadRef = useRef(markReadMutation.mutate)
  markReadRef.current = markReadMutation.mutate

  // Mark what the other side wrote as read while the page is in view.
  useEffect(() => {
    if (!documentVisible || document.visibilityState !== "visible") return
    const unreadIds = messages
      .filter((message) => message.sender_id !== currentUserId && message.status !== "viewed")
      .map((message) => message.id)
      .join(",")
    if (!unreadIds) {
      markedReadRef.current = null
      return
    }
    const key = `${chatId}:${unreadIds}`
    if (markedReadRef.current === key) return
    markedReadRef.current = key
    markReadRef.current(chatId)
    const retry = window.setTimeout(() => {
      if (markedReadRef.current === key) markedReadRef.current = null
    }, 1500)
    return () => window.clearTimeout(retry)
  }, [chatId, currentUserId, documentVisible, messages])

  const items = useMemo(
    () => messages.map((message) => toChatItem(message, counterpartName)),
    [messages, counterpartName],
  )
  const avatar =
    counterpartAvatar ??
    thread?.counterpart_avatar ??
    messages.find((m) => m.sender_id !== currentUserId && m.sender_avatar)?.sender_avatar

  return (
    <ChatThread
      className={className}
      header={
        <ChatHeader
          href={profileHref}
          name={counterpartName}
          avatar={avatar}
          subtitle="Личные сообщения"
          actions={headerActions}
        >
          {headerChildren}
        </ChatHeader>
      }
      composer={
        <ChatComposer
          sending={sendMutation.isPending}
          onSend={(text) => sendMutation.mutate({ id: chatId, text })}
        />
      }
    >
      <ChatMessageList
        items={items}
        currentUserId={currentUserId}
        emptyText={
          role === "buyer"
            ? "Спросите поставщика о наличии, сроках или цене — переписка сохранится в кабинете."
            : "Ответьте покупателю — переписка сохранится в кабинете."
        }
      />
    </ChatThread>
  )
}
