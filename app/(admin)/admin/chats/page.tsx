"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { WarningIcon as AlertTriangle, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, CircleNotchIcon as Loader2, ChatTextIcon as MessageSquare, PaperPlaneRightIcon as Send, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  SegmentedControl,
} from "@/components/layout"
import {
  useAdminChatQuery,
  useAdminChatsQuery,
  useAdminDeleteChatMessageMutation,
  useAdminSendChatMessageMutation,
} from "@/hooks/api/use-admin-chats-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminChatFilter } from "@/lib/api/admin/chats"
import { cn } from "@/lib/utils"

const CHATS_PAGE_SIZE = 30

const filters: Array<{ value: AdminChatFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "flag", label: "С нарушениями" },
  { value: "disp", label: "По спорам" },
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

const WARN_TEXT =
  "Напоминаем: оплата и общение — только через Brend Market. Оплата мимо площадки лишает защиты сделки и ведёт к блокировке."

const AdminChatsContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filterParam = searchParams.get("filter")
  const filter: AdminChatFilter =
    filterParam === "flag" || filterParam === "disp" ? filterParam : "all"
  const chatIdParam = searchParams.get("chat")
  const qParam = searchParams.get("q") ?? ""
  const page = Math.max(1, Number(searchParams.get("page")) || 1)

  const [draftQ, setDraftQ] = useState(qParam)
  const [text, setText] = useState("")

  const listQuery = useAdminChatsQuery({
    filter,
    query: qParam || undefined,
    page,
    pageSize: CHATS_PAGE_SIZE,
  })
  const items = listQuery.data?.items ?? []
  const totalPages = listQuery.data?.total_pages ?? 0

  const selectedId = useMemo(() => {
    if (chatIdParam && items.some((c) => c.id === chatIdParam)) return chatIdParam
    if (chatIdParam) return chatIdParam
    return items[0]?.id ?? null
  }, [items, chatIdParam])

  const detailQuery = useAdminChatQuery(selectedId)
  const sendMessage = useAdminSendChatMessageMutation()
  const deleteMessage = useAdminDeleteChatMessageMutation()
  const canManageChat =
    useAdminPermission("admin_contracts.update") ||
    useAdminPermission("admin_proposals.update")

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

  const handlePageChange = (target: number) =>
    setParams({ page: target <= 1 ? null : String(target), chat: null })

  const chat = detailQuery.data
  const messages = chat?.messages ?? []

  const handleSend = async (body: string) => {
    if (!selectedId || !body.trim() || sendMessage.isPending) return
    await sendMessage.mutateAsync({ chatId: selectedId, text: body.trim() })
    setText("")
  }

  const entityHref =
    chat?.kind === "contract"
      ? `/admin/contracts/${chat.ref_id}`
      : chat
        ? `/admin/proposals/${chat.ref_id}`
        : null

  return (
    <PageFrame>
      <PageHeader
        title="Все переписки"
        description="Переписка покупателей и поставщиков по сделкам и КП"
      />

      <div className="grid min-h-[min(72vh,740px)] overflow-hidden rounded-2xl border border-line bg-white md:grid-cols-[360px_1fr]">
        <aside className="flex max-h-[min(72vh,740px)] flex-col border-r border-line">
          <div className="border-b border-line p-3">
            <input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setParams({ q: draftQ.trim() || null, chat: null, page: null })
              }}
              placeholder="Компания, сделка или слово"
              className="h-10 mb-2 rounded-lg border border-line bg-white px-3.5 text-[14px] outline-none focus:border-brand-600"
            />
            <SegmentedControl
              value={filter}
              onChange={(value) => setParams({ filter: value === "all" ? null : value, chat: null, page: null })}
              options={filters}
            />
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {listQuery.isLoading ? (
              <li className="flex items-center justify-center gap-2 p-8 text-sm text-mute">
                <Loader2 className="size-4 animate-spin" />
                Загрузка…
              </li>
            ) : items.length === 0 ? (
              <li className="p-6 text-[14px] text-mute">Ничего не найдено</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setParams({ chat: item.id })}
                    className={cn(
                      "grid w-full gap-1 p-4 text-left hover:bg-canvas",
                      selectedId === item.id && "bg-canvas",
                    )}
                  >
                    <span className="flex justify-between gap-2">
                      <b className="truncate text-[14px] text-ink">
                        {item.party_a} ↔ {item.party_b}
                      </b>
                      <span className="shrink-0 text-[11.5px] text-mute">
                        {formatListTime(item.last_at)}
                      </span>
                    </span>
                    <span className="text-[12.5px] text-mute">{item.about}</span>
                    <span className="truncate text-[13px] text-ink/80">{item.last_text}</span>
                    {item.flagged ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-red-700">
                        <AlertTriangle className="size-3.5" aria-hidden />
                        Признаки обхода площадки
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-2 border-t border-line p-2"
              aria-label="Страницы переписок"
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

        <section className="flex min-h-[560px] min-w-0 flex-col">
          {!selectedId ? (
            <div className="grid flex-1 place-items-center p-6 text-center text-[14px] text-mute">
              <span>
                <MessageSquare className="mx-auto mb-2 size-8" aria-hidden />
                Выберите переписку слева.
                <br />
                Администратор видит диалоги площадки, чтобы решать спорные моменты.
              </span>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-mute">
              <Loader2 className="size-4 animate-spin" />
              Загрузка диалога…
            </div>
          ) : !chat ? (
            <PageEmptyState title="Диалог не найден" description="Выберите другую переписку" />
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <b className="text-[15px] text-ink">
                    {chat.party_a} ↔ {chat.party_b}
                  </b>
                  <div className="text-[12.5px] text-mute">
                    {chat.about} · {chat.ref_label} · модерация переписки
                  </div>
                </div>
                {entityHref ? (
                  <Link
                    href={entityHref}
                    className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-[13px] font-semibold hover:bg-canvas"
                  >
                    {chat.kind === "contract" ? "Сделка" : "КП"}
                  </Link>
                ) : null}
              </header>

              <div className="grid flex-1 content-start gap-3 overflow-y-auto bg-canvas/60 p-4">
                {messages.map((msg) => {
                  const isAdmin = msg.side === "admin"
                  const isBuyer = msg.side === "buyer"
                  const deleted = Boolean(msg.deleted)
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "group relative max-w-[85%] rounded-xl px-3.5 py-2.5 text-[14px]",
                        isAdmin && "justify-self-center bg-ink text-white",
                        !isAdmin && isBuyer && "justify-self-start border border-line bg-white",
                        !isAdmin &&
                          !isBuyer &&
                          "justify-self-end border border-[#CFE7DA] bg-[#E6F2EC]",
                        msg.flagged && !deleted && "!border-2 !border-red-400",
                        deleted && "opacity-60 italic",
                      )}
                    >
                      <span
                        className={cn(
                          "block text-[11.5px] font-bold",
                          isAdmin ? "text-white/70" : "text-mute",
                        )}
                      >
                        {msg.sender_name}
                      </span>
                      {msg.text}
                      {msg.flagged && !deleted ? (
                        <span className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-red-700">
                          <AlertTriangle className="size-3.5" aria-hidden />
                          Подозрительное сообщение
                        </span>
                      ) : null}
                      <div
                        className={cn(
                          "mt-1 flex items-center justify-between gap-2 text-[11px]",
                          isAdmin ? "text-white/60" : "text-mute",
                        )}
                      >
                        <span>{formatListTime(msg.created_at)}</span>
                        {canManageChat && !deleted && selectedId ? (
                          <button
                            type="button"
                            title="Удалить сообщение"
                            disabled={deleteMessage.isPending}
                            onClick={() =>
                              void deleteMessage.mutateAsync({
                                chatId: selectedId,
                                messageId: msg.id,
                              })
                            }
                            className={cn(
                              "rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                              isAdmin
                                ? "text-white/70 hover:bg-white/15"
                                : "text-mute hover:bg-canvas hover:text-destructive",
                            )}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid gap-2 border-t border-line p-3">
                {canManageChat ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            void handleSend(text)
                          }
                        }}
                        placeholder="Сообщение от модератора — увидят обе стороны"
                        className="h-11 flex-1 rounded-lg border border-line bg-white px-3.5 text-[14px] outline-none focus:border-brand-600"
                      />
                      <button
                        type="button"
                        disabled={!text.trim() || sendMessage.isPending}
                        onClick={() => void handleSend(text)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-white disabled:opacity-40"
                        aria-label="Отправить"
                      >
                        <Send className="size-4" />
                      </button>
                    </div>
                    {chat.flagged ? (
                      <button
                        type="button"
                        disabled={sendMessage.isPending}
                        onClick={() => void handleSend(WARN_TEXT)}
                        className="justify-self-start text-[13px] font-semibold text-mute hover:text-ink"
                      >
                        Предупредить нарушителя
                      </button>
                    ) : null}
                  </>
                ) : (
                  <p className="text-[13px] text-mute">
                    Нет права писать в чат. Нужны права на обновление сделок или КП.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

export default function AdminChatsPage() {
  return (
    <Suspense
      fallback={
        <PageFrame>
          <PageHeader title="Все переписки" description="Загрузка…" />
          <div className="flex items-center gap-2 text-sm text-mute">
            <Loader2 className="size-4 animate-spin" />
            Загрузка…
          </div>
        </PageFrame>
      }
    >
      <AdminChatsContent />
    </Suspense>
  )
}
