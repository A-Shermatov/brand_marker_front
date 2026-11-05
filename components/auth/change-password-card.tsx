"use client"

import { useState } from "react"
import { KeyIcon as KeyRound, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PageSurface } from "@/components/layout"
import { authApi } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function ChangePasswordCard({ className }: Props) {
  const useApi = isApiEnabled()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setCurrent("")
    setNext("")
    setConfirm("")
    setError(null)
    setBusy(false)
  }

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) reset()
  }

  const validate = (): string | null => {
    if (!current) return "Введите текущий пароль"
    if (next.length < 8) return "Новый пароль — минимум 8 символов"
    if (next.length > 128) return "Новый пароль — максимум 128 символов"
    if (next === current) return "Новый пароль должен отличаться от текущего"
    if (next !== confirm) return "Пароли не совпадают"
    return null
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await authApi.changePassword(current, next)
      toast.success("Пароль изменён")
      setOpen(false)
      reset()
    } catch (err) {
      setError(getApiErrorMessage(err, "Не удалось изменить пароль"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSurface className={cn("space-y-4 p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Пароль</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Регулярно меняйте пароль. После смены остальные устройства будут
            выйдены из аккаунта.
          </p>
        </div>
        <KeyRound className="size-5 shrink-0 text-mute" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={!useApi}
        onClick={() => setOpen(true)}
      >
        Сменить пароль
      </Button>
      {!useApi ? (
        <p className="text-sm text-muted-foreground">
          Смена пароля доступна при подключении к API.
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>Сменить пароль</DialogTitle>
              <DialogDescription>
                Введите текущий пароль и придумайте новый (минимум 8 символов).
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Текущий пароль"
                aria-label="Текущий пароль"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Новый пароль"
                aria-label="Новый пароль"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Повторите новый пароль"
                aria-label="Повторите новый пароль"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {error ? (
                <p className="text-[13px] text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                Сменить пароль
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageSurface>
  )
}
