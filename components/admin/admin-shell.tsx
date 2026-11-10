"use client"

import { Suspense, useEffect, useRef } from "react"
import { CircleNotchIcon as Loader2, ShieldSlashIcon as ShieldOff } from "@phosphor-icons/react/dist/ssr"
import { usePathname, useRouter } from "next/navigation"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminTopbar from "@/components/admin/admin-topbar"
import { CabinetShell } from "@/components/layout/cabinet-shell"
import { CabinetSkeleton } from "@/components/layout/cabinet-skeleton"
import { PageTransition } from "@/components/layout/page-transition"
import { SectionHub } from "@/components/layout/section-hub"
import { PageEmptyState } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { useNotificationsSocket } from "@/hooks/use-notifications-socket"
import { canAccessAdminPath, getFirstAllowedAdminPath } from "@/lib/admin-permissions"
import { useAuthStore } from "@/lib/store/auth-store"

const adminRoles = new Set(["admin", "superadmin", "moderator"])

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const restoreSession = useAuthStore((state) => state.restoreSession)
  const logout = useAuthStore((state) => state.logout)
  const sessionRefreshed = useRef(false)
  const isAllowed =
    isAuthenticated &&
    user?.role === "admin" &&
    adminRoles.has(user.platformRole)
  const canAccessPath = isAllowed && canAccessAdminPath(user, pathname)
  const fallbackPath = isAllowed ? getFirstAllowedAdminPath(user) : null
  useNotificationsSocket("admin", isAllowed)

  useEffect(() => {
    if (!hydrated || !isAllowed || sessionRefreshed.current) return
    sessionRefreshed.current = true
    void restoreSession()
  }, [hydrated, isAllowed, restoreSession])

  useEffect(() => {
    if (hydrated && !isAllowed) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [hydrated, isAllowed, pathname, router])

  useEffect(() => {
    if (!isAllowed || canAccessPath || !fallbackPath) return
    router.replace(fallbackPath)
  }, [canAccessPath, fallbackPath, isAllowed, router])

  const handleLogout = async () => {
    await logout("/admin/login")
  }

  if (!hydrated || !isAllowed) {
    return <CabinetSkeleton label="Открываем панель управления" />
  }

  if (!fallbackPath) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <PageEmptyState
          variant="card"
          icon={<ShieldOff />}
          title="Нет доступа"
          description="Вашей роли не назначен ни один раздел панели управления. Обратитесь к администратору платформы."
          action={
            <Button type="button" variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <CabinetShell
      sidebar={<AdminSidebar />}
      topbar={<AdminTopbar />}
      sectionHub={
        <Suspense fallback={null}>
          <SectionHub role="admin" />
        </Suspense>
      }
    >
      {canAccessPath ? (
        <PageTransition>{children}</PageTransition>
      ) : (
        <div className="flex min-h-[55dvh] items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={28} aria-label="Перенаправление" />
        </div>
      )}
    </CabinetShell>
  )
}
