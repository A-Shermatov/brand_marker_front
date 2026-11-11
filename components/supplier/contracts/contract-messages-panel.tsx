"use client"

import { useEffect, useMemo, useRef, type ReactNode } from "react"
import {
  ChatComposer,
  ChatHeader,
  ChatMessageList,
  ChatThread,
} from "@/components/chat/chat-thread"
import { toChatItem } from "@/components/chat/chat-items"
import { useDocumentVisible } from "@/hooks/use-document-visible"
import type { ContractWithRelations } from "@/types"

type ContractMessagesPanelProps = {
  contract: ContractWithRelations
  currentUserId: number
  counterpartName: string
  counterpartAvatar?: string | null
  onSendMessage: (text: string) => void
  onMarkRead?: (contractId: number) => void
  headerActions?: ReactNode
  headerChildren?: ReactNode
  /** The other party's profile; the header name links to it. */
  profileHref?: string
  className?: string
}

/** The deal's chat: kept with the deal, it helps if a dispute comes up. */
export const ContractMessagesPanel = ({
  contract,
  currentUserId,
  counterpartName,
  counterpartAvatar,
  onSendMessage,
  onMarkRead,
  headerActions,
  headerChildren,
  profileHref,
  className,
}: ContractMessagesPanelProps) => {
  const messages = useMemo(() => contract.conversation?.messages ?? [], [contract])
  const documentVisible = useDocumentVisible()
  const markedReadRef = useRef<string | null>(null)
  const onMarkReadRef = useRef(onMarkRead)
  onMarkReadRef.current = onMarkRead

  // Mark what the other side wrote as read while the page is in view.
  useEffect(() => {
    const markRead = onMarkReadRef.current
    if (!markRead || !documentVisible || document.visibilityState !== "visible") return
    const unreadIds = messages
      .filter((message) => message.sender_id !== currentUserId && message.status !== "viewed")
      .map((message) => message.id)
      .join(",")
    if (!unreadIds) {
      markedReadRef.current = null
      return
    }
    const key = `${contract.id}:${unreadIds}`
    if (markedReadRef.current === key) return
    markedReadRef.current = key
    markRead(contract.id)
    const retry = window.setTimeout(() => {
      if (markedReadRef.current === key) markedReadRef.current = null
    }, 1500)
    return () => window.clearTimeout(retry)
  }, [contract.id, currentUserId, documentVisible, messages])

  const items = useMemo(
    () => messages.map((message) => toChatItem(message, counterpartName)),
    [messages, counterpartName],
  )
  const avatar =
    counterpartAvatar ??
    messages.find((m) => m.sender_id !== currentUserId && m.sender_avatar)?.sender_avatar

  return (
    <ChatThread
      className={className}
      header={
        <ChatHeader
          href={profileHref}
          name={counterpartName}
          avatar={avatar}
          subtitle={<>Сделка · {contract.title}</>}
          actions={headerActions}
        >
          {headerChildren}
        </ChatHeader>
      }
      composer={<ChatComposer onSend={onSendMessage} />}
    >
      <ChatMessageList
        items={items}
        currentUserId={currentUserId}
        emptyText="Обсудите детали сделки — переписка сохраняется и поможет, если возникнет спор."
      />
    </ChatThread>
  )
}
