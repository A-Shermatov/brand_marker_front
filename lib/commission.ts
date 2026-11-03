import type { PlatformSettingsInput } from "@/lib/api/public"

export const COMMISSION_CURRENCY = "TJS"

const roundMoney = (value: number) => Math.round(value * 100) / 100

const isCommissionCurrency = (currency: string) =>
  currency.toUpperCase() === COMMISSION_CURRENCY

/** The bank rejects any part of a split TJS payment below 1 TJS (mirrors the backend). */
const MIN_PAYMENT_PART = 1

const bankSplittable = (amount: number, commission: number): number => {
  if (commission <= 0 || commission >= amount) return commission
  if (amount < 2 * MIN_PAYMENT_PART) return 0
  return Math.min(Math.max(commission, MIN_PAYMENT_PART), amount - MIN_PAYMENT_PART)
}

export const calculateCommission = (
  amount: number,
  currency: string,
  settings: PlatformSettingsInput,
): number => {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  const minimum = isCommissionCurrency(currency) ? settings.commission_min : 0
  const commission = Math.min(
    Math.max(minimum, (amount * settings.commission_percent) / 100),
    amount,
  )
  return roundMoney(isCommissionCurrency(currency) ? bankSplittable(amount, commission) : commission)
}

export const exceedsContractLimit = (
  amount: number,
  currency: string,
  settings: Pick<PlatformSettingsInput, "max_contract_amount">,
): boolean =>
  settings.max_contract_amount != null
  && isCommissionCurrency(currency)
  && amount > settings.max_contract_amount
