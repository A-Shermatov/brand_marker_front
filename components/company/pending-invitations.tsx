"use client"

import { BuildingsIcon as Buildings } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  useMyInvitationsQuery,
} from "@/hooks/api/use-invitations-query"
import { COMPANY_ROLE_ACCESS, companyRoleLabel, formatInviteDeadline } from "@/lib/company-team"
import { cn } from "@/lib/utils"

type PendingInvitationsProps = {
  className?: string
  /** Shown when there is nothing to answer (the /invitations page); a banner shows nothing. */
  emptyText?: string
}

/**
 * "You were invited to a company": the person accepts or declines. Sits at the
 * top of both cabinets and on its own page; renders nothing when no invitation
 * waits.
 */
export const PendingInvitations = ({ className, emptyText }: PendingInvitationsProps) => {
  const { data, isLoading } = useMyInvitationsQuery()
  const accept = useAcceptInvitationMutation()
  const decline = useDeclineInvitationMutation()
  const busy = accept.isPending || decline.isPending
  const invitations = data ?? []

  if (invitations.length === 0) {
    if (!emptyText || isLoading) return null
    return <p className={cn("text-[15px] text-mute", className)}>{emptyText}</p>
  }

  return (
    <ul className={cn("grid gap-3", className)} aria-label="Приглашения в компании">
      {invitations.map((invitation) => (
        <li
          key={invitation.id}
          data-testid="pending-invitation"
          className="flex flex-col gap-4 rounded-2xl border border-brand-600/30 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between md:px-5"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-brand-700">
              <Buildings className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[15.5px] font-semibold leading-snug text-ink">
                Вас пригласили в компанию «{invitation.company_title}»
              </p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-ink-soft">
                Уровень доступа: {companyRoleLabel(invitation.role).toLowerCase()} —{" "}
                {COMPANY_ROLE_ACCESS[invitation.role].can.charAt(0).toLowerCase() +
                  COMPANY_ROLE_ACCESS[invitation.role].can.slice(1)}
                .{invitation.invited_by_name ? ` Пригласил: ${invitation.invited_by_name}.` : ""}{" "}
                Ответить можно {formatInviteDeadline(invitation.expires_at)}.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              disabled={busy}
              onClick={() => accept.mutate({ id: invitation.id })}
            >
              Принять
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => decline.mutate({ id: invitation.id })}
            >
              Отказаться
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
