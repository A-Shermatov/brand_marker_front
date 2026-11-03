"use client"

import { useState } from "react"
import { ArrowLineDownIcon as ArrowDownToLine, BuildingsIcon as Building2, WalletIcon as Wallet } from "@phosphor-icons/react/dist/ssr"
import type { SupplierBalanceSummary, WithdrawalBank, WithdrawalDestination } from "@/types"
import { withdrawalBankLabel } from "@/lib/finance-display"
import { formatCurrency } from "@/lib/format"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"
import { cn } from "@/lib/utils"

type WithdrawalFormProps = {
  destinations: WithdrawalDestination[]
  balances: SupplierBalanceSummary
  onSubmit: (input: {
    destinationId: number
    amount: number
    bank: WithdrawalBank
  }) => RequestWithdrawalResult | Promise<RequestWithdrawalResult>
}

type RequestWithdrawalResult =
  | { ok: true }
  | { ok: false; error: string }

const BANK_OPTIONS: {
  id: WithdrawalBank
  available: boolean
  hint: string
}[] = [
  { id: "alif", available: true, hint: "Выплата через Alif" },
  { id: "dc", available: false, hint: "Пока недоступно" },
  { id: "eskhata", available: false, hint: "Пока недоступно" },
]

export const WithdrawalForm = ({
  destinations,
  balances,
  onSubmit,
}: WithdrawalFormProps) => {
  const defaultDestination =
    destinations.find((d) => d.is_default) ?? destinations[0]
  const [destinationId, setDestinationId] = useState(
    defaultDestination?.id ?? 0,
  )
  const selectedDestinationId = destinationId || defaultDestination?.id || 0
  const [bank, setBank] = useState<WithdrawalBank>("alif")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [busy, setBusy] = useState(false)

  const handleSubmit = async () => {
    setError("")
    setSuccess("")
    if (!BANK_OPTIONS.find((b) => b.id === bank)?.available) {
      setError(`Вывод через ${withdrawalBankLabel(bank)} пока недоступен`)
      return
    }
    const parsed = Number(amount.replace(/\s/g, "").replace(",", "."))
    setBusy(true)
    try {
      const result = await onSubmit({
        destinationId: selectedDestinationId,
        amount: parsed,
        bank,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setAmount("")
      setSuccess(`Заявка на вывод через ${withdrawalBankLabel(bank)} создана`)
    } finally {
      setBusy(false)
    }
  }

  if (destinations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Добавьте счёт для выплат, чтобы выводить деньги
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[12.5px] font-medium text-muted-foreground">
          Банк
        </p>
        <div
          className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3"
          role="radiogroup"
          aria-label="Банк для вывода"
        >
          {BANK_OPTIONS.map((option) => {
            const selected = bank === option.id
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={!option.available}
                disabled={!option.available}
                onClick={() => option.available && setBank(option.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  option.available
                    ? selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary/50"
                    : "cursor-not-allowed border-border bg-secondary/30 opacity-70",
                )}
              >
                <span className="block text-sm font-semibold text-foreground">
                  {withdrawalBankLabel(option.id)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs",
                    option.available ? "text-muted-foreground" : "text-mute",
                  )}
                >
                  {option.hint}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[12.5px] text-mute">
          Сейчас доступен только Alif. DC и Eskhata появятся позже.
        </p>
      </div>

      <div>
        <label
          htmlFor="withdrawal-destination"
          className="text-[12.5px] font-medium text-muted-foreground"
        >
          Счёт / кошелёк
        </label>
        <div className="mt-2 space-y-2">
          {destinations.map((destination) => {
            const isSelected = selectedDestinationId === destination.id
            const Icon = destination.type === "bank" ? Building2 : Wallet
            return (
              <button
                key={destination.id}
                type="button"
                onClick={() => setDestinationId(destination.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary/50",
                )}
                aria-pressed={isSelected}
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {destination.label}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {destination.details}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="withdrawal-amount"
          className="text-[12.5px] font-medium text-muted-foreground"
        >
          Сумма
        </label>
        <div className="mt-2 flex gap-2">
          <input
            maxLength={MAX_NUMERIC_INPUT_LENGTH}
            id="withdrawal-amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value)
              if (next === null) return
              setAmount(next)
            }}
            placeholder="0"
            aria-label="Сумма вывода"
            className="h-11 flex-1 rounded-xl border border-input bg-card px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => {
              const capped = sanitizeDigitInput(
                String(Math.floor(Math.max(0, balances.available))),
              )
              if (capped !== null) setAmount(capped)
            }}
            className="h-11 whitespace-nowrap rounded-xl border border-border px-3 text-xs font-semibold transition-colors hover:bg-secondary"
          >
            Максимум
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Доступно: {formatCurrency(balances.available, balances.currency)}
        </p>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-xs font-medium text-primary">{success}</p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={balances.available <= 0 || busy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <ArrowDownToLine size={16} />
        Вывести через {withdrawalBankLabel(bank)}
      </button>
    </div>
  )
}
