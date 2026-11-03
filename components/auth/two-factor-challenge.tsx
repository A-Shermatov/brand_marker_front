"use client"

import { useState } from "react"
import { OtpInput } from "@/components/auth/otp-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  busy?: boolean
  error?: string | null
  onSubmit: (code: string) => Promise<void> | void
  onBack: () => void
}

export function TwoFactorChallenge({ busy, error, onSubmit, onBack }: Props) {
  const [code, setCode] = useState("")
  const [useBackup, setUseBackup] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const cleaned = useBackup
      ? code.trim().toUpperCase().replace(/[\s-]/g, "")
      : code.replace(/\D/g, "")
    if (cleaned.length < 6 || busy) return
    await onSubmit(cleaned)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
      <div>
        <h1 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-ink">
          Код подтверждения
        </h1>
        <p className="text-[15px] text-mute">
          {useBackup
            ? "Введите один из резервных кодов"
            : "Введите 6-значный код из приложения-аутентификатора"}
        </p>
      </div>

      {useBackup ? (
        <div className="grid gap-1.5">
          <label htmlFor="backup-code" className="text-[14px] font-semibold text-ink">
            Резервный код
          </label>
          <Input
            id="backup-code"
            inputMode="text"
            autoComplete="one-time-code"
            autoFocus
            placeholder="XXXXXXXX"
            value={code}
            disabled={busy}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            aria-invalid={Boolean(error)}
            className="h-12 text-center font-mono text-[18px] tracking-[0.2em]"
          />
        </div>
      ) : (
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={busy}
          autoFocus
          aria-invalid={Boolean(error)}
        />
      )}

      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={busy || (useBackup ? code.trim().length < 6 : code.length < 6)}
        className="h-12 w-full text-[16px]"
      >
        {busy ? "Проверка…" : "Войти"}
      </Button>

      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => {
            setUseBackup((v) => !v)
            setCode("")
          }}
        >
          {useBackup ? "Ввести код из приложения" : "Использовать резервный код"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onBack}>
          Назад
        </Button>
      </div>
    </form>
  )
}
