"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { HeadsetIcon as Headphones, CircleNotchIcon as Loader2, ChatCircleIcon as MessageCircle, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { SupportMessageList } from "@/components/support/support-message-list"
import { useSupportChat } from "@/components/support/support-chat-context"
import {
  useCloseSupportTicketMutation,
  useCreateSupportTicketMutation,
  useMarkSupportReadMutation,
  useSendSupportMessageMutation,
  useSupportTicketQuery,
  useSupportUnreadQuery,
} from "@/hooks/api/use-support-query"
import type { SupportRole } from "@/lib/api/support"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"
import "./support-chat.css"

type SupportChatWidgetProps = {
  role: SupportRole
}

export const SupportChatWidget = ({ role }: SupportChatWidgetProps) => {
  const searchParams = useSearchParams()
  const userId = useAuthStore((s) => s.user?.userId ?? 0)
  const { open, setOpen } = useSupportChat()
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const apiOn = isApiEnabled()

  const ticketQuery = useSupportTicketQuery(role, apiOn)
  const unreadQuery = useSupportUnreadQuery(role, apiOn)
  const createTicket = useCreateSupportTicketMutation(role)
  const sendMessage = useSendSupportMessageMutation(role)
  const markRead = useMarkSupportReadMutation(role)
  const closeTicket = useCloseSupportTicketMutation(role)

  const ticket = ticketQuery.data?.ticket ?? null
  const unread = unreadQuery.data?.count ?? ticket?.unread_count ?? 0

  useEffect(() => {
    if (searchParams.get("support") === "1") {
      setOpen(true)
    }
  }, [searchParams, setOpen])

  const ensureTicket = useCallback(async () => {
    if (ticket) return ticket
    return createTicket.mutateAsync()
  }, [createTicket, ticket])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed && !file) return
    try {
      const active = await ensureTicket()
      await sendMessage.mutateAsync({
        ticketId: active.id,
        text: trimmed,
        file,
      })
      setText("")
      setFile(null)
    } catch {
      // mutation toast / meta handles errors
    }
  }

  const handleMarkRead = useCallback(() => {
    if (!ticket) return
    markRead.mutate(ticket.id)
  }, [markRead, ticket])

  return (
    <div className="pointer-events-none fixed right-4 bottom-24 z-50 flex flex-col items-end gap-3 sm:bottom-28">
      {open ? (
        <div
          className="support-tg pointer-events-auto flex h-[min(72vh,580px)] w-[min(100vw-2rem,390px)] flex-col overflow-hidden rounded-[14px]"
          style={{ boxShadow: "var(--tg-panel-shadow)" }}
        >
          <header className="support-tg-header flex items-center gap-3 px-3 py-2.5">
            <div className="support-tg-avatar flex size-10 shrink-0 items-center justify-center rounded-full">
              <Headphones size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-tight text-white">
                Поддержка
              </p>
              <p className="truncate text-[12px] leading-tight text-white/80">
                {ticket?.status === "open" ? "в сети" : "обычно отвечаем быстро"}
              </p>
            </div>
            {ticket?.status === "open" ? (
              <button
                type="button"
                className="shrink-0 text-[12px] font-medium text-white/85 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
                disabled={closeTicket.isPending}
                onClick={() => closeTicket.mutate(ticket.id)}
              >
                Закрыть
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Свернуть чат"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/15"
            >
              <X size={18} />
            </button>
          </header>

          {!apiOn ? (
            <div className="support-tg-wallpaper flex flex-1 items-center justify-center p-6 text-center">
              <p className="text-[14px] text-mute">
                Чат поддержки недоступен: включите API (
                <span className="font-mono text-[12px]">NEXT_PUBLIC_USE_API</span>
                ).
              </p>
            </div>
          ) : ticketQuery.isLoading || createTicket.isPending ? (
            <div className="support-tg-wallpaper flex flex-1 items-center justify-center">
              <Loader2 className="animate-spin text-brand-600" size={24} />
            </div>
          ) : ticketQuery.isError ? (
            <div className="support-tg-wallpaper flex flex-1 items-center justify-center p-6 text-center">
              <p className="text-[14px] text-mute">
                Не удалось открыть обращение. Проверьте, что бэкенд запущен и миграции
                поддержки применены.
              </p>
            </div>
          ) : (
            <SupportMessageList
              messages={ticket?.messages ?? []}
              currentUserId={userId}
              counterpartName="Поддержка"
              text={text}
              onTextChange={setText}
              file={file}
              onFileChange={setFile}
              onSend={() => void handleSend()}
              onMarkRead={ticket ? handleMarkRead : undefined}
              sending={sendMessage.isPending || createTicket.isPending}
              disabled={false}
            />
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "support-tg support-tg-fab pointer-events-auto relative flex size-14 items-center justify-center rounded-full transition hover:opacity-95",
          open && "ring-2 ring-brand-500/40",
        )}
        aria-label={open ? "Закрыть чат поддержки" : "Открыть чат поддержки"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 ? (
          <span className="support-tg-fab-badge absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
    </div>
  )
}
