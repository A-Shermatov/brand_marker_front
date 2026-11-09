"use client"

import { useMemo, type ReactNode } from "react"
import {
  ChatComposer,
  ChatHeader,
  ChatMessageList,
  ChatThread,
} from "@/components/chat/chat-thread"
import { toChatItem } from "@/components/chat/chat-items"
import { isApiEnabled } from "@/lib/api/config"
import { PROPOSAL_CHAT_OPEN_STATUSES } from "@/lib/proposal-display"
import { useAuthStore } from "@/lib/store/auth-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import {
  useProposalMessagesQuery,
  useSendProposalMessageMutation,
  type ProposalChatSide,
} from "@/hooks/api/use-proposals-query"
import type { ProposalMessage, ProposalStatus } from "@/types"

const EMPTY_MESSAGES: ProposalMessage[] = []

type ProposalMessagesPanelProps = {
  proposalId: number
  proposalStatus: ProposalStatus
  side: ProposalChatSide
  peerName: string
  peerAvatar?: string | null
  /** The request the offer answers; shown under the name. */
  subject?: string
  headerActions?: ReactNode
  headerChildren?: ReactNode
  className?: string
}

/** Talking over an offer before a deal: questions about price, terms, details. */
export const ProposalMessagesPanel = ({
  proposalId,
  proposalStatus,
  side,
  peerName,
  peerAvatar,
  subject,
  headerActions,
  headerChildren,
  className,
}: ProposalMessagesPanelProps) => {
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const userId = user?.userId ?? 0
  const senderName = user?.name ?? "Вы"
  const storeMessages = useProposalsStore((s) => s.proposalMessages[proposalId] ?? EMPTY_MESSAGES)
  const addProposalMessage = useProposalsStore((s) => s.addProposalMessage)

  const { data: apiMessages, isLoading } = useProposalMessagesQuery(proposalId, side, useApi)
  const sendMutation = useSendProposalMessageMutation(side)
  const messages = useApi ? (apiMessages ?? EMPTY_MESSAGES) : storeMessages
  const canSend = PROPOSAL_CHAT_OPEN_STATUSES.includes(proposalStatus)

  const items = useMemo(
    () => messages.map((message) => toChatItem(message, peerName)),
    [messages, peerName],
  )
  const avatar =
    peerAvatar ?? messages.find((m) => m.sender_id !== userId && m.sender_avatar)?.sender_avatar

  const send = async (text: string) => {
    if (useApi) {
      await sendMutation.mutateAsync({ id: proposalId, text }).catch(() => undefined)
      return
    }
    addProposalMessage({ proposalId, senderId: userId, senderName, text, side })
  }

  return (
    <ChatThread
      className={className}
      header={
        <ChatHeader
          name={peerName}
          avatar={avatar}
          subtitle={subject ? <>Предложение · {subject}</> : "Обсуждение предложения"}
          actions={headerActions}
        >
          {headerChildren}
        </ChatHeader>
      }
      composer={
        <ChatComposer
          onSend={send}
          sending={sendMutation.isPending}
          disabledReason={
            canSend ? null : "Предложение принято или отклонено — переписка по нему закрыта."
          }
        />
      }
    >
      {useApi && isLoading ? (
        <div className="grid flex-1 place-items-center bg-canvas text-[14px] text-mute">
          Загружаем сообщения…
        </div>
      ) : (
        <ChatMessageList
          items={items}
          currentUserId={userId}
          emptyText={
            canSend
              ? `Напишите ${peerName} первое сообщение по заявке.`
              : "По этому предложению не было переписки."
          }
        />
      )}
    </ChatThread>
  )
}
