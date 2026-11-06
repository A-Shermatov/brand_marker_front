"use client"

import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ProhibitIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr"
import { tokenStorage } from "@/lib/api/client"
import {
  onSessionEnded,
  rememberSessionEnd,
  takeSessionEnd,
  type SessionEnded,
} from "@/lib/api/session-events"
import { useAuthStore } from "@/lib/store/auth-store"

/** Signs the tab out the moment the server ends the session, then opens the login page. */
export function SessionEndedHandler() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let handled = false
    return onSessionEnded((event) => {
      if (handled) return
      handled = true
      tokenStorage.clear()
      useAuthStore.setState({ user: null, isAuthenticated: false, isReady: true })
      queryClient.clear()
      rememberSessionEnd(event)
      const loginPath = window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login"
      window.location.replace(loginPath)
    })
  }, [queryClient])

  return null
}

/** Why the user landed on the login page, if their session was ended. */
export function SessionEndedNotice() {
  const [notice, setNotice] = useState<SessionEnded | null>(null)

  useEffect(() => {
    setNotice(takeSessionEnd())
  }, [])

  if (!notice) return null
  const blocked = notice.reason === "blocked"
  const Icon = blocked ? ProhibitIcon : SignOutIcon
  return (
    <div
      role="alert"
      className={
        blocked
          ? "mb-5 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[14px] text-red-800"
          : "mb-5 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[14px] text-amber-900"
      }
    >
      <Icon className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <span>{notice.message}</span>
    </div>
  )
}
