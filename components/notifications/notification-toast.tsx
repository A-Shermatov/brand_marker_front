"use client"

import { ArrowRightIcon as ArrowRight, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getNotificationIcon } from "@/lib/notification-display"
import type { ApiNotification } from "@/types/notification"

type NotificationToastProps = {
  id: string | number
  notification: ApiNotification
  onOpen?: (href: string) => void
}

export const NotificationToast = ({ id, notification, onOpen }: NotificationToastProps) => {
  const Icon = getNotificationIcon(notification.type)
  const href = notification.href

  const handleClose = () => toast.dismiss(id)

  const handleOpen = () => {
    if (!href) return
    onOpen?.(href)
    toast.dismiss(id)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex w-full items-start gap-3 rounded-2xl border border-primary/20 bg-card p-4 pr-10 font-sans text-card-foreground shadow-lg sm:w-90"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground wrap-break-word">{notification.title}</p>
        {notification.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground wrap-break-word">
            {notification.body}
          </p>
        ) : null}
        {href ? (
          <Button type="button" size="sm" className="mt-3" onClick={handleOpen}>
            Открыть <ArrowRight />
          </Button>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleClose}
        aria-label="Закрыть уведомление"
        className="absolute top-2 right-2 size-7 rounded-lg text-muted-foreground hover:text-foreground"
      >
        <X size={14} />
      </Button>
    </div>
  )
}
