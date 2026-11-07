"use client"

import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr"
import { statusPillClass } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import {
  CardAction,
  CardFact,
  CardLine,
  CardList,
  CardTitle,
  ListCard,
  ListCardBody,
} from "@/components/layout/card-list"
import type { EscrowFundingRow } from "@/lib/buyer-payments-display"
import { milestoneStatusMeta } from "@/lib/contract-display"
import { formatCurrency } from "@/lib/format"
import type { PaymentMilestoneStatus } from "@/types"
import {
  ALIF_PAY_LABEL,
  AlifBadge,
  isAlifCurrencySupported,
} from "@/components/cabinet/payments/alif-payment-note"

type EscrowFundingTableProps = {
  rows: EscrowFundingRow[]
  getSupplierName: (supplierActorId: number) => string
  viaAlif?: boolean
  alifCurrency?: string | null
  onFund: (row: EscrowFundingRow) => void
}

/** Stages waiting for payment, as cards with the amount and a pay button. */
export const EscrowFundingTable = ({
  rows,
  getSupplierName,
  viaAlif = false,
  alifCurrency = null,
  onFund,
}: EscrowFundingTableProps) => {
  const payLabel = viaAlif ? ALIF_PAY_LABEL : "Оплатить безопасно"
  const canPay = (row: EscrowFundingRow) => isAlifCurrencySupported(viaAlif, alifCurrency, row.currency)

  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Нет этапов, ожидающих оплаты</p>
  }

  return (
    <CardList label="Этапы к оплате">
      {rows.map((row) => {
        const meta = milestoneStatusMeta[row.status as PaymentMilestoneStatus]
        return (
          <ListCard key={`${row.contractId}-${row.milestoneId}`} tone="brand">
            <ListCardBody
              aside={
                <>
                  <CardFact label="К оплате" className="min-w-[130px]">
                    <span className="inline-flex items-center gap-2">
                      {formatCurrency(row.amount, row.currency)}
                      {viaAlif ? <AlifBadge /> : null}
                    </span>
                  </CardFact>
                  <span className={`${statusPillClass} ${meta.className}`}>{meta.label}</span>
                  <CardAction>
                    <Button
                      size="sm"
                      onClick={() => onFund(row)}
                      disabled={!canPay(row)}
                      title={canPay(row) ? undefined : `Оплата через Alif доступна только в ${alifCurrency}`}
                    >
                      {payLabel}
                    </Button>
                  </CardAction>
                </>
              }
            >
              <CardTitle href={`/customer/contracts/${row.contractId}`}>{row.contractTitle}</CardTitle>
              <CardLine icon={BuildingsIcon}>
                {getSupplierName(row.supplierActorId)}
                <span className="text-mute">· этап «{row.title}»</span>
              </CardLine>
            </ListCardBody>
          </ListCard>
        )
      })}
    </CardList>
  )
}
