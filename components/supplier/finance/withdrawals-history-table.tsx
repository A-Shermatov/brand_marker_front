"use client"

import { BankIcon } from "@phosphor-icons/react/dist/ssr"
import { statusPillClass } from "@/components/ui/status-badge"
import {
  CardFact,
  CardLine,
  CardList,
  CardMeta,
  ListCard,
  ListCardBody,
} from "@/components/layout/card-list"
import type { Withdrawal, WithdrawalDestination } from "@/types"
import { withdrawalStatusMeta } from "@/lib/finance-display"
import { formatCurrency, formatIsoDateTime } from "@/lib/format"

type WithdrawalsHistoryTableProps = {
  withdrawals: Withdrawal[]
  getDestination: (id: number) => WithdrawalDestination | undefined
}

/** Payouts to the supplier's bank account: where, how much, how it went. */
export const WithdrawalsHistoryTable = ({ withdrawals, getDestination }: WithdrawalsHistoryTableProps) => {
  if (withdrawals.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">История выводов пуста</p>
  }
  return (
    <CardList label="Выводы денег">
      {withdrawals.map((withdrawal) => {
        const destination = getDestination(withdrawal.destination_id)
        const meta = withdrawalStatusMeta[withdrawal.status]
        return (
          <ListCard key={withdrawal.id}>
            <ListCardBody
              aside={
                <>
                  <CardFact label="Сумма" className="min-w-[130px]">
                    {formatCurrency(withdrawal.amount, withdrawal.currency)}
                  </CardFact>
                  <span className={`${statusPillClass} ${meta.className}`}>{meta.label}</span>
                </>
              }
            >
              <CardMeta>{formatIsoDateTime(withdrawal.completed_at || withdrawal.created_at)}</CardMeta>
              <span className="text-[15px] font-semibold text-ink">{destination?.label ?? "Счёт удалён"}</span>
              {destination?.details ? <CardLine icon={BankIcon}>{destination.details}</CardLine> : null}
            </ListCardBody>
          </ListCard>
        )
      })}
    </CardList>
  )
}
