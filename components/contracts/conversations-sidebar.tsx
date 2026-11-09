"use client"

import { useMemo, useState } from "react"
import { ChatsCircleIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import { UserAvatar } from "@/components/bm/user-avatar"
import { cn } from "@/lib/utils"
import { filterChatGroups, type CounterpartChatGroup } from "@/lib/chat-conversations"

type ConversationsSidebarProps = {
  groups: CounterpartChatGroup[]
  selectedId: number | null
  onSelect: (counterpartId: number) => void
  searchPlaceholder?: string
  className?: string
}

const formatProjectCount = (count: number): string => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} проект`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} проекта`
  return `${count} проектов`
}

/** "14:05" today, "вчера", "5 нояб." earlier: short enough for a list row. */
const shortTime = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) {
    return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date)
  }
  if (date.toDateString() === yesterday.toDateString()) return "вчера"
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date)
}

/** Everyone the user talks to, newest first: photo, name, what about, the last words. */
export const ConversationsSidebar = ({
  groups,
  selectedId,
  onSelect,
  searchPlaceholder = "Поиск по чатам",
  className,
}: ConversationsSidebarProps) => {
  const [query, setQuery] = useState("")
  const filtered = useMemo(() => filterChatGroups(groups, query), [groups, query])
  const unreadTotal = groups.reduce((sum, group) => sum + group.unreadCount, 0)

  return (
    <aside
      className={cn(
        "flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-card",
        className,
      )}
      aria-label="Диалоги"
    >
      <div className="grid gap-3 border-b border-line p-4">
        <div className="flex items-baseline justify-between">
          <b className="text-[16px] font-semibold text-ink">Диалоги</b>
          {unreadTotal > 0 ? (
            <span className="text-[12.5px] font-medium text-brand-700">
              {unreadTotal} непрочитанн{unreadTotal === 1 ? "ое" : "ых"}
            </span>
          ) : null}
        </div>
        <label className="relative block">
          <MagnifyingGlassIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"
            aria-hidden
          />
          <input
            maxLength={100}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Поиск по чатам"
            className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-3 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-brand-300 focus:ring-2 focus:ring-brand-500/15"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="grid justify-items-center gap-2 p-8 text-center">
            <ChatsCircleIcon size={28} className="text-mute" aria-hidden />
            <p className="text-[14px] text-mute">
              {query.trim() ? "Ничего не найдено" : "Диалогов пока нет"}
            </p>
          </div>
        ) : (
          <ul className="grid gap-0.5 p-2">
            {filtered.map((group) => {
              const selected = selectedId === group.counterpartId
              const unread = group.unreadCount > 0
              const time = group.lastMessage.created_at ? shortTime(group.lastMessage.created_at) : ""
              const about =
                group.projects.length === 1
                  ? group.projects[0]!.title
                  : formatProjectCount(group.projects.length)
              return (
                <li key={group.counterpartId}>
                  <button
                    type="button"
                    onClick={() => onSelect(group.counterpartId)}
                    aria-label={`Открыть переписку с ${group.counterpartName}`}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "grid w-full grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                      selected ? "bg-brand-50" : "hover:bg-surface-muted",
                    )}
                  >
                    <span className="relative">
                      <UserAvatar src={group.avatarUrl} name={group.counterpartName} size={44} />
                      {unread ? (
                        <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-brand-600 ring-2 ring-card" />
                      ) : null}
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "flex-1 truncate text-[14.5px] text-ink",
                            unread ? "font-bold" : "font-semibold",
                          )}
                        >
                          {group.counterpartName}
                        </span>
                        {time ? (
                          <span className={cn("shrink-0 text-[12px] tnum", unread ? "font-semibold text-brand-700" : "text-mute")}>
                            {time}
                          </span>
                        ) : null}
                      </span>
                      <span className="truncate text-[12.5px] text-brand-700">{about}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex-1 truncate text-[13px]",
                            unread ? "font-medium text-ink" : "text-mute",
                          )}
                        >
                          {group.senderName ? `${group.senderName}: ` : ""}
                          {group.lastMessage.text}
                        </span>
                        {unread ? (
                          <span
                            className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white"
                            aria-label={`Непрочитанных: ${group.unreadCount}`}
                          >
                            {group.unreadCount > 99 ? "99+" : group.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
