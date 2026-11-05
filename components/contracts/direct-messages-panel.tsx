"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { CheckIcon as Check, ChecksIcon as CheckCheck, ChatTextIcon as MessageSquare, PaperPlaneRightIcon as Send, ShieldWarningIcon as ShieldAlert } from "@phosphor-icons/react/dist/ssr"
import { formatIsoDate } from "@/lib/format"
import {
  useDirectChatQuery,
  useMarkDirectReadMutation,
  useSendDirectMessageMutation,
} from "@/hooks/api/use-direct-chats-query"
import { useDocumentVisible } from "@/hooks/use-document-visible"
import type { MessageDeliveryStatus } from "@/types"
import { messageAffiliation } from "@/lib/message-author"

type DirectMessagesPanelProps = {
  chatId: number
  role: "buyer" | "supplier"
  currentUserId: number
  counterpartName: string
}

const formatMessageTime = (iso?: string | null) => {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return formatIsoDate(iso.split("T")[0] ?? iso)
  }
}

const statusLabel: Record<MessageDeliveryStatus, string> = {
  sent: "Отправлено",
  delivered: "Доставлено",
  viewed: "Просмотрено",
}

const MessageStatusTicks = ({
  status,
  isOwn,
}: {
  status?: MessageDeliveryStatus
  isOwn: boolean
}) => {
  if (!isOwn) return null
  const value = status ?? "sent"
  if (value === "viewed") {
    return (
      <span
        className="inline-flex items-center text-sky-200"
        title={statusLabel.viewed}
        aria-label={statusLabel.viewed}
      >
        <CheckCheck size={14} />
      </span>
    )
  }
  if (value === "delivered") {
    return (
      <span
        className="inline-flex items-center text-primary-foreground/85"
        title={statusLabel.delivered}
        aria-label={statusLabel.delivered}
      >
        <CheckCheck size={14} />
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center text-primary-foreground/70"
      title={statusLabel.sent}
      aria-label={statusLabel.sent}
    >
      <Check size={14} />
    </span>
  )
}

export const DirectMessagesPanel = ({
  chatId,
  role,
  currentUserId,
  counterpartName,
}: DirectMessagesPanelProps) => {
  const [text, setText] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const { data: thread } = useDirectChatQuery(role, chatId, chatId > 0)
  const sendMutation = useSendDirectMessageMutation(role)
  const markReadMutation = useMarkDirectReadMutation(role)
  const documentVisible = useDocumentVisible()
  const messages = thread?.messages ?? []
  const markedReadRef = useRef<string | null>(null)
  const markReadRef = useRef(markReadMutation.mutate)
  markReadRef.current = markReadMutation.mutate

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, messages[messages.length - 1]?.status])

  useEffect(() => {
    if (!documentVisible || document.visibilityState !== "visible") return
    const unreadIds = messages
      .filter(
        (message) =>
          message.sender_id !== currentUserId && message.status !== "viewed",
      )
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

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    sendMutation.mutate({ id: chatId, text: trimmed })
    setText("")
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[min(70vh,640px)] min-h-[420px]">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/40">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={16} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{counterpartName}</p>
          <p className="text-xs text-muted-foreground truncate">Личные сообщения</p>
        </div>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <MessageSquare size={28} className="text-muted-foreground mb-2" />
            <p className="text-sm font-semibold text-foreground">Сообщений пока нет</p>
            <p className="text-xs text-muted-foreground mt-1">
              Напишите исполнителю — переписка сохранится в кабинете
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId
            const displayName = isOwn
              ? "Вы"
              : (message.sender_name?.trim() || counterpartName || "Участник")
            const timeLabel = formatMessageTime(message.created_at)

            return (
              <div
                key={message.id}
                className={`flex flex-col max-w-[85%] ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <p className="text-[11px] font-semibold text-muted-foreground mb-1 px-1">
                  {displayName}
                  {!isOwn && messageAffiliation(message) ? (
                    <span className="font-normal">{` · ${messageAffiliation(message)}`}</span>
                  ) : null}
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
                  {isOwn && (
                    <span className="mt-1 flex justify-end">
                      <MessageStatusTicks
                        status={message.status as MessageDeliveryStatus | undefined}
                        isOwn={isOwn}
                      />
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="border-t border-border p-4 bg-card">
        <p className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          Не переводите деньги напрямую и не уходите в другие мессенджеры — гарантия площадки
          действует только для оплат и переписки здесь.
        </p>
        <div className="flex gap-2 items-end">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Написать сообщение..."
            aria-label="Текст сообщения"
            className="flex-1 px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || sendMutation.isPending}
            className="h-11 w-11 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0"
            aria-label="Отправить сообщение"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </section>
  )
}
