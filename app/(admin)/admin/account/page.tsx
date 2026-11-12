"use client"

import { ChangePasswordCard } from "@/components/auth/change-password-card"
import { TwoFactorSettings } from "@/components/auth/two-factor-settings"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { getStaffRoleLabel } from "@/lib/admin-permissions"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * A member of staff's own account: who they are signed in as, their password
 * and the second step of sign-in. Kept apart from the settings of the
 * marketplace, which are not theirs alone.
 */
export default function AdminAccountPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <PageFrame>
      <PageHeader
        title="Мой аккаунт"
        description="Ваш вход в панель управления. Эти настройки касаются только вас"
        backHref="/admin"
        backLabel="В панель"
      />
      <div className="space-y-6">
        {user ? (
          <PageSurface className="p-6" aria-label="Кто вошёл">
            <p className="text-base font-bold text-foreground">{user.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.email} · {getStaffRoleLabel(user.staffRoleName ?? user.platformRole)}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Что вам доступно в панели, определяет ваша роль. Её назначает администратор в разделе
              «Сотрудники и доступ».
            </p>
          </PageSurface>
        ) : null}
        <ChangePasswordCard />
        <TwoFactorSettings />
      </div>
    </PageFrame>
  )
}
