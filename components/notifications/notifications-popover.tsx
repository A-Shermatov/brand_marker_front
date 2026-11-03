"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BellIcon as Bell, ChecksIcon as CheckCheck } from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { formatRelativeTime } from "@/lib/format"
import { getNotificationIcon } from "@/lib/notification-display"
import { cn } from "@/lib/utils"
import type { NotificationRole } from "@/lib/api/notifications"
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/hooks/api/use-notifications-query"
import {
  useNotificationItems,
  useUnreadNotificationsCount,
  type NotificationListItem,
} from "@/hooks/use-notifications"
import { useNotificationsStore } from "@/lib/store/notifications-store"

const PREVIEW_SIZE = 8

type NotificationsPopoverProps = {
  role: NotificationRole
}

export const NotificationsPopover = ({ role }: NotificationsPopoverProps) => {
  const hydrated = useHydrated()
  const [open, setOpen] = useState(false)
  const unreadCount = useUnreadNotificationsCount(role)

  const unreadQuery = useNotificationItems(role, {
    page: 1,
    pageSize: PREVIEW_SIZE,
    filter: "unread",
  })
  const recentQuery = useNotificationItems(role, {
    page: 1,
    pageSize: PREVIEW_SIZE,
    filter: "all",
  })

  const markReadLocal = useNotificationsStore((s) => s.markRead)
  const markAllReadLocal = useNotificationsStore((s) => s.markAllRead)
  const markReadMutation = useMarkNotificationReadMutation(role)
  const markAllReadMutation = useMarkAllNotificationsReadMutation(role)

  const allHref =
    role === "supplier" ? "/supplier/notifications" : "/customer/notifications"

  const useApi = unreadQuery.useApi
  const isLoading = unreadQuery.isLoading || recentQuery.isLoading

  const { items, showingUnreadOnly } = useMemo(() => {
    const unread = unreadQuery.items
    if (unread.length > 0) {
      return { items: unread.slice(0, PREVIEW_SIZE), showingUnreadOnly: true }
    }
    // Нет непрочитанных — показываем последние (в т.ч. прочитанные)
    return {
      items: recentQuery.items.slice(0, PREVIEW_SIZE),
      showingUnreadOnly: false,
    }
  }, [unreadQuery.items, recentQuery.items])

  const handleMarkRead = (id: string, apiId?: number) => {
    if (useApi && apiId) {
      markReadMutation.mutate(apiId)
      return
    }
    markReadLocal(id)
  }

  const handleMarkAllRead = () => {
    if (useApi) {
      markAllReadMutation.mutate()
      return
    }
    markAllReadLocal()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative grid size-10 place-items-center rounded-lg hover:bg-canvas"
          aria-label="Уведомления"
        >
          <Bell className="size-5" />
          {hydrated && unreadCount > 0 ? (
            <span className="absolute top-2 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,380px)] p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-bold text-foreground">Уведомления</p>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} непрочитанных`
                : items.length > 0
                  ? "Недавние"
                  : "Пусто"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMarkAllRead()
              }}
            >
              <CheckCheck size={14} />
              Прочитать все
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(60vh,360px)] overflow-y-auto">
          {!hydrated || isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Загрузка…
            </p>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 text-muted-foreground" size={22} />
              <p className="text-sm font-medium text-foreground">Уведомлений нет</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Новые события появятся здесь
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((n) => (
                <PreviewRow
                  key={n.id}
                  item={n}
                  allHref={allHref}
                  showUnreadDot={showingUnreadOnly || !n.read}
                  onOpen={() => {
                    handleMarkRead(n.id, n.apiId)
                    setOpen(false)
                  }}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" className="h-9 w-full text-sm font-semibold">
            <Link href={allHref} onClick={() => setOpen(false)}>
              Показать все
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const PreviewRow = ({
  item,
  allHref,
  showUnreadDot,
  onOpen,
}: {
  item: NotificationListItem
  allHref: string
  showUnreadDot: boolean
  onOpen: () => void
}) => {
  const Icon = getNotificationIcon(item.type)
  return (
    <li>
      <Link
        href={item.href ?? allHref}
        onClick={onOpen}
        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50"
      >
        <span
          className={cn(
            "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
            item.read
              ? "bg-secondary text-muted-foreground"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-foreground">
              {item.title}
            </span>
            {showUnreadDot && !item.read ? (
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            ) : null}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
            {item.body}
          </span>
          <span className="mt-1 block text-[11px] text-muted-foreground/70">
            {formatRelativeTime(item.createdAt)}
          </span>
        </span>
      </Link>
    </li>
  )
}
