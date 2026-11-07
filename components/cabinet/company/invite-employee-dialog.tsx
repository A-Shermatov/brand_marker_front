"use client"

import { useState } from "react"
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
import {
  ASSIGNABLE_COMPANY_ROLES,
  COMPANY_ROLE_LABELS,
} from "@/lib/company-team"
import type { CompanyRole } from "@/types"

type InviteEmployeeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  busy?: boolean
  onInvite: (data: { email: string; role: CompanyRole }) => void | Promise<void>
}

export const InviteEmployeeDialog = ({
  open,
  onOpenChange,
  busy = false,
  onInvite,
}: InviteEmployeeDialogProps) => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Exclude<CompanyRole, "director">>("moderator")
  const [error, setError] = useState<string | undefined>()

  const reset = () => {
    setEmail("")
    setRole("moderator")
    setError(undefined)
  }

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Укажите корректный email")
      return
    }
    await onInvite({ email: trimmed, role })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle>Добавить сотрудника</DialogTitle>
          <DialogDescription>
            Пользователь должен уже быть зарегистрирован на площадке. Добавление
            идёт по email аккаунта.
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
              <p className="text-[13.5px] font-medium text-red-600">{error}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Роль</Label>
            <select
              id="invite-role"
              value={role}
              disabled={busy}
              onChange={(e) =>
                setRole(e.target.value as Exclude<CompanyRole, "director">)
              }
              className="h-11 w-full rounded-lg border border-line bg-card px-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 disabled:opacity-60"
            >
              {ASSIGNABLE_COMPANY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {COMPANY_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
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
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
