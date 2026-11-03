"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { ChatTextIcon as MessageSquare, PaperPlaneRightIcon as Send } from "@phosphor-icons/react/dist/ssr"
import { isApiEnabled } from "@/lib/api/config"
import { formatRelativeIso } from "@/lib/format"
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
const MAX_MESSAGE_LENGTH = 4000

type ProposalMessagesPanelProps = {
  proposalId: number
  proposalStatus: ProposalStatus
  side: ProposalChatSide
  peerName: string
  className?: string
}

export const ProposalMessagesPanel = ({
  proposalId,
  proposalStatus,
  side,
  peerName,
  className,
}: ProposalMessagesPanelProps) => {
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const userId = user?.userId ?? 0
  const senderName = user?.name ?? "Вы"
  const storeMessages = useProposalsStore(
    (s) => s.proposalMessages[proposalId] ?? EMPTY_MESSAGES,
  )
  const addProposalMessage = useProposalsStore((s) => s.addProposalMessage)

  const { data: apiMessages, isLoading } = useProposalMessagesQuery(
    proposalId,
    side,
    useApi,
  )
  const sendMutation = useSendProposalMessageMutation(side)

  const [text, setText] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const messages = useApi ? (apiMessages ?? EMPTY_MESSAGES) : storeMessages
  const canSend = PROPOSAL_CHAT_OPEN_STATUSES.includes(proposalStatus)
  const isSending = sendMutation.isPending

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, messages[messages.length - 1]?.id])

  const handleSubmit = async () => {
    const trimmed = text.trim()
    if (!trimmed || !canSend || isSending) return
    try {
      if (useApi) {
        await sendMutation.mutateAsync({ id: proposalId, text: trimmed })
      } else {
        addProposalMessage({
          proposalId,
          senderId: userId,
          senderName,
          text: trimmed,
          side,
        })
      }
      setText("")
    } catch {
      return
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div
      className={`bg-card border border-border rounded-xl overflow-hidden flex flex-col min-h-[420px] h-full ${className ?? ""}`}
    >
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[280px] bg-background/40"
      >
        {useApi && isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Загрузка сообщений...
          </p>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
            <MessageSquare size={28} className="text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">Сообщений пока нет</p>
            <p className="text-xs text-muted-foreground mt-1">
              {canSend
                ? `Напишите ${peerName} первое сообщение по заявке`
                : "По этому предложению не было переписки"}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === userId
            const displayName = isOwn
              ? "Вы"
              : (message.sender_name?.trim() || peerName || "Участник")
            const timeLabel = formatRelativeIso(message.created_at)

            return (
              <div
                key={message.id}
                className={`flex flex-col max-w-[85%] ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <p className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">
                  {displayName}
                  {timeLabel ? ` · ${timeLabel}` : ""}
                </p>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            )
          })
        )}
      </div>

      {canSend ? (
        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Написать сообщение..."
              aria-label="Текст сообщения"
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!text.trim() || isSending}
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0"
              aria-label="Отправить сообщение"
            >
              <Send size={18} />
            </button>
          </div>
          {sendMutation.isError && (
            <p className="text-xs text-destructive mt-2">Не удалось отправить сообщение</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground px-5 py-3 border-t border-border">
          После принятия или отклонения предложения писать нельзя
        </p>
      )}
    </div>
  )
}
