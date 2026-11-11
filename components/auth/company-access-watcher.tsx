"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { onCompanyAccessRevoked } from "@/lib/api/access-events"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * A person removed from a company while working in its cabinet: the next
 * request is refused. Tell them why, put them into a profile they still have
 * and reload the cabinet, so no page keeps the company's data on screen.
 */
export function CompanyAccessWatcher() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let handling = false
    return onCompanyAccessRevoked((message) => {
      if (handling) return
      handling = true
      toast.error(message, {
        description: "Мы переключили вас на ваш личный профиль.",
        duration: 8000,
      })
      void useAuthStore
        .getState()
        .refreshSession()
        .then((role) => {
          queryClient.clear()
          if (!role) return
          const home = role === "supplier" ? "/supplier" : "/customer"
          // A full load: every list is read again for the new profile.
          window.location.replace(`${home}?left=1`)
        })
        .catch(() => {
          handling = false
        })
    })
  }, [queryClient])

  return null
}
