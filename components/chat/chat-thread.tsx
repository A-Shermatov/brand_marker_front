"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import {
  ChatsCircleIcon,
  CheckIcon,
  ChecksIcon,
  PaperPlaneRightIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { UserAvatar } from "@/components/bm/user-avatar"
import { cn } from "@/lib/utils"
import type { MessageDeliveryStatus } from "@/types"

/** One message as the chat draws it, whatever conversation it came from. */
export type ChatItem = {
  id: number | string
  senderId: number
  senderName: string
  senderAvatar?: string | null
  /** "Руководитель · ООО Ромашка": who the sender speaks for. */
  affiliation?: string | null
  text: string
  createdAt?: string | null
  status?: MessageDeliveryStatus
}

/** Messages from one person within this many minutes sit together under one name. */
const GROUP_MINUTES = 5

const dayKey = (iso?: string | null) => (iso ? new Date(iso).toDateString() : "")

const dayLabel = (iso: string) => {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return "Сегодня"
  if (date.toDateString() === yesterday.toDateString()) return "Вчера"
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  }).format(date)
}

const timeLabel = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
    : ""

const STATUS_LABEL: Record<MessageDeliveryStatus, string> = {
  sent: "Отправлено",
  delivered: "Доставлено",
  viewed: "Прочитано",
}

function Ticks({ status = "sent" }: { status?: MessageDeliveryStatus }) {
  const Icon = status === "sent" ? CheckIcon : ChecksIcon
  return (
    <Icon
      weight="bold"
      className={cn("size-3.5", status === "viewed" ? "text-sky-200" : "text-white/70")}
      aria-label={STATUS_LABEL[status]}
    />
  )
}

/** The top of a conversation: who it is with and what it is about. */
export function ChatHeader({
  name,
  avatar,
  subtitle,
  href,
  actions,
  children,
}: {
  name: string
  avatar?: string | null
  subtitle?: ReactNode
  /** The other party's profile: the photo and the name open it. */
  href?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <header className="border-b border-line bg-card">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
        {href ? (
          <Link href={href} className="shrink-0 rounded-full" aria-hidden tabIndex={-1}>
            <UserAvatar src={avatar} name={name} size={40} />
          </Link>
        ) : (
          <UserAvatar src={avatar} name={name} size={40} />
        )}
        <div className="grid min-w-0 flex-1">
          {href ? (
            <Link
              href={href}
              title="Открыть профиль"
              className="w-fit max-w-full truncate text-[15.5px] font-semibold text-ink underline-offset-2 hover:text-brand-700 hover:underline"
            >
              {name}
            </Link>
          ) : (
            <b className="truncate text-[15.5px] font-semibold text-ink">{name}</b>
          )}
          {subtitle ? <span className="truncate text-[13px] text-mute">{subtitle}</span> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  )
}

/**
 * The messages, grouped by day and by sender: a name and a photo once per
 * run of messages, your own on the right in blue, the time inside each bubble.
 */
export function ChatMessageList({
  items,
  currentUserId,
  emptyTitle = "Сообщений пока нет",
  emptyText,
}: {
  items: ChatItem[]
  currentUserId: number
  emptyTitle?: string
  emptyText?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const last = items[items.length - 1]

  // Keep the newest message in view as messages arrive.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [items.length, last?.id, last?.status])

  const rows = useMemo(() => {
    return items.map((item, index) => {
      const prev = items[index - 1]
      const newDay = !prev || dayKey(prev.createdAt) !== dayKey(item.createdAt)
      const gap =
        prev?.createdAt && item.createdAt
          ? (new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime()) / 60000
          : Infinity
      const startsRun = newDay || !prev || prev.senderId !== item.senderId || gap > GROUP_MINUTES
      return { item, newDay, startsRun }
    })
  }, [items])

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-4 sm:px-5"
      role="log"
      aria-label="Сообщения"
      aria-live="polite"
    >
      {items.length === 0 ? (
        <div className="grid h-full place-items-center px-6 text-center">
          <div className="grid justify-items-center gap-2">
            <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <ChatsCircleIcon className="size-7" weight="duotone" aria-hidden />
            </span>
            <b className="text-[15px] text-ink">{emptyTitle}</b>
            {emptyText ? <p className="max-w-[340px] text-[13.5px] text-mute">{emptyText}</p> : null}
          </div>
        </div>
      ) : (
        <ol className="mx-auto grid max-w-[860px] gap-1">
          {rows.map(({ item, newDay, startsRun }) => {
            const own = item.senderId === currentUserId
            return (
              <li key={item.id} className="grid">
                {newDay && item.createdAt ? (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-card px-3 py-1 text-[12px] font-medium text-mute shadow-[0_1px_2px_rgba(28,28,26,.06)] ring-1 ring-line">
                      {dayLabel(item.createdAt)}
                    </span>
                  </div>
                ) : null}
                <div
                  className={cn(
                    "flex items-end gap-2",
                    own ? "justify-end" : "justify-start",
                    startsRun && !newDay ? "mt-3" : null,
                  )}
                >
                  {!own ? (
                    <span className="w-8 shrink-0">
                      {startsRun ? (
                        <UserAvatar src={item.senderAvatar} name={item.senderName} size={32} />
                      ) : null}
                    </span>
                  ) : null}
                  <div className={cn("grid max-w-[min(600px,82%)] gap-1", own ? "justify-items-end" : "justify-items-start")}>
                    {startsRun && !own ? (
                      <span className="px-1 text-[12.5px] leading-tight">
                        <b className="font-semibold text-ink">{item.senderName}</b>
                        {item.affiliation ? <span className="text-mute"> · {item.affiliation}</span> : null}
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        "relative rounded-2xl px-3.5 pb-1.5 pt-2 text-[15px] leading-[1.5] shadow-[0_1px_1px_rgba(28,28,26,.05)]",
                        own
                          ? "rounded-br-md bg-brand-600 text-white"
                          : "rounded-bl-md bg-card text-ink ring-1 ring-line",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{item.text}</p>
                      <span
                        className={cn(
                          "mt-0.5 flex items-center justify-end gap-1 text-[11px] tnum",
                          own ? "text-white/70" : "text-faint",
                        )}
                      >
                        {timeLabel(item.createdAt)}
                        {own ? <Ticks status={item.status} /> : null}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

/** Where a message is written: grows with the text, Enter sends, Shift+Enter breaks the line. */
export function ChatComposer({
  onSend,
  sending = false,
  disabledReason,
  placeholder = "Напишите сообщение…",
}: {
  onSend: (text: string) => void | Promise<void>
  sending?: boolean
  /** Shown instead of the field when nobody can write here any more. */
  disabledReason?: string | null
  placeholder?: string
}) {
  const [text, setText] = useState("")
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = fieldRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  if (disabledReason) {
    return (
      <div className="border-t border-line bg-card px-5 py-4 text-center text-[13.5px] text-mute">
        {disabledReason}
      </div>
    )
  }

  const send = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText("")
    await onSend(trimmed)
    fieldRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send()
    }
  }

  return (
    <div className="border-t border-line bg-card px-3 pb-3 pt-3 sm:px-5">
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-canvas px-3 py-2 transition-colors focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/15">
        <textarea
          ref={fieldRef}
          value={text}
          rows={1}
          maxLength={4000}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Текст сообщения"
          className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-[1.5] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!text.trim() || sending}
          aria-label="Отправить сообщение"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <PaperPlaneRightIcon weight="fill" className="size-4" aria-hidden />
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-mute">
        <ShieldCheckIcon className="size-3.5 shrink-0 text-safe-500" aria-hidden />
        Договаривайтесь и платите только через площадку — так действует гарантия.
        <span className="ml-auto hidden text-faint sm:inline">Shift+Enter — новая строка</span>
      </p>
    </div>
  )
}

/** The whole conversation box: header, messages, composer. */
export function ChatThread({
  header,
  className,
  children,
  composer,
}: {
  header: ReactNode
  className?: string
  children: ReactNode
  composer: ReactNode
}) {
  return (
    <section
      className={cn(
        "flex h-[min(72vh,700px)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-line bg-card",
        className,
      )}
    >
      {header}
      {children}
      {composer}
    </section>
  )
}
