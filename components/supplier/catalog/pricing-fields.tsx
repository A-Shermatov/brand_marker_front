"use client"

import { PlusIcon as Plus, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { PricingType } from "@/types"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  parseBoundedInt,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"

export type PricingTierRow = {
  min_qty: number
  price: number
}

export type PricingFieldValues = {
  pricing_type: PricingType
  currency: string
  fixed_price: string
  hourly_rate: string
  monthly_rate: string
  tiers: PricingTierRow[]
}

type PricingFieldsProps = {
  values: PricingFieldValues
  onChange: (values: PricingFieldValues) => void
  errors?: Record<string, string>
}

const MODE_CARDS: Array<{
  type: PricingType
  title: string
  subtitle: string
}> = [
  {
    type: "tiered",
    title: "Цена за объём",
    subtitle: "чем больше — тем дешевле",
  },
  {
    type: "fixed",
    title: "Одна цена",
    subtitle: "для любого количества",
  },
  {
    type: "hourly",
    title: "Почасовая",
    subtitle: "ставка за час работы",
  },
  {
    type: "monthly",
    title: "Ежемесячная",
    subtitle: "ставка за месяц",
  },
]

export const PricingFields = ({ values, onChange, errors }: PricingFieldsProps) => {
  const inputClass = (field: string) =>
    cn(
      "h-11 w-full rounded-lg border bg-white px-3 text-[14.5px] outline-none transition-all focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15",
      errors?.[field] ? "border-red-400" : "border-line",
    )

  const handleTierUpdate = (index: number, patch: Partial<PricingTierRow>) => {
    onChange({
      ...values,
      tiers: values.tiers.map((tier, i) =>
        i === index ? { ...tier, ...patch } : tier,
      ),
    })
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <span className="text-[14px] font-semibold">Как указать цену</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODE_CARDS.map((mode) => (
            <button
              key={mode.type}
              type="button"
              onClick={() => onChange({ ...values, pricing_type: mode.type })}
              className={cn(
                "rounded-xl border-2 p-3.5 text-left transition-colors",
                values.pricing_type === mode.type
                  ? "border-ink"
                  : "border-line hover:border-line-strong",
              )}
            >
              <b className="block text-[15px]">{mode.title}</b>
              <span className="text-[13px] text-mute">{mode.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[220px]">
        <label className="mb-1.5 block text-[13.5px] font-semibold">Валюта</label>
        <select
          value={values.currency}
          onChange={(e) => onChange({ ...values, currency: e.target.value })}
          className={inputClass("currency")}
        >
          <option value="TJS">TJS</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </div>

      {values.pricing_type === "fixed" && (
        <div className="max-w-[220px]">
          <label className="mb-1.5 block text-[13.5px] font-semibold">
            Цена, {values.currency} *
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={MAX_NUMERIC_INPUT_LENGTH}
            value={values.fixed_price}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value)
              if (next === null) return
              onChange({ ...values, fixed_price: next })
            }}
            className={inputClass("fixed_price")}
          />
          {errors?.fixed_price ? (
            <p className="mt-1 text-[13px] text-red-600">{errors.fixed_price}</p>
          ) : null}
        </div>
      )}

      {values.pricing_type === "hourly" && (
        <div className="max-w-[220px]">
          <label className="mb-1.5 block text-[13.5px] font-semibold">
            Ставка в час, {values.currency} *
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={MAX_NUMERIC_INPUT_LENGTH}
            value={values.hourly_rate}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value)
              if (next === null) return
              onChange({ ...values, hourly_rate: next })
            }}
            className={inputClass("hourly_rate")}
          />
          {errors?.hourly_rate ? (
            <p className="mt-1 text-[13px] text-red-600">{errors.hourly_rate}</p>
          ) : null}
        </div>
      )}

      {values.pricing_type === "monthly" && (
        <div className="max-w-[220px]">
          <label className="mb-1.5 block text-[13.5px] font-semibold">
            Ставка в месяц, {values.currency} *
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={MAX_NUMERIC_INPUT_LENGTH}
            value={values.monthly_rate}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value)
              if (next === null) return
              onChange({ ...values, monthly_rate: next })
            }}
            className={inputClass("monthly_rate")}
          />
          {errors?.monthly_rate ? (
            <p className="mt-1 text-[13px] text-red-600">{errors.monthly_rate}</p>
          ) : null}
        </div>
      )}

      {values.pricing_type === "tiered" && (
        <div className="grid gap-2">
          <div className="overflow-hidden rounded-xl border border-line">
            <div className="grid grid-cols-[1fr_1fr_40px] gap-2 bg-canvas px-3 py-2 text-[13px] font-semibold text-mute">
              <span>От, шт</span>
              <span>Цена, {values.currency}</span>
              <span />
            </div>
            {values.tiers.map((tier, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_40px] gap-2 border-t border-line px-3 py-2"
              >
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={MAX_NUMERIC_INPUT_LENGTH}
                  value={tier.min_qty || ""}
                  onChange={(e) => {
                    const next = parseBoundedInt(e.currentTarget.value, {
                      min: 1,
                      emptyAs: 1,
                    })
                    if (next === null) return
                    handleTierUpdate(index, { min_qty: next })
                  }}
                  className={cn(inputClass(`tier-qty-${index}`), "!h-10")}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={MAX_NUMERIC_INPUT_LENGTH}
                  value={tier.price || ""}
                  onChange={(e) => {
                    const next = parseBoundedInt(e.currentTarget.value, {
                      min: 0,
                      emptyAs: 0,
                    })
                    if (next === null) return
                    handleTierUpdate(index, { price: next })
                  }}
                  className={cn(inputClass(`tier-price-${index}`), "!h-10")}
                />
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...values,
                      tiers: values.tiers.filter((_, i) => i !== index),
                    })
                  }
                  className={cn(
                    "grid place-items-center text-mute hover:text-red-600",
                    values.tiers.length < 2 && "invisible",
                  )}
                  aria-label="Удалить ступень"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ))}
            {values.tiers.length < 5 ? (
              <div className="border-t border-line px-3 py-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...values,
                      tiers: [...values.tiers, { min_qty: 1, price: 0 }],
                    })
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[14px] font-semibold text-brand-700 hover:bg-brand-50"
                >
                  <Plus className="size-4" aria-hidden />
                  Добавить ступень
                </button>
              </div>
            ) : null}
          </div>
          {errors?.tiers ? (
            <p className="text-[13px] text-red-600">{errors.tiers}</p>
          ) : (
            <p className="text-[13px] text-mute">
              До 5 ступеней. Каждая следующая — больше количество и не выше цена.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
