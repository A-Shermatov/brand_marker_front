"use client"

import { useMemo, useState } from "react"
import { ChatTextIcon as MessageSquare, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import {
  filterChatGroups,
  type CounterpartChatGroup,
} from "@/lib/chat-conversations"
import { formatRelativeIso } from "@/lib/format"

type ConversationsSidebarProps = {
  groups: CounterpartChatGroup[]
  selectedId: number | null
  onSelect: (counterpartId: number) => void
  searchPlaceholder?: string
}

const formatProjectCount = (count: number): string => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} проект`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} проекта`
  return `${count} проектов`
}

const getProjectsLine = (group: CounterpartChatGroup): string =>
  group.projects.length === 1
    ? group.projects[0]!.title
    : formatProjectCount(group.projects.length)

export const ConversationsSidebar = ({
  groups,
  selectedId,
  onSelect,
  searchPlaceholder = "Поиск по чатам...",
}: ConversationsSidebarProps) => {
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () => filterChatGroups(groups, query),
    [groups, query],
  )

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full min-h-[420px]">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            maxLength={100}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Поиск по чатам"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {query.trim() ? "Ничего не найдено" : "Диалогов пока нет"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((group) => {
              const isSelected = selectedId === group.counterpartId
              const hasUnread = group.unreadCount > 0
              const timeLabel = group.lastMessage.created_at
                ? formatRelativeIso(group.lastMessage.created_at)
                : null

              return (
                <button
                  key={group.counterpartId}
                  type="button"
                  onClick={() => onSelect(group.counterpartId)}
                  className={cn(
                    "w-full text-left p-4 hover:bg-secondary/50 transition-colors",
                    isSelected && "bg-secondary",
                  )}
                  aria-label={`Открыть переписку с ${group.counterpartName}`}
                  aria-current={isSelected ? "true" : undefined}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm truncate flex-1",
                            hasUnread
                              ? "font-bold text-foreground"
                              : "font-semibold text-foreground",
                          )}
                        >
                          {group.counterpartName}
                        </p>
                        {timeLabel && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {timeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {getProjectsLine(group)}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1 truncate",
                          hasUnread
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {group.senderName}: {group.lastMessage.text}
                      </p>
                    </div>
                    {hasUnread && (
                      <span
                        className="mt-0.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                        aria-label={`Непрочитанных: ${group.unreadCount}`}
                      >
                        {group.unreadCount > 99 ? "99+" : group.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
