"use client"

import { CheckCircleIcon, LightningIcon, ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr"
import type { PaymentMode } from "@/types"
import { cn } from "@/lib/utils"

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  escrow: "С гарантией",
  direct: "Оплатить сразу",
}

/** One line under the label, said the way the buyer will experience it. */
export const PAYMENT_MODE_HINT: Record<PaymentMode, string> = {
  escrow: "Банк‑партнёр держит деньги и переводит их поставщику после вашей приёмки. Если что‑то пойдёт не так — вернём.",
  direct: "Деньги сразу уходят поставщику. Подходит для проверенных партнёров: вернуть их через гарантию площадки будет нельзя.",
}

const OPTIONS: { value: PaymentMode; Icon: typeof ShieldCheckIcon; badge?: string }[] = [
  { value: "escrow", Icon: ShieldCheckIcon, badge: "Рекомендуем" },
  { value: "direct", Icon: LightningIcon },
]

/**
 * How the buyer pays: through the bank hold (the platform's guarantee) or
 * straight to the supplier. Two cards, one picked.
 */
export function PaymentModeChoice({
  value,
  onChange,
  className,
  label = "Способ оплаты",
  stacked = false,
}: {
  value: PaymentMode
  onChange: (value: PaymentMode) => void
  className?: string
  label?: string
  /** One card under the other, for narrow places. */
  stacked?: boolean
}) {
  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend className="mb-2 text-[14px] font-semibold text-ink">{label}</legend>
      <div role="radiogroup" aria-label={label} className={cn("grid gap-2", !stacked && "sm:grid-cols-2")}>
        {OPTIONS.map(({ value: option, Icon, badge }) => {
          const checked = value === option
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option)}
              className={cn(
                "relative grid content-start gap-1.5 rounded-xl border p-3.5 text-left transition-colors",
                checked
                  ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
                  : "border-line bg-card hover:border-line-strong",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon
                  weight={checked ? "fill" : "regular"}
                  className={cn("size-5 shrink-0", option === "escrow" ? "text-safe-500" : "text-amber-600")}
                  aria-hidden
                />
                <b className="text-[14.5px] font-semibold text-ink">{PAYMENT_MODE_LABEL[option]}</b>
                {badge ? (
                  <span className="rounded-md bg-safe-50 px-1.5 py-0.5 text-[11px] font-semibold text-safe-700">
                    {badge}
                  </span>
                ) : null}
                {checked ? (
                  <CheckCircleIcon weight="fill" className="ml-auto size-5 text-brand-600" aria-hidden />
                ) : null}
              </span>
              <span className="text-[12.5px] leading-snug text-mute">{PAYMENT_MODE_HINT[option]}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** A small mark of how a deal or a request is paid. */
export function PaymentModeBadge({ mode, className }: { mode?: PaymentMode | null; className?: string }) {
  const direct = mode === "direct"
  const Icon = direct ? LightningIcon : ShieldCheckIcon
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-semibold",
        direct ? "bg-amber-50 text-amber-700" : "bg-safe-50 text-safe-700",
        className,
      )}
      title={PAYMENT_MODE_HINT[direct ? "direct" : "escrow"]}
    >
      <Icon weight="fill" className="size-3.5" aria-hidden />
      {direct ? "Оплата сразу" : "С гарантией"}
    </span>
  )
}
