"use client"

import { useQuery } from "@tanstack/react-query"
import { EyeIcon as Eye } from "@phosphor-icons/react/dist/ssr"
import { PendingInvitations } from "@/components/company/pending-invitations"
import { isViewerRole } from "@/lib/company-team"
import { isApiEnabled } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * Notices above every cabinet page: invitations waiting for an answer, and a
 * reminder for a viewer that they can look but not act (the server refuses
 * their actions anyway; this says so before they try).
 */
export const CabinetNotices = () => {
  const user = useAuthStore((s) => s.user)
  const syncProfiles = useAuthStore((s) => s.syncProfiles)
  // Access may have changed since sign-in: read it again when the cabinet
  // opens and when the person comes back to the tab.
  useQuery({
    queryKey: ["session-profiles", user?.userId ?? 0],
    queryFn: async () => {
      await syncProfiles()
      return true
    },
    enabled: Boolean(user) && isApiEnabled(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  })
  if (!user || !isApiEnabled()) return null

  const active = user.actors.find((actor) => actor.id === user.activeActorId)
  const viewer = active?.kind === "company" && isViewerRole(active.company_role)

  return (
    <div className="grid gap-3 empty:hidden [&:not(:empty)]:mb-5">
      <PendingInvitations />
      {viewer ? (
        <p
          data-testid="viewer-notice"
          className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface-muted px-4 py-3 text-[14px] text-ink-soft"
        >
          <Eye className="mt-0.5 size-[18px] shrink-0 text-mute" aria-hidden />
          <span>
            В компании «{active.display_name}» у вас доступ только для просмотра: вы видите
            заявки, сделки и переписку, но не можете ничего менять. Расширить доступ может
            руководитель или администратор компании.
          </span>
        </p>
      ) : null}
    </div>
  )
}
