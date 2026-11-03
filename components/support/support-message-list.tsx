"use client"

import { Fragment, useEffect, useMemo, useRef, type KeyboardEvent } from "react"
import { useDocumentVisible } from "@/hooks/use-document-visible"
import { CheckIcon as Check, ChecksIcon as CheckCheck, FileIcon, PaperclipIcon as Paperclip, PaperPlaneRightIcon as Send, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { resolveFileUrl } from "@/lib/file-url"
import { cn } from "@/lib/utils"
import type { MessageDeliveryStatus } from "@/types/contract"
import type { SupportMessage } from "@/types/support"
import "./support-chat.css"

/** Mirrors backend `allowed_upload_mime_types` (without octet-stream catch-all). */
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
])

const ACCEPT_FILE_TYPES =
  ".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.doc,.docx,.zip"

const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

const isAllowedSupportFile = (file: File): boolean => {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return true
  const name = file.name.toLowerCase()
  return /\.(pdf|jpe?g|png|webp|gif|mp4|webm|docx?|zip)$/.test(name)
}

const dayKey = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const formatDayLabel = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(iso) === dayKey(today.toISOString())) return "сегодня"
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "вчера"
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  }).format(d)
}

const formatMessageTime = (iso?: string | null) => {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return null
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
        className="inline-flex items-center"
        style={{ color: "var(--tg-tick-read)" }}
        title={statusLabel.viewed}
      >
        <CheckCheck size={14} weight="bold" />
      </span>
    )
  }
  if (value === "delivered") {
    return (
      <span
        className="inline-flex items-center"
        style={{ color: "var(--tg-tick)" }}
        title={statusLabel.delivered}
      >
        <CheckCheck size={14} weight="bold" />
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center"
      style={{ color: "var(--tg-meta)" }}
      title={statusLabel.sent}
    >
      <Check size={14} weight="bold" />
    </span>
  )
}

type SupportMessageListProps = {
  messages: SupportMessage[]
  currentUserId: number
  counterpartName?: string
  text: string
  onTextChange: (value: string) => void
  file: File | null
  onFileChange: (file: File | null) => void
  onSend: () => void
  onMarkRead?: () => void
  sending?: boolean
  disabled?: boolean
  emptyHint?: string
}

export const SupportMessageList = ({
  messages,
  currentUserId,
  counterpartName = "Поддержка",
  text,
  onTextChange,
  file,
  onFileChange,
  onSend,
  onMarkRead,
  sending = false,
  disabled = false,
  emptyHint = "Напишите сообщение — мы ответим как можно скорее",
}: SupportMessageListProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const markedReadRef = useRef<string | null>(null)
  const documentVisible = useDocumentVisible()

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, messages[messages.length - 1]?.status])

  useEffect(() => {
    if (!onMarkRead || disabled || !documentVisible || document.visibilityState !== "visible") return
    const unreadIds = messages
      .filter((m) => m.sender_id !== currentUserId && m.status !== "viewed")
      .map((m) => m.id)
      .join(",")
    if (!unreadIds) return
    if (markedReadRef.current === unreadIds) return
    markedReadRef.current = unreadIds
    onMarkRead()
  }, [currentUserId, disabled, documentVisible, messages, onMarkRead])

  const rows = useMemo(() => {
    const result: Array<
      | { kind: "date"; key: string; label: string }
      | { kind: "message"; key: string; message: SupportMessage; showName: boolean; tight: boolean }
    > = []
    let prevDay = ""
    let prevSender: number | null = null
    for (const message of messages) {
      const day = dayKey(message.created_at)
      if (day && day !== prevDay) {
        result.push({
          kind: "date",
          key: `day-${day}`,
          label: formatDayLabel(message.created_at),
        })
        prevDay = day
        prevSender = null
      }
      const showName = message.sender_id !== currentUserId && message.sender_id !== prevSender
      const tight = prevSender === message.sender_id
      result.push({
        kind: "message",
        key: `m-${message.id}`,
        message,
        showName,
        tight,
      })
      prevSender = message.sender_id
    }
    return result
  }, [currentUserId, messages])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (!disabled && !sending && (text.trim() || file)) onSend()
    }
  }

  const canSend = !disabled && !sending && Boolean(text.trim() || file)

  return (
    <div className="support-tg flex min-h-0 flex-1 flex-col">
      <div
        ref={listRef}
        className="support-tg-wallpaper flex-1 overflow-y-auto px-3 py-3 sm:px-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="support-tg-date-pill mb-3">чат поддержки</div>
            <p className="max-w-[240px] text-[13px] leading-relaxed text-black/55">
              {emptyHint}
            </p>
          </div>
        ) : (
          rows.map((row) => {
            if (row.kind === "date") {
              return (
                <div key={row.key} className="my-3 flex justify-center">
                  <span className="support-tg-date-pill capitalize">{row.label}</span>
                </div>
              )
            }

            const { message, showName, tight } = row
            const isOwn = message.sender_id === currentUserId
            const displayName = message.sender_name?.trim() || counterpartName
            const timeLabel = formatMessageTime(message.created_at)
            const fileUrl = message.attachment
              ? resolveFileUrl(message.attachment.file_url)
              : null
            const isImage = Boolean(
              message.attachment?.file_type?.startsWith("image/") && fileUrl,
            )

            return (
              <Fragment key={row.key}>
                <div
                  className={cn(
                    "flex max-w-[82%] flex-col sm:max-w-[75%]",
                    isOwn ? "ml-auto items-end" : "mr-auto items-start",
                    tight ? "mt-0.5" : "mt-2.5",
                  )}
                >
                  {showName && !isOwn ? (
                    <p
                      className="mb-0.5 px-1 text-[12px] font-semibold"
                      style={{ color: "var(--tg-name)" }}
                    >
                      {displayName}
                    </p>
                  ) : null}
                  <div
                    className={cn(
                      "relative px-2.5 pt-1.5 pb-1 text-[14.5px] leading-[1.35] break-words whitespace-pre-wrap",
                      isOwn ? "support-tg-bubble-out" : "support-tg-bubble-in",
                    )}
                  >
                    {message.attachment && fileUrl ? (
                      <div className={message.text ? "mb-1.5" : undefined}>
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={fileUrl}
                            alt={message.attachment.file_name}
                            className="mb-0.5 max-h-52 max-w-full rounded-lg"
                          />
                        ) : (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mb-0.5 flex items-center gap-2 rounded-lg bg-black/[0.04] px-2 py-1.5 no-underline hover:bg-black/[0.06]"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                              <FileIcon size={16} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-black/80">
                              {message.attachment.file_name}
                            </span>
                          </a>
                        )}
                      </div>
                    ) : null}
                    {message.text ? <span>{message.text}</span> : null}
                    <span
                      className={cn(
                        "mt-0.5 inline-flex float-right clear-both items-center gap-0.5 pl-2 align-bottom text-[11px] leading-none",
                        !message.text && !isImage ? "mt-1" : "relative top-[3px]",
                      )}
                      style={{ color: "var(--tg-meta)" }}
                    >
                      {timeLabel}
                      <MessageStatusTicks status={message.status} isOwn={isOwn} />
                    </span>
                  </div>
                </div>
              </Fragment>
            )
          })
        )}
      </div>

      <div className="support-tg-composer border-t border-black/[0.06] px-2 pt-1.5 pb-2">
        {file ? (
          <div className="mb-1.5 flex items-center gap-2 rounded-xl bg-[#f0f2f5] px-3 py-2 text-[12px]">
            <Paperclip size={14} className="shrink-0 text-brand-600" />
            <span className="min-w-0 flex-1 truncate text-black/75">{file.name}</span>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="text-black/40 hover:text-black/70"
              aria-label="Убрать файл"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_FILE_TYPES}
            className="hidden"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null
              e.target.value = ""
              if (!next) {
                onFileChange(null)
                return
              }
              if (!isAllowedSupportFile(next)) {
                toast.error("Файл не поддерживается")
                onFileChange(null)
                return
              }
              if (next.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`Файл больше ${MAX_FILE_SIZE_MB} МБ`)
                onFileChange(null)
                return
              }
              onFileChange(next)
            }}
          />
          <button
            type="button"
            className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full text-mute transition hover:bg-black/5 hover:text-brand-600 disabled:opacity-40"
            disabled={disabled || sending}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Прикрепить файл"
          >
            <Paperclip size={22} />
          </button>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Сообщение"
            aria-label="Текст сообщения"
            disabled={disabled || sending}
            className="support-tg-input max-h-28 min-h-10 flex-1 px-3.5 py-2.5 text-[15px] text-black placeholder:text-black/35 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            className="support-tg-send mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full transition hover:opacity-90 disabled:cursor-default"
            aria-label="Отправить сообщение"
          >
            <Send size={18} className="translate-x-px" />
          </button>
        </div>
      </div>
    </div>
  )
}
