import type { PaymentType, PaymentMilestoneTrigger } from "@/types"

export const paymentTypeMeta: Record<
  PaymentType,
  { label: string; description: string }
> = {
  full_prepayment: {
    label: "Полная предоплата",
    description: "Вся сумма вносится при подписании и хранится под защитой до приёмки.",
  },
  split_payment: {
    label: "50% / 50%",
    description: "Половина при подписании, остаток после приёмки работы.",
  },
  milestone: {
    label: "По этапам",
    description: "Несколько этапов с собственными суммами и условиями оплаты.",
  },
  full_postpayment: {
    label: "Гарантия сделки",
    description: "Вы оплачиваете всю сумму, банк удерживает её и переводит исполнителю после вашей приёмки.",
  },
}

export const PAYMENT_TYPE_ORDER: PaymentType[] = [
  "full_postpayment",
]

export const milestoneTriggerLabel: Record<PaymentMilestoneTrigger, string> = {
  contract_signed: "При подписании",
  delivery_accepted: "После приёмки",
}
