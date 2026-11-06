"use client"

import { createElement, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { NotificationRole } from "@/lib/api/notifications"
import { adminSupportApi } from "@/lib/api/admin/support"
import { contractsApi } from "@/lib/api/contracts"
import { supplierContractsApi } from "@/lib/api/supplier/contracts"
import { supportApi } from "@/lib/api/support"
import { isApiEnabled } from "@/lib/api/config"
import { ensureAccessToken } from "@/lib/api/client"
import { notifySessionEnded, type SessionEnded } from "@/lib/api/session-events"
import { getNotificationsWsUrl } from "@/lib/notifications-ws"
import {
  prependNotificationToCache,
} from "@/hooks/api/use-notifications-query"
import { navCountsKeys } from "@/hooks/api/use-nav-counts-query"
import {
  contractKeys,
  supplierContractKeys,
} from "@/hooks/api/use-contracts-query"
import { supplierRfqKeys } from "@/hooks/api/use-supplier-rfqs-query"
import {
  appendContractMessageToCache,
  updateContractMessageStatusInCache,
} from "@/lib/contract-chat-cache"
import {
  appendSupportMessageToCache,
  supportKeys,
  updateSupportMessageStatusInCache,
} from "@/lib/support-chat-cache"
import { directChatKeys } from "@/hooks/api/use-direct-chats-query"
import { useAuthStore } from "@/lib/store/auth-store"
import { NotificationToast } from "@/components/notifications/notification-toast"
import type { ApiNotification } from "@/types/notification"
import type { Message } from "@/types"
import type { SupportMessage } from "@/types/support"

export type SocketRole = NotificationRole | "admin"

type ContractMessagePayload = {
  contract_id: number
  message?: Message
  messages?: Message[]
}

type SupportMessagePayload = {
  ticket_id: number
  message?: SupportMessage
  messages?: SupportMessage[]
  status?: string
}

type WsPayload = {
  event: string
  data?: ApiNotification | ContractMessagePayload | SupportMessagePayload | Partial<SessionEnded>
}

const ackInFlight = new Set<string>()

export const useNotificationsSocket = (
  role: SocketRole,
  enabled = true,
) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const userId = useAuthStore((s) => s.user?.userId ?? 0)
  const reconnectAttempt = useRef(0)
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!enabled || !isApiEnabled()) return

    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined
    const supportRole = role === "admin" ? null : role

    const ackContractDelivered = async (contractId: number, messageId: number) => {
      if (role === "admin") return
      const key = `contract:${role}:${contractId}:${messageId}`
      if (ackInFlight.has(key)) return
      ackInFlight.add(key)
      try {
        const api = role === "buyer" ? contractsApi : supplierContractsApi
        const updated = await api.markMessageDelivered(contractId, messageId)
        updateContractMessageStatusInCache(queryClient, contractId, [updated])
      } catch {
        // ignore ack failures
      } finally {
        ackInFlight.delete(key)
      }
    }

    const ackSupportDelivered = async (ticketId: number, messageId: number) => {
      const key = `support:${role}:${ticketId}:${messageId}`
      if (ackInFlight.has(key)) return
      ackInFlight.add(key)
      try {
        const updated =
          role === "admin"
            ? await adminSupportApi.markDelivered(ticketId, messageId)
            : await supportApi.markDelivered(role, ticketId, messageId)
        updateSupportMessageStatusInCache(
          queryClient,
          ticketId,
          [updated],
          supportRole ?? undefined,
        )
      } catch {
        // ignore ack failures
      } finally {
        ackInFlight.delete(key)
      }
    }

    const connect = async () => {
      if (cancelled) return
      const token = await ensureAccessToken()
      if (!token || cancelled) return

      const socket = new WebSocket(getNotificationsWsUrl(token))
      socketRef.current = socket

      socket.onopen = () => {
        reconnectAttempt.current = 0
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as WsPayload
          if (payload.event === "ping") {
            socket.send("pong")
            return
          }
          if (payload.event === "session_ended") {
            // The admin ended the session or blocked the account: leave at once.
            cancelled = true
            const data = (payload.data ?? {}) as Partial<SessionEnded>
            notifySessionEnded({
              reason: data.reason ?? "revoked",
              message: data.message ?? "Сеанс завершён. Войдите снова.",
            })
            return
          }
          if (payload.event === "notification.created" && payload.data) {
            const notification = payload.data as ApiNotification
            if (role !== "admin") {
              prependNotificationToCache(queryClient, role, notification)
            }
            toast.custom(
              (id) =>
                createElement(NotificationToast, {
                  id,
                  notification,
                  onOpen: (href: string) => router.push(href),
                }),
              { duration: 6000 },
            )
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
            if (notification.type === "proposal") {
              void queryClient.invalidateQueries({ queryKey: ["proposals"] })
              void queryClient.invalidateQueries({ queryKey: ["proposal-messages"] })
              void queryClient.invalidateQueries({ queryKey: ["supplier-proposals"] })
            }
            if (notification.type === "contract") {
              void queryClient.invalidateQueries({ queryKey: contractKeys.all })
              void queryClient.invalidateQueries({ queryKey: supplierContractKeys.all })
              void queryClient.invalidateQueries({ queryKey: supplierRfqKeys.all })
              void queryClient.invalidateQueries({ queryKey: supplierRfqKeys.proposals() })
              void queryClient.invalidateQueries({ queryKey: directChatKeys.all })
            }
            if (notification.type === "support") {
              void queryClient.invalidateQueries({ queryKey: supportKeys.all })
            }
            return
          }
          if (payload.event === "contract.message" && payload.data && role !== "admin") {
            const data = payload.data as ContractMessagePayload
            if (!data.contract_id || !data.message) return
            appendContractMessageToCache(queryClient, data.contract_id, data.message)
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
            if (userId > 0 && data.message.sender_id !== userId) {
              void ackContractDelivered(data.contract_id, data.message.id)
            }
            return
          }
          if (
            (payload.event === "direct.message" || payload.event === "direct.message.status") &&
            payload.data &&
            role !== "admin"
          ) {
            void queryClient.invalidateQueries({ queryKey: directChatKeys.all })
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
            return
          }
          if (payload.event === "contract.message.status" && payload.data && role !== "admin") {
            const data = payload.data as ContractMessagePayload
            if (!data.contract_id) return
            const updates = data.messages?.length
              ? data.messages
              : data.message
                ? [data.message]
                : []
            updateContractMessageStatusInCache(queryClient, data.contract_id, updates)
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
            return
          }
          if (payload.event === "support.message" && payload.data) {
            const data = payload.data as SupportMessagePayload
            if (!data.ticket_id || !data.message) return
            appendSupportMessageToCache(
              queryClient,
              data.ticket_id,
              data.message,
              supportRole ?? undefined,
            )
            void queryClient.invalidateQueries({ queryKey: supportKeys.adminUnread })
            if (supportRole) {
              void queryClient.invalidateQueries({ queryKey: supportKeys.unread(supportRole) })
            }
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
            if (userId > 0 && data.message.sender_id !== userId) {
              void ackSupportDelivered(data.ticket_id, data.message.id)
            }
            return
          }
          if (payload.event === "support.message.status" && payload.data) {
            const data = payload.data as SupportMessagePayload
            if (!data.ticket_id) return
            const updates = data.messages?.length
              ? data.messages
              : data.message
                ? [data.message]
                : []
            updateSupportMessageStatusInCache(
              queryClient,
              data.ticket_id,
              updates,
              supportRole ?? undefined,
            )
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
            return
          }
          if (payload.event === "support.ticket.closed") {
            void queryClient.invalidateQueries({ queryKey: supportKeys.all })
            void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
          }
        } catch {
          // ignore malformed messages
        }
      }

      socket.onclose = (event) => {
        socketRef.current = null
        if (cancelled) return
        const delay = Math.min(1000 * 2 ** reconnectAttempt.current, 30000)
        reconnectAttempt.current += 1
        reconnectTimer = setTimeout(() => {
          if (event.code === 4401) {
            void ensureAccessToken(true).then((token) => {
              if (!token || cancelled) return
              void connect()
            })
            return
          }
          void connect()
        }, delay)
      }
    }

    void connect()

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [enabled, role, queryClient, userId, router])

  useEffect(() => {
    if (!enabled || !isApiEnabled()) return
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "bm-access-token") return
      socketRef.current?.close()
      reconnectAttempt.current = 0
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [enabled])
}
