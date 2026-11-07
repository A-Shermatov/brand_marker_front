"use client"

import { useEffect, useRef, useState } from "react"
import { CheckIcon as Check, CopyIcon as Copy, CircleNotchIcon as Loader2, ShieldCheckIcon as ShieldCheck, ShieldSlashIcon as ShieldOff } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { OtpInput } from "@/components/auth/otp-input"
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
import { authApi, type TwoFactorSetup } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  compact?: boolean
}

type SetupStep = "intro" | "scan" | "backup" | "confirm" | "done"

const SETUP_STEPS: SetupStep[] = ["intro", "scan", "backup", "confirm", "done"]

const stepMeta: Record<SetupStep, { title: string; description: string }> = {
  intro: {
    title: "Включить 2FA",
    description: "Дополнительный код при каждом входе защитит аккаунт даже при утечке пароля.",
  },
  scan: {
    title: "Шаг 1 · Приложение",
    description: "Отсканируйте QR в Google Authenticator, Authy или аналогичном приложении.",
  },
  backup: {
    title: "Шаг 2 · Резервные коды",
    description: "Сохраните коды в надёжном месте — они показываются один раз.",
  },
  confirm: {
    title: "Шаг 3 · Подтверждение",
    description: "Введите 6-значный код из приложения, чтобы завершить подключение.",
  },
  done: {
    title: "2FA включена",
    description: "При следующем входе потребуется код из приложения.",
  },
}

export function TwoFactorSettings({ className, compact }: Props) {
  const useApi = isApiEnabled()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [setupOpen, setSetupOpen] = useState(false)
  const [step, setStep] = useState<SetupStep>("intro")
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [confirmCode, setConfirmCode] = useState("")
  const [backupSaved, setBackupSaved] = useState(false)
  const [copiedBackup, setCopiedBackup] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const setupLock = useRef(false)

  const refresh = async () => {
    if (!useApi) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const me = await authApi.me()
      setEnabled(Boolean(me.user.totp_enabled))
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось загрузить статус 2FA"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [useApi])

  const resetSetupWizard = () => {
    setupLock.current = false
    setStep("intro")
    setSetup(null)
    setConfirmCode("")
    setBackupSaved(false)
    setCopiedBackup(false)
    setCopiedSecret(false)
    setBusy(false)
  }

  const openSetup = () => {
    resetSetupWizard()
    setSetupOpen(true)
  }

  const closeSetup = (open: boolean) => {
    setSetupOpen(open)
    if (!open) resetSetupWizard()
  }

  const goToScan = async () => {
    if (setup) {
      setStep("scan")
      return
    }
    if (setupLock.current || busy) return
    setupLock.current = true
    setBusy(true)
    try {
      const result = await authApi.setup2fa()
      setSetup(result)
      setStep("scan")
    } catch (error) {
      setupLock.current = false
      toast.error(getApiErrorMessage(error, "Не удалось начать настройку 2FA"))
    } finally {
      setBusy(false)
    }
  }

  const copyBackupCodes = async () => {
    if (!setup) return
    try {
      await navigator.clipboard.writeText(setup.backup_codes.join("\n"))
      setCopiedBackup(true)
      setBackupSaved(true)
      toast.success("Коды скопированы")
    } catch {
      toast.error("Не удалось скопировать — сохраните коды вручную")
    }
  }

  const copySecret = async () => {
    if (!setup) return
    try {
      await navigator.clipboard.writeText(setup.secret)
      setCopiedSecret(true)
      toast.success("Секрет скопирован")
    } catch {
      toast.error("Не удалось скопировать секрет")
    }
  }

  const confirmSetup = async () => {
    const code = confirmCode.replace(/\D/g, "")
    if (code.length < 6 || busy || !setup) return
    setBusy(true)
    try {
      await authApi.confirm2fa(code)
      setEnabled(true)
      setStep("done")
      toast.success("Двухфакторная аутентификация включена")
    } catch (error) {
      setConfirmCode("")
      toast.error(
        getApiErrorMessage(
          error,
          "Код не подходит к этому QR. Удалите запись в приложении и отсканируйте QR ещё раз.",
        ),
      )
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      await authApi.disable2fa(disablePassword, disableCode.trim())
      setEnabled(false)
      setDisableOpen(false)
      setDisablePassword("")
      setDisableCode("")
      toast.success("2FA отключена")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось отключить 2FA"))
    } finally {
      setBusy(false)
    }
  }

  const stepIndex = SETUP_STEPS.indexOf(step)
  const progressSteps = SETUP_STEPS.filter((s) => s !== "intro" && s !== "done")

  if (!useApi) {
    return (
      <PageSurface className={cn("space-y-3 p-5 sm:p-6", className)}>
        <h2 className="text-base font-semibold">Безопасность</h2>
        <p className="text-sm text-muted-foreground">
          2FA доступна при подключении к API.
        </p>
      </PageSurface>
    )
  }

  return (
    <PageSurface className={cn("space-y-4 p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Двухфакторная аутентификация</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            TOTP-код из приложения (Google Authenticator, Authy и т.п.)
          </p>
        </div>
        {loading ? (
          <Loader2 className="size-5 animate-spin text-mute" />
        ) : enabled ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[13px] font-semibold text-emerald-700">
            <ShieldCheck className="size-3.5" />
            Включена
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-[13px] font-semibold text-amber-800">
            <ShieldOff className="size-3.5" />
            Выключена
          </span>
        )}
      </div>

      {!loading && !enabled && (
        <Button type="button" onClick={openSetup}>
          Включить 2FA
        </Button>
      )}

      {!loading && enabled && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDisablePassword("")
            setDisableCode("")
            setDisableOpen(true)
          }}
        >
          Отключить 2FA
        </Button>
      )}

      <Dialog open={setupOpen} onOpenChange={closeSetup}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{stepMeta[step].title}</DialogTitle>
            <DialogDescription>{stepMeta[step].description}</DialogDescription>
          </DialogHeader>

          {step !== "intro" && step !== "done" && (
            <ol className="flex gap-1.5" aria-label="Прогресс настройки">
              {progressSteps.map((s, i) => {
                const active = SETUP_STEPS.indexOf(s) <= stepIndex
                return (
                  <li
                    key={s}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      active ? "bg-ink" : "bg-line",
                    )}
                    aria-current={s === step ? "step" : undefined}
                    title={`Шаг ${i + 1}`}
                  />
                )
              })}
            </ol>
          )}

          {step === "intro" && (
            <ul className="space-y-2 text-sm text-mute">
              <li>1. Установите приложение-аутентификатор</li>
              <li>2. Отсканируйте QR-код</li>
              <li>3. Сохраните резервные коды</li>
              <li>4. Подтвердите 6-значным кодом</li>
            </ul>
          )}

          {step === "scan" && setup && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="rounded-xl border border-line bg-card p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={setup.qr_data_url}
                    alt="QR-код для настройки 2FA"
                    width={180}
                    height={180}
                    className="size-[180px]"
                  />
                </div>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink">Секрет вручную</div>
                <code className="mt-1 block break-all rounded-xl border border-line bg-surface-muted/40 px-3 py-2 text-[13px] tracking-wider">
                  {setup.secret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void copySecret()}
                >
                  {copiedSecret ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copiedSecret ? "Скопировано" : "Скопировать секрет"}
                </Button>
              </div>
            </div>
          )}

          {step === "backup" && setup && (
            <div className="space-y-3">
              <ul className="grid grid-cols-2 gap-1.5">
                {setup.backup_codes.map((code) => (
                  <li
                    key={code}
                    className="rounded-lg border border-line bg-surface-muted/40 px-2 py-1.5 font-mono text-[12.5px]"
                  >
                    {code}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void copyBackupCodes()}
              >
                {copiedBackup ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copiedBackup ? "Скопировано" : "Скопировать коды"}
              </Button>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-mute">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-ink"
                  checked={backupSaved}
                  onChange={(e) => setBackupSaved(e.target.checked)}
                />
                Я сохранил резервные коды в надёжном месте
              </label>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-3 py-1">
              <OtpInput
                value={confirmCode}
                onChange={setConfirmCode}
                disabled={busy}
                autoFocus
              />
            </div>
          )}

          {step === "done" && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              <ShieldCheck className="size-5 shrink-0" />
              Защита аккаунта активна. Храните резервные коды отдельно от пароля.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {step === "intro" && (
              <>
                <Button type="button" variant="outline" onClick={() => closeSetup(false)}>
                  Отмена
                </Button>
                <Button type="button" disabled={busy} onClick={() => void goToScan()}>
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  Начать
                </Button>
              </>
            )}
            {step === "scan" && (
              <>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setStep("intro")}>
                  Назад
                </Button>
                <Button type="button" onClick={() => setStep("backup")}>
                  Далее
                </Button>
              </>
            )}
            {step === "backup" && (
              <>
                <Button type="button" variant="outline" onClick={() => setStep("scan")}>
                  Назад
                </Button>
                <Button type="button" disabled={!backupSaved} onClick={() => setStep("confirm")}>
                  Далее
                </Button>
              </>
            )}
            {step === "confirm" && (
              <>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setStep("backup")}>
                  Назад
                </Button>
                <Button
                  type="button"
                  disabled={busy || confirmCode.length < 6}
                  onClick={() => void confirmSetup()}
                >
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  Подтвердить
                </Button>
              </>
            )}
            {step === "done" && (
              <Button type="button" className="w-full" onClick={() => closeSetup(false)}>
                Готово
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open)
          if (!open) {
            setDisablePassword("")
            setDisableCode("")
          }
        }}
      >
        <DialogContent className={cn("rounded-2xl sm:max-w-md", compact && "max-w-sm")}>
          <DialogHeader>
            <DialogTitle>Отключить 2FA</DialogTitle>
            <DialogDescription>
              Для отключения нужны пароль и код из приложения.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="Текущий пароль"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
            <OtpInput
              value={disableCode}
              onChange={setDisableCode}
              disabled={busy}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setDisableOpen(false)}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || !disablePassword || disableCode.length < 6}
              onClick={() => void disable()}
            >
              {busy ? <Loader2 className="animate-spin" /> : null}
              Отключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSurface>
  )
}
