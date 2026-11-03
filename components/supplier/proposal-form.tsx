"use client"

import { useEffect, useState } from "react"
import { PaperPlaneRightIcon as Send } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { InlineHint } from "@/components/process"
import { usePlatformSettingsQuery } from "@/hooks/api/use-public-query"
import { calculateCommission, exceedsContractLimit } from "@/lib/commission"
import { cn } from "@/lib/utils"
import { formatCurrency, formatRfqBudget } from "@/lib/format"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"
import type { BudgetType, Currency } from "@/types"

export type ProposalFormValues = {
  price: number
  delivery_time: string
  message: string
}

type ProposalFormProps = {
  currency: Currency | string
  budgetType: BudgetType
  budgetFrom: number | null
  budgetTo: number | null
  defaultPrice?: number | null
  defaultDeliveryTime?: string | null
  defaultMessage?: string | null
  /** When true, fetch platform settings (dialog open / always for inline). */
  active?: boolean
  submitLabel?: string
  onSubmit: (values: ProposalFormValues) => void
  onCancel?: () => void
  variant?: "dialog" | "panel"
  className?: string
}

export const ProposalForm = ({
  currency,
  budgetType,
  budgetFrom,
  budgetTo,
  defaultPrice,
  defaultDeliveryTime,
  defaultMessage,
  active = true,
  submitLabel = "Отправить КП",
  onSubmit,
  onCancel,
  variant = "dialog",
  className,
}: ProposalFormProps) => {
  const [price, setPrice] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: platformSettings } = usePlatformSettingsQuery(active)
  const priceValue = Number(price)
  const hasValidPrice = Boolean(price) && Number.isFinite(priceValue) && priceValue > 0
  const commission =
    platformSettings && hasValidPrice
      ? calculateCommission(priceValue, currency, platformSettings)
      : null

  useEffect(() => {
    if (!active) return
    const initialPrice = defaultPrice ?? budgetFrom ?? budgetTo ?? 0
    setPrice(initialPrice > 0 ? String(initialPrice) : "")
    setDeliveryTime(defaultDeliveryTime?.trim() || "")
    setMessage(defaultMessage ?? "")
    setErrors({})
  }, [
    active,
    defaultPrice,
    defaultDeliveryTime,
    defaultMessage,
    budgetFrom,
    budgetTo,
  ])

  const handleConfirm = () => {
    const e: Record<string, string> = {}
    const priceNum = Number(price)
    const daysNum = Number(deliveryTime)
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      e.price = "Укажите цену"
    } else if (priceNum > 1_000_000_000_000) {
      e.price = "Цена не больше 1 трлн"
    } else if (
      platformSettings &&
      exceedsContractLimit(priceNum, currency, platformSettings)
    ) {
      e.price = `Сумма сделки не может превышать ${formatCurrency(platformSettings.max_contract_amount ?? 0, currency)}`
    }
    if (!deliveryTime.trim() || Number.isNaN(daysNum) || daysNum <= 0) {
      e.delivery_time = "Срок должен быть больше 0"
    } else if (!Number.isInteger(daysNum) || daysNum > 3650) {
      e.delivery_time = "Срок от 1 до 3650 дней"
    }
    if (message.trim().length < 10) {
      e.message = "Комментарий от 10 символов"
    }
    setErrors(e)
    if (Object.keys(e).length > 0) return

    onSubmit({
      price: priceNum,
      delivery_time: String(daysNum),
      message: message.trim(),
    })
  }

  const inputClass = (field: string) =>
    cn(
      "h-11 w-full rounded-lg border bg-white px-3.5 text-[15px] outline-none transition-[color,border-color] mono",
      errors[field]
        ? "border-red-500"
        : "border-line focus:border-brand-600",
    )

  const budgetHint = formatRfqBudget(budgetType, budgetFrom, budgetTo, currency)

  const fields = (
    <>
      <div>
        <label
          htmlFor="pf-price"
          className="mb-1.5 block text-[13.5px] font-medium text-ink"
        >
          Цена, {currency}
        </label>
        <input
          maxLength={MAX_NUMERIC_INPUT_LENGTH}
          id="pf-price"
          type="text"
          inputMode="numeric"
          value={price}
          onChange={(e) => {
            const next = sanitizeDigitInput(e.currentTarget.value)
            if (next === null) return
            setPrice(next)
          }}
          className={inputClass("price")}
        />
        {errors.price ? (
          <p className="mt-1 text-xs text-red-700">{errors.price}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="pf-delivery"
            className="mb-1.5 block text-[13.5px] font-medium text-ink"
          >
            Срок, дней
          </label>
          <input
            maxLength={4}
            id="pf-delivery"
            type="text"
            inputMode="numeric"
            value={deliveryTime}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value, {
                max: 3650,
                maxLength: 4,
              })
              if (next === null) return
              setDeliveryTime(next)
            }}
            placeholder="14"
            className={inputClass("delivery_time")}
          />
          {errors.delivery_time ? (
            <p className="mt-1 text-xs text-red-700">{errors.delivery_time}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1.5 block text-[13.5px] font-medium text-ink">
            Валюта
          </label>
          <input
            maxLength={50}
            type="text"
            value={currency}
            readOnly
            className="h-11 w-full rounded-lg border border-line bg-canvas px-3.5 text-[15px] text-mute"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="pf-message"
          className="mb-1.5 block text-[13.5px] font-medium text-ink"
        >
          Комментарий для покупателя
        </label>
        <textarea
          id="pf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Модели, что входит в цену, условия доставки"
          className={cn(
            "w-full resize-none rounded-lg border bg-white px-3.5 py-3 text-[15px] outline-none",
            errors.message
              ? "border-red-500"
              : "border-line focus:border-brand-600",
          )}
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-700">{errors.message}</p>
        ) : null}
      </div>

      <div className="grid gap-1 border-t border-line pt-3 text-[14px]">
        <div className="flex justify-between gap-3">
          <span className="text-mute">Сумма КП</span>
          <b className="mono">
            {hasValidPrice ? formatCurrency(priceValue, currency) : "—"}
          </b>
        </div>
        {commission !== null && platformSettings ? (
          <div className="flex justify-between gap-3">
            <span className="text-mute">
              Вы получите (−{platformSettings.commission_percent}%)
            </span>
            <b className="mono text-safe-700">
              {formatCurrency(priceValue - commission, currency)}
            </b>
          </div>
        ) : null}
        <div className="text-[12.5px] text-mute">
          Бюджет покупателя: {budgetHint}
        </div>
      </div>

      <InlineHint variant="warning" className="p-3 text-xs">
        Не указывайте телефоны и реквизиты — общение и оплата только через
        площадку.
      </InlineHint>
    </>
  )

  if (variant === "panel") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-brand-500 bg-white",
          className,
        )}
      >
        <div className="bg-brand-500 px-5 py-2 text-[12.5px] font-medium text-white">
          Коммерческое предложение
        </div>
        <div className="grid gap-4 p-5">
          {fields}
          <Button type="button" className="w-full" onClick={handleConfirm}>
            <Send size={16} /> {submitLabel}
          </Button>
          {onCancel ? (
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
              Отмена
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("grid gap-3", className)}>
      {fields}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
        <Button type="button" onClick={handleConfirm}>
          <Send size={16} /> {submitLabel}
        </Button>
      </div>
    </div>
  )
}
