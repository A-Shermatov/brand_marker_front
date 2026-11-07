"use client"

import { useState } from "react"
import Link from "next/link"
import { BellIcon as Bell, ChecksIcon as CheckCheck, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { useHydrated } from "@/hooks/use-hydrated"
import { formatRelativeTime } from "@/lib/format"
import { getNotificationIcon } from "@/lib/notification-display"
import type { NotificationRole } from "@/lib/api/notifications"
import type { NotificationFilterKey } from "@/hooks/api/use-notifications-query"
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/hooks/api/use-notifications-query"
import { useNotificationItems } from "@/hooks/use-notifications"
import { useNotificationsStore } from "@/lib/store/notifications-store"
import { Button } from "@/components/ui/button"
import { ListPagination } from "@/components/list-pagination"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"

type NotificationsPageContentProps = {
  role: NotificationRole
}

const FILTERS: Array<{ value: NotificationFilterKey; label: string }> = [
  { value: "all", label: "Все" },
  { value: "unread", label: "Непрочитанные" },
  { value: "read", label: "Прочитанные" },
]

export const NotificationsPageContent = ({ role }: NotificationsPageContentProps) => {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<NotificationFilterKey>("all")
  const { items, isLoading, useApi, totalPages, total } = useNotificationItems(role, {
    page,
    pageSize: 20,
    filter,
  })
  const markReadLocal = useNotificationsStore((s) => s.markRead)
  const markAllReadLocal = useNotificationsStore((s) => s.markAllRead)
  const removeLocal = useNotificationsStore((s) => s.remove)
  const markReadMutation = useMarkNotificationReadMutation(role)
  const markAllReadMutation = useMarkAllNotificationsReadMutation(role)

  const hasUnread = filter === "unread" ? total > 0 : items.some((n) => !n.read)
  const notificationsHref =
    role === "supplier" ? "/supplier/notifications" : "/customer/notifications"

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

  const handleFilterChange = (next: NotificationFilterKey) => {
    setFilter(next)
    setPage(1)
  }

  return (
    <PageFrame>
      <PageHeader
        title="Уведомления"
        description="События по вашим заказам и платежам"
        actions={
          hydrated && hasUnread ? (
            <Button type="button" variant="ghost" size="lg" onClick={handleMarkAllRead}>
              <CheckCheck size={15} /> Прочитать все
            </Button>
          ) : undefined
        }
      />

      <SegmentedControl
        value={filter}
        options={FILTERS}
        onChange={handleFilterChange}
        ariaLabel="Фильтр уведомлений"
        className="mb-4 w-full max-w-md"
      />

      {!hydrated || isLoading ? (
        <PageSurface>
          <PageEmptyState title="Загрузка уведомлений..." />
        </PageSurface>
      ) : items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<Bell size={26} />}
            title={
              filter === "unread"
                ? "Непрочитанных нет"
                : filter === "read"
                  ? "Прочитанных нет"
                  : "Уведомлений нет"
            }
            description="Здесь появятся события: новые отклики, статусы оплаты и споров"
          />
        </PageSurface>
      ) : (
        <>
          <div className="space-y-2.5">
            {items.map((n) => {
              const Icon = getNotificationIcon(n.type)
              const content = (
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                    n.read ? "border-border bg-card" : "border-primary/20 bg-secondary/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      n.read
                        ? "bg-secondary text-muted-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{n.title}</p>
                      {!n.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!useApi && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        removeLocal(n.id)
                      }}
                      className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Удалить"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )

              const href = n.href ?? notificationsHref
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => handleMarkRead(n.id, n.apiId)}
                  className="block"
                >
                  {content}
                </Link>
              )
            })}
          </div>
          <ListPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </PageFrame>
  )
}
