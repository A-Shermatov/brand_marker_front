"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { SupportMessageList } from "@/components/support/support-message-list"
import "@/components/support/support-chat.css"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  SegmentedControl,
} from "@/components/layout"
import {
  useAdminCloseSupportTicketMutation,
  useAdminMarkSupportReadMutation,
  useAdminSendSupportMessageMutation,
  useAdminSupportTicketQuery,
  useAdminSupportTicketsQuery,
} from "@/hooks/api/use-support-query"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"
import type { SupportTicketStatus } from "@/types/support"

const SUPPORT_PAGE_SIZE = 30

const statusFilters: Array<{ value: SupportTicketStatus | "all"; label: string }> = [
  { value: "open", label: "Открытые" },
  { value: "closed", label: "Закрытые" },
  { value: "all", label: "Все" },
]

const formatListTime = (value: string | null) => {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d)
  }
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(d)
}

const initials = (name: string, email: string) => {
  const source = (name || email || "?").trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

const AdminSupportContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userId = useAuthStore((s) => s.user?.userId ?? 0)

  const statusParam = searchParams.get("status")
  const status: SupportTicketStatus | "all" =
    statusParam === "closed" || statusParam === "all" || statusParam === "open"
      ? statusParam
      : "open"
  const ticketIdParam = Number(searchParams.get("ticket")) || null
  const page = Math.max(1, Number(searchParams.get("page")) || 1)

  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const listQuery = useAdminSupportTicketsQuery({
    status,
    page,
    pageSize: SUPPORT_PAGE_SIZE,
  })
  const items = listQuery.data?.items ?? []
  const totalPages = listQuery.data?.total_pages ?? 0

  const selectedId = useMemo(() => {
    if (ticketIdParam && items.some((t) => t.id === ticketIdParam)) return ticketIdParam
    if (ticketIdParam) return ticketIdParam
    return items[0]?.id ?? null
  }, [items, ticketIdParam])

  const detailQuery = useAdminSupportTicketQuery(selectedId)
  const sendMessage = useAdminSendSupportMessageMutation()
  const markRead = useAdminMarkSupportReadMutation()
  const closeTicket = useAdminCloseSupportTicketMutation()

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value == null || value === "") next.delete(key)
        else next.set(key, value)
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (!ticketIdParam && selectedId) {
      setParams({ ticket: String(selectedId) })
    }
  }, [selectedId, setParams, ticketIdParam])

  const handlePageChange = (target: number) =>
    setParams({ page: target <= 1 ? null : String(target), ticket: null })

  const ticket = detailQuery.data
  const messages = ticket?.messages ?? []

  const handleMarkRead = useCallback(() => {
    if (!selectedId) return
    markRead.mutate(selectedId)
  }, [markRead, selectedId])

  const handleSend = async () => {
    if (!selectedId) return
    const trimmed = text.trim()
    if (!trimmed && !file) return
    await sendMessage.mutateAsync({
      ticketId: selectedId,
      text: trimmed,
      file,
    })
    setText("")
    setFile(null)
  }

  return (
    <PageFrame>
      <PageHeader
        title="Чат поддержки"
        description="Обращения пользователей buyer и supplier"
      />

      <div
        className="support-tg grid min-h-[min(72vh,740px)] overflow-hidden rounded-[14px] border border-black/[0.08] bg-card lg:grid-cols-[340px_1fr]"
        style={{ boxShadow: "var(--tg-panel-shadow)" }}
      >
        <aside className="flex max-h-[min(72vh,740px)] flex-col border-r border-black/[0.08] bg-card">
          <div className="border-b border-black/[0.06] px-3 py-2.5">
            <SegmentedControl
              value={status}
              onChange={(value) => setParams({ status: value, ticket: null, page: null })}
              options={statusFilters}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-brand-600" size={22} />
              </div>
            ) : items.length === 0 ? (
              <PageEmptyState
                title="Нет обращений"
                description="Когда пользователь напишет в поддержку, тикет появится здесь"
                className="py-12"
              />
            ) : (
              items.map((item) => {
                const active = item.id === selectedId
                const name = item.user_name || item.user_email
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={active}
                    onClick={() => setParams({ ticket: String(item.id) })}
                    className={cn(
                      "support-tg-chat-row flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    )}
                  >
                    <div className="support-tg-avatar flex size-12 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold tracking-wide">
                      {initials(item.user_name, item.user_email)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                          {name}
                        </span>
                        <span className="shrink-0 text-[12px] text-faint">
                          {formatListTime(item.last_message_at ?? item.created_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[13px] text-mute">
                          {item.last_message_preview || "Нет сообщений"}
                        </p>
                        {item.unread_count > 0 ? (
                          <span className="support-tg-unread">
                            {item.unread_count > 99 ? "99+" : item.unread_count}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-faint">
                        {item.side}
                        {item.status === "closed" ? " · закрыт" : ""}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-2 border-t border-line p-2"
              aria-label="Страницы обращений"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Назад
              </Button>
              <span className="text-xs text-mute tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Далее
                <ChevronRight aria-hidden="true" />
              </Button>
            </nav>
          ) : null}
        </aside>

        <section className="flex max-h-[min(72vh,740px)] min-h-0 flex-col bg-card">
          {!selectedId ? (
            <div className="support-tg-wallpaper flex flex-1 items-center justify-center">
              <PageEmptyState
                title="Выберите чат"
                description="Откройте обращение слева, чтобы ответить"
              />
            </div>
          ) : detailQuery.isLoading ? (
            <div className="support-tg-wallpaper flex flex-1 items-center justify-center">
              <Loader2 className="animate-spin text-brand-600" size={24} />
            </div>
          ) : !ticket ? (
            <div className="support-tg-wallpaper flex flex-1 items-center justify-center">
              <PageEmptyState title="Тикет не найден" />
            </div>
          ) : (
            <>
              <header className="support-tg-header flex items-center gap-3 px-3 py-2.5">
                <div className="support-tg-avatar flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold">
                  {initials(ticket.user_name, ticket.user_email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-tight text-white">
                    {ticket.user_name || ticket.user_email}
                  </p>
                  <p className="truncate text-[12px] leading-tight text-white/80">
                    {ticket.user_email} · {ticket.side} · #{ticket.id}
                    {ticket.status === "closed" ? " · закрыт" : ""}
                  </p>
                </div>
                {ticket.status === "open" ? (
                  <button
                    type="button"
                    className="shrink-0 text-[12px] font-medium text-white/85 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
                    disabled={closeTicket.isPending}
                    onClick={() => closeTicket.mutate(ticket.id)}
                  >
                    Закрыть
                  </button>
                ) : null}
              </header>
              <SupportMessageList
                messages={messages}
                currentUserId={userId}
                counterpartName={ticket.user_name || "Пользователь"}
                text={text}
                onTextChange={setText}
                file={file}
                onFileChange={setFile}
                onSend={() => void handleSend()}
                onMarkRead={ticket.status === "open" ? handleMarkRead : undefined}
                sending={sendMessage.isPending}
                disabled={ticket.status !== "open"}
                emptyHint="Ответьте пользователю первым сообщением"
              />
            </>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

export default function AdminSupportPage() {
  return (
    <Suspense
      fallback={
        <PageFrame className="animate-pulse">
          <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
          <div className="h-[60vh] rounded-xl bg-muted" />
        </PageFrame>
      }
    >
      <AdminSupportContent />
    </Suspense>
  )
}
