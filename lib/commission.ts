import type { PlatformSettingsInput } from "@/lib/api/public"

export const COMMISSION_CURRENCY = "TJS"

const roundMoney = (value: number) => Math.round(value * 100) / 100

const isCommissionCurrency = (currency: string) =>
  currency.toUpperCase() === COMMISSION_CURRENCY

/** Mirrors the backend marketplace_commission: each bank-split part must be >= minPart. */
const bankSplittable = (amount: number, commission: number, minPart: number): number => {
  if (minPart <= 0 || commission <= 0 || commission >= amount) return commission
  if (amount < 2 * minPart) return 0
  return Math.min(Math.max(commission, minPart), amount - minPart)
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
  return roundMoney(
    isCommissionCurrency(currency)
      ? bankSplittable(amount, commission, settings.min_payment_part ?? 0)
      : commission,
  )
}

export const exceedsContractLimit = (
  amount: number,
  currency: string,
  settings: Pick<PlatformSettingsInput, "max_contract_amount">,
): boolean =>
  settings.max_contract_amount != null
  && isCommissionCurrency(currency)
  && amount > settings.max_contract_amount
