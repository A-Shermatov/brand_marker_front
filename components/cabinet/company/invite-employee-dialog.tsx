"use client"

import { useState } from "react"
import { CheckCircleIcon as CheckCircle } from "@phosphor-icons/react/dist/ssr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InviteLinkField } from "@/components/cabinet/company/invite-link-field"
import {
  ASSIGNABLE_COMPANY_ROLES,
  COMPANY_ROLE_ACCESS,
  COMPANY_ROLE_LABELS,
} from "@/lib/company-team"
import { getApiErrorMessage } from "@/lib/api/client"
import type { CompanyInvitation, CompanyRole } from "@/types"

type InviteEmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  busy?: boolean
  /** Returns the invitation (with its link) when the server made one. */
  onInvite: (data: {
    email: string
    role: CompanyRole
  }) => CompanyInvitation | void | undefined | Promise<CompanyInvitation | void | undefined>
}

/**
 * Invite a person to the company by email. They join only after accepting;
 * a person who is not registered yet signs up from the link.
 */
export const InviteEmployeeDialog = ({
  open,
  onOpenChange,
  busy = false,
  onInvite,
}: InviteEmployeeDialogProps) => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Exclude<CompanyRole, "director">>("moderator")
  const [error, setError] = useState<string | undefined>()
  const [sent, setSent] = useState<CompanyInvitation | null>(null)

  const reset = () => {
    setEmail("")
    setRole("moderator")
    setError(undefined)
    setSent(null)
  }

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Укажите корректный email")
      return
    }
    setError(undefined)
    try {
      const invitation = await onInvite({ email: trimmed, role })
      if (invitation?.invite_url) {
        setSent(invitation)
        return
      }
      reset()
      onOpenChange(false)
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось отправить приглашение"))
    }
  }

  const access = COMPANY_ROLE_ACCESS[role]

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="size-5 text-success" weight="fill" aria-hidden />
                Приглашение отправлено
              </DialogTitle>
              <DialogDescription>
                {sent.email} появится в команде, когда примет приглашение.{" "}
                {sent.email_sent
                  ? "Мы отправили письмо со ссылкой."
                  : "Если у человека уже есть кабинет, он увидит приглашение там."}{" "}
                Ссылку можно отправить и самим — в мессенджере.
              </DialogDescription>
            </DialogHeader>
            <InviteLinkField url={sent.invite_url ?? ""} />
            <p className="text-[13px] text-mute">
              Ссылка действует 14 дней и только для адреса {sent.email}.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="dark"
                onClick={() => {
                  reset()
                  onOpenChange(false)
                }}
              >
                Готово
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Пригласить сотрудника</DialogTitle>
              <DialogDescription>
                Укажите рабочую почту и уровень доступа. Человек сам примет приглашение;
                если он ещё не зарегистрирован, он сделает это по ссылке.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.tj"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error)}
                  disabled={busy}
                />
                {error ? (
                  <p role="alert" className="text-[13.5px] font-medium text-red-600">
                    {error}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-role">Уровень доступа</Label>
                <select
                  id="invite-role"
                  value={role}
                  disabled={busy}
                  onChange={(e) => setRole(e.target.value as Exclude<CompanyRole, "director">)}
                  className="h-11 w-full rounded-lg border border-line bg-card px-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 disabled:opacity-60"
                >
                  {ASSIGNABLE_COMPANY_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {COMPANY_ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="text-[13px] leading-snug text-mute">
                  <span className="font-medium text-ink-soft">Может:</span> {access.can}.
                  {access.cannot ? (
                    <>
                      {" "}
                      <span className="font-medium text-ink-soft">Не может:</span>{" "}
                      {access.cannot.charAt(0).toLowerCase() + access.cannot.slice(1)}.
                    </>
                  ) : null}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="dark"
                disabled={busy}
                onClick={() => void handleSubmit()}
              >
                Отправить приглашение
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
