"use client"

import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr"
import {
  CardFact,
  CardLine,
  CardList,
  CardMeta,
  CardTitle,
  ListCard,
  ListCardBody,
  StatusPill,
  type CardTone,
} from "@/components/layout/card-list"
import type { OutgoingPaymentRow } from "@/lib/buyer-payments-display"
import { paymentHistoryTypeLabel } from "@/lib/buyer-payments-display"
import { formatCurrency, formatIsoDateTime } from "@/lib/format"

type OutgoingPaymentsTableProps = {
  payments: OutgoingPaymentRow[]
  getSupplierName: (supplierActorId: number) => string
}

/** Money into escrow is blue, money released to the supplier green, refunds amber. */
const TYPE_TONE: Record<OutgoingPaymentRow["type"], CardTone> = {
  funding: "brand",
  release: "safe",
  refund: "warn",
}

/** The buyer's payment history as cards: when, for which deal and stage, what kind, how much. */
export const OutgoingPaymentsTable = ({ payments, getSupplierName }: OutgoingPaymentsTableProps) => {
  if (payments.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Исходящих платежей пока нет</p>
  }
  return (
    <CardList label="Платежи">
      {payments.map((payment) => (
        <ListCard key={payment.id} tone={TYPE_TONE[payment.type]}>
          <ListCardBody
            aside={
              <>
                <StatusPill tone={TYPE_TONE[payment.type]}>{paymentHistoryTypeLabel[payment.type]}</StatusPill>
                <CardFact label="Сумма" className="min-w-[130px] md:text-right">
                  {formatCurrency(payment.amount, payment.currency)}
                </CardFact>
              </>
            }
          >
            <CardMeta>{formatIsoDateTime(payment.at)}</CardMeta>
            <CardTitle href={`/customer/contracts/${payment.contractId}`}>{payment.contractTitle}</CardTitle>
            <CardLine icon={BuildingsIcon}>
              {getSupplierName(payment.supplierActorId)}
              <span className="text-mute">· этап «{payment.title}»</span>
            </CardLine>
          </ListCardBody>
        </ListCard>
      ))}
    </CardList>
  )
}
