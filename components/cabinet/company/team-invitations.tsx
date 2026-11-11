"use client"

import { useState } from "react"
import { EnvelopeSimpleIcon as Envelope } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InviteLinkField } from "@/components/cabinet/company/invite-link-field"
import {
  useBuyerInvitationsQuery,
  useCancelBuyerInvitationMutation,
  useResendBuyerInvitationMutation,
} from "@/hooks/api/use-buyer-companies-query"
import {
  useCancelSupplierInvitationMutation,
  useResendSupplierInvitationMutation,
  useSupplierInvitationsQuery,
} from "@/hooks/api/use-supplier-companies-query"
import {
  companyRoleLabel,
  formatInviteDeadline,
  invitationStatusLabel,
} from "@/lib/company-team"
import type { CompanyInvitation } from "@/types"

type TeamInvitationsProps = {
  side: "buyer" | "supplier"
  companyId: number | null | undefined
  /** Only a director or admin sees and manages invitations. */
  canManage: boolean
  className?: string
}

/**
 * People who were invited and have not joined yet: waiting, expired or
 * declined. A director or admin sends the invitation again (a new link) or
 * cancels it.
 */
export const TeamInvitations = ({ side, companyId, canManage, className }: TeamInvitationsProps) => {
  const buyerQuery = useBuyerInvitationsQuery(companyId, canManage && side === "buyer")
  const supplierQuery = useSupplierInvitationsQuery(companyId, canManage && side === "supplier")
  const resendBuyer = useResendBuyerInvitationMutation()
  const resendSupplier = useResendSupplierInvitationMutation()
  const cancelBuyer = useCancelBuyerInvitationMutation()
  const cancelSupplier = useCancelSupplierInvitationMutation()
  const query = side === "buyer" ? buyerQuery : supplierQuery
  const resend = side === "buyer" ? resendBuyer : resendSupplier
  const cancel = side === "buyer" ? cancelBuyer : cancelSupplier
  const [fresh, setFresh] = useState<CompanyInvitation | null>(null)

  const invitations = query.data ?? []
  if (!canManage || !companyId || invitations.length === 0) return null
  const busy = resend.isPending || cancel.isPending

  const handleResend = async (invitation: CompanyInvitation) => {
    try {
      setFresh(await resend.mutateAsync({ companyId, invitationId: invitation.id }))
    } catch {
      // The mutation shows the error itself.
    }
  }

  return (
    <section className={className} aria-label="Приглашения">
      <h2 className="mb-2 text-[15.5px] font-semibold">Приглашения</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {invitations.map((invitation) => {
          const waiting = invitation.status === "pending"
          const canResend = waiting || invitation.status === "expired"
          return (
            <li
              key={invitation.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted text-mute">
                  <Envelope className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="break-all text-[15px] font-semibold leading-snug">
                    {invitation.email}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-mute">
                    {companyRoleLabel(invitation.role)} · {invitationStatusLabel(invitation.status)}
                    {waiting ? ` ${formatInviteDeadline(invitation.expires_at)}` : ""}
                  </p>
                </div>
              </div>
              {canResend ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleResend(invitation)}
                  >
                    Отправить ещё раз
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() =>
                      void cancel
                        .mutateAsync({ companyId, invitationId: invitation.id })
                        .catch(() => {})
                    }
                  >
                    Отменить
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <Dialog open={Boolean(fresh)} onOpenChange={(open) => !open && setFresh(null)}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Новая ссылка-приглашение</DialogTitle>
            <DialogDescription>
              Прежняя ссылка больше не работает. Отправьте эту на адрес {fresh?.email}
              {fresh?.email_sent ? " — письмо мы тоже отправили." : " или в мессенджере."}
            </DialogDescription>
          </DialogHeader>
          <InviteLinkField url={fresh?.invite_url ?? ""} />
          <DialogFooter>
            <Button type="button" variant="dark" onClick={() => setFresh(null)}>
              Готово
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
