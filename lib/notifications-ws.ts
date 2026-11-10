import { API_URL } from "@/lib/api/config"

// Next.js rewrites do not proxy WebSocket upgrades: with a relative API_URL set
// NEXT_PUBLIC_WS_URL to the API origin (e.g. wss://api.b2b.jupiter.tj/api/v1).
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? "").trim().replace(/\/+$/, "")

export const getNotificationsWsUrl = (accessToken: string): string => {
  const token = encodeURIComponent(accessToken)

  if (WS_URL) {
    return `${WS_URL}/ws/notifications?token=${token}`
  }

  if (API_URL.startsWith("/")) {
    const isSecure =
      typeof window !== "undefined" && window.location.protocol === "https:"
    const protocol = isSecure ? "wss" : "ws"
    const host =
      typeof window !== "undefined" ? window.location.host : "localhost:4000"
    return `${protocol}://${host}${API_URL}/ws/notifications?token=${token}`
  }

  const wsBase = API_URL.replace(/^http/i, "ws")
  return `${wsBase}/ws/notifications?token=${token}`
}
