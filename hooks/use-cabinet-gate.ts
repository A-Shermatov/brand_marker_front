"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth-store"
import type { MarketplaceSessionRole } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { tokenStorage } from "@/lib/api/client"

type GateStatus = "loading" | "allowed" | "denied"

const cabinetHomeForRole = (role: MarketplaceSessionRole): string =>
  role === "supplier" ? "/supplier" : "/customer"

const sideForCabinet = (role: MarketplaceSessionRole): "buyer" | "supplier" =>
  role === "supplier" ? "supplier" : "buyer"

/**
 * Waits for auth hydration, then either accepts an in-memory session
 * for the expected role or restores it from API tokens.
 * Does not auto-switch marketplace roles — wrong-role sessions stay put.
 * Ensures X-Actor-Id matches the cabinet side before allowing access.
 */
export const useCabinetGate = (expectedRole: MarketplaceSessionRole): GateStatus => {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useHydrated()
  const isReady = useAuthStore((s) => s.isReady)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userRole = useAuthStore((s) => s.user?.role)
  const activeActorId = useAuthStore((s) => s.user?.activeActorId)
  const [status, setStatus] = useState<GateStatus>("loading")

  useEffect(() => {
    if (!hydrated || !isReady) return

    let cancelled = false

    const ensureActorMatchesRole = async (): Promise<boolean> => {
      const state = useAuthStore.getState()
      const user = state.user
      if (!user) return false

      const expectedSide = sideForCabinet(expectedRole)
      const activeId = user.activeActorId ?? user.actorId
      const active = user.actors.find((a) => a.id === activeId)
      const storageId = tokenStorage.getActorId()

      const sideOk = active?.side === expectedSide
      const storageOk = storageId === activeId

      if (sideOk && storageOk && activeId) {
        return true
      }

      if (sideOk && activeId) {
        tokenStorage.setActorId(activeId)
        return true
      }

      const forSide = user.actors.filter((a) => a.side === expectedSide)
      const target =
        forSide.find((a) => a.id === activeId)
        ?? forSide.find((a) => a.kind === (user.prefersCompany ? "company" : "individual"))
        ?? forSide.find((a) => a.kind === "individual")
        ?? forSide[0]

      if (!target) return false

      try {
        await state.switchActor(target.id)
        tokenStorage.setActorId(target.id)
        return true
      } catch {
        return false
      }
    }

    const ensureAccess = async () => {
      const state = useAuthStore.getState()

      if (state.isAuthenticated && state.user) {
        if (state.user.role === expectedRole) {
          const aligned = await ensureActorMatchesRole()
          if (cancelled) return
          if (aligned) {
            setStatus("allowed")
            return
          }
          setStatus("denied")
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
          return
        }
        if (state.user.role === "admin") {
          if (!cancelled) {
            setStatus("denied")
            router.replace("/admin")
          }
          return
        }
        if (state.user.role === "customer" || state.user.role === "supplier") {
          if (!cancelled) {
            setStatus("denied")
            router.replace(cabinetHomeForRole(state.user.role))
          }
          return
        }
      }

      const restored = await state.restoreSession()
      if (cancelled) return

      const restoredUser = useAuthStore.getState().user
      if (restored && restoredUser) {
        if (
          restoredUser.role === "customer" || restoredUser.role === "supplier"
        ) {
          if (restoredUser.role !== expectedRole) {
            setStatus("denied")
            router.replace(cabinetHomeForRole(restoredUser.role))
            return
          }
        }
        if (restoredUser.role === expectedRole) {
          const aligned = await ensureActorMatchesRole()
          if (cancelled) return
          if (aligned) {
            setStatus("allowed")
            return
          }
        }
      }

      setStatus("denied")
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }

    void ensureAccess()

    return () => {
      cancelled = true
    }
  }, [
    hydrated,
    isReady,
    isAuthenticated,
    userRole,
    activeActorId,
    expectedRole,
    router,
    pathname,
  ])

  return status
}
