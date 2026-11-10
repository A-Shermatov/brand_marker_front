"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CircleNotchIcon as Loader2, LockIcon as Lock, ArrowsCounterClockwiseIcon as RefreshCcw, GearIcon as Settings } from "@phosphor-icons/react/dist/ssr"
import { ChangePasswordCard } from "@/components/auth/change-password-card"
import { TwoFactorSettings } from "@/components/auth/two-factor-settings"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  useAdminSettingsQuery,
  useUpdateAdminSettingsMutation,
} from "@/hooks/api/use-admin-settings-query"
import type { AdminPlatformSettings } from "@/lib/api/admin"
import type { PlatformSettingsInput } from "@/lib/api/public"
import { calculateCommission, COMMISSION_CURRENCY, exceedsContractLimit } from "@/lib/commission"
import { formatCurrency } from "@/lib/format"
import {
  MAX_NUMERIC_INPUT,
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"

const EXAMPLE_AMOUNTS = [1_000, 10_000, 100_000]

type SettingsForm = {
  percent: string
  minimum: string
  limit: string
  hasLimit: boolean
}

type ParsedSettings = {
  value: PlatformSettingsInput | null
  errors: Partial<Record<"percent" | "minimum" | "limit", string>>
}

const toForm = (settings: AdminPlatformSettings): SettingsForm => ({
  percent: String(settings.commission_percent),
  minimum: String(settings.commission_min),
  limit: settings.max_contract_amount != null ? String(settings.max_contract_amount) : "",
  hasLimit: settings.max_contract_amount != null,
})

const parseNumber = (value: string) => {
  const normalized = value.replace(/\s/g, "").replace(",", ".")
  if (!normalized) return Number.NaN
  return Number(normalized)
}

const parseForm = (form: SettingsForm): ParsedSettings => {
  const errors: ParsedSettings["errors"] = {}
  const percent = parseNumber(form.percent)
  const minimum = parseNumber(form.minimum)
  const limit = form.hasLimit ? parseNumber(form.limit) : null

  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    errors.percent = "Укажите процент от 0 до 100"
  }
  if (!Number.isFinite(minimum) || minimum < 0) {
    errors.minimum = "Минимум не может быть отрицательным"
  }
  if (
    limit !== null &&
    (!Number.isFinite(limit) || limit <= 0 || limit > MAX_NUMERIC_INPUT)
  ) {
    errors.limit =
      limit != null && limit > MAX_NUMERIC_INPUT
        ? `Лимит не больше ${MAX_NUMERIC_INPUT.toLocaleString("ru-RU")}`
        : "Лимит должен быть больше нуля"
  }
  if (Number.isFinite(minimum) && minimum > MAX_NUMERIC_INPUT) {
    errors.minimum = `Минимум не больше ${MAX_NUMERIC_INPUT.toLocaleString("ru-RU")}`
  }
  if (Object.keys(errors).length > 0) return { value: null, errors }
  return {
    value: {
      commission_percent: percent,
      commission_min: minimum,
      max_contract_amount: limit,
    },
    errors,
  }
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const SettingsSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка настроек">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-80 rounded-xl bg-muted" />
  </PageFrame>
)

const FieldError = ({ id, message }: { id: string; message?: string }) => {
  if (!message) return null
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

const CommissionExamples = ({ settings }: { settings: PlatformSettingsInput | null }) => (
  <PageSurface className="p-6">
    <h2 className="text-base font-bold text-foreground">Пример расчёта</h2>
    <p className="mt-1 text-sm text-muted-foreground">
      Комиссия = максимум из минимальной суммы и процента от суммы договора.
      Она делится между этапами пропорционально их суммам.
    </p>
    {settings ? (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-105 text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[12.5px] font-medium text-muted-foreground">
              <th className="py-2 pr-4 font-semibold">Сумма договора</th>
              <th className="py-2 pr-4 font-semibold">Комиссия</th>
              <th className="py-2 font-semibold">Поставщик получит</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_AMOUNTS.map((amount) => {
              const blocked = exceedsContractLimit(amount, COMMISSION_CURRENCY, settings)
              const commission = calculateCommission(amount, COMMISSION_CURRENCY, settings)
              return (
                <tr key={amount} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4 font-medium">
                    {formatCurrency(amount, COMMISSION_CURRENCY)}
                  </td>
                  {blocked ? (
                    <td colSpan={2} className="py-2.5 text-destructive">
                      Превышает лимит договора
                    </td>
                  ) : (
                    <>
                      <td className="py-2.5 pr-4">{formatCurrency(commission, COMMISSION_CURRENCY)}</td>
                      <td className="py-2.5">
                        {formatCurrency(amount - commission, COMMISSION_CURRENCY)}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="mt-4 text-sm text-muted-foreground">
        Исправьте значения в форме, чтобы увидеть расчёт.
      </p>
    )}
    <p className="mt-4 text-xs text-muted-foreground">
      Минимальная комиссия и лимит применяются к договорам в {COMMISSION_CURRENCY}.
      Для других валют берётся только процент. Изменения действуют для новых договоров.
    </p>
  </PageSurface>
)

const SettingsFormCard = ({ settings }: { settings: AdminPlatformSettings }) => {
  const [form, setForm] = useState<SettingsForm>(() => toForm(settings))
  const [submitted, setSubmitted] = useState(false)
  const updateMutation = useUpdateAdminSettingsMutation()
  const readOnly = !settings.can_update
  const parsed = useMemo(() => parseForm(form), [form])
  const errors = submitted ? parsed.errors : {}

  useEffect(() => {
    setForm(toForm(settings))
  }, [settings])

  const handleChange = (field: "percent" | "minimum" | "limit") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.currentTarget.value
      const next =
        field === "percent"
          ? sanitizeDigitInput(raw, { max: 100, maxLength: 3 })
          : sanitizeDigitInput(raw)
      if (next === null) return
      setForm((current) => ({ ...current, [field]: next }))
    }

  const handleLimitToggle = (checked: boolean) =>
    setForm((current) => ({ ...current, hasLimit: checked }))

  const handleReset = () => {
    setForm(toForm(settings))
    setSubmitted(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (readOnly || !parsed.value) return
    updateMutation.mutate(parsed.value, { onSuccess: () => setSubmitted(false) })
  }

  const inputClassName = "h-11"

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <PageSurface className="p-6">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-label="Настройки комиссии">
          <div>
            <h2 className="text-base font-bold text-foreground">Комиссия и лимиты</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Удерживается с поставщика при выплате каждого этапа.
            </p>
          </div>

          {readOnly && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
              <Lock size={16} aria-hidden="true" />
              У вас есть доступ только на просмотр
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="commission-percent">Процент комиссии, %</Label>
            <Input
              maxLength={3}
              id="commission-percent"
              type="text"
              inputMode="numeric"
              value={form.percent}
              onChange={handleChange("percent")}
              disabled={readOnly}
              aria-invalid={Boolean(errors.percent)}
              aria-describedby={errors.percent ? "commission-percent-error" : undefined}
              className={inputClassName}
            />
            <FieldError id="commission-percent-error" message={errors.percent} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission-min">Минимальная комиссия, {COMMISSION_CURRENCY}</Label>
            <Input
              maxLength={MAX_NUMERIC_INPUT_LENGTH}
              id="commission-min"
              type="text"
              inputMode="numeric"
              value={form.minimum}
              onChange={handleChange("minimum")}
              disabled={readOnly}
              aria-invalid={Boolean(errors.minimum)}
              aria-describedby={errors.minimum ? "commission-min-error" : undefined}
              className={inputClassName}
            />
            <FieldError id="commission-min-error" message={errors.minimum} />
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="contract-limit-toggle" className="cursor-pointer">
                Максимальная сумма договора
              </Label>
              <Switch
                id="contract-limit-toggle"
                checked={form.hasLimit}
                onCheckedChange={handleLimitToggle}
                disabled={readOnly}
              />
            </div>
            {form.hasLimit ? (
              <div className="space-y-2">
                <Label htmlFor="contract-limit" className="sr-only">
                  Лимит суммы договора, {COMMISSION_CURRENCY}
                </Label>
                <Input
                  maxLength={MAX_NUMERIC_INPUT_LENGTH}
                  id="contract-limit"
                  type="text"
                  inputMode="numeric"
                  value={form.limit}
                  onChange={handleChange("limit")}
                  disabled={readOnly}
                  placeholder={`Например, 500000 ${COMMISSION_CURRENCY}`}
                  aria-invalid={Boolean(errors.limit)}
                  aria-describedby={errors.limit ? "contract-limit-error" : undefined}
                  className={inputClassName}
                />
                <FieldError id="contract-limit-error" message={errors.limit} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Без ограничения</p>
            )}
          </div>

          {!readOnly && (
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Сохранить
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={updateMutation.isPending}
              >
                Сбросить
              </Button>
            </div>
          )}

          {settings.updated_at && (
            <p className="text-xs text-muted-foreground">
              Обновлено {formatDateTime(settings.updated_at)}
              {settings.updated_by_name ? ` · ${settings.updated_by_name}` : ""}
            </p>
          )}
        </form>
      </PageSurface>

      <CommissionExamples settings={parsed.value} />
    </div>
  )
}

export default function AdminSettingsPage() {
  const settingsQuery = useAdminSettingsQuery()

  if (settingsQuery.isLoading) return <SettingsSkeleton />

  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Settings className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить настройки</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и права доступа.
          </p>
          <Button type="button" className="mt-5" onClick={() => settingsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Настройки платформы"
        description="Комиссия за договор и максимальная сумма договора"
      />
      <div className="space-y-6">
        <ChangePasswordCard />
        <TwoFactorSettings />
        <SettingsFormCard settings={settingsQuery.data} />
      </div>
    </PageFrame>
  )
}
