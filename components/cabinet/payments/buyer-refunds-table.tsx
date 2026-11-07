"use client"

import {
  CardFact,
  CardLine,
  CardList,
  CardMeta,
  CardTitle,
  ListCard,
  ListCardBody,
} from "@/components/layout/card-list"
import type { BuyerRefund } from "@/types"
import { formatCurrency, formatIsoDate } from "@/lib/format"

type BuyerRefundsTableProps = {
  refunds: BuyerRefund[]
  getContractTitle: (contractId: number) => string
}

/** Money returned to the buyer: which deal, why, how much. */
export const BuyerRefundsTable = ({ refunds, getContractTitle }: BuyerRefundsTableProps) => {
  if (refunds.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Возвратов пока нет</p>
  }
  return (
    <CardList label="Возвраты">
      {refunds.map((refund) => (
        <ListCard key={refund.id} tone="safe">
          <ListCardBody
            aside={
              <CardFact label="Вернули вам" className="min-w-[130px]">
                <span className="text-safe-700">+{formatCurrency(refund.amount, refund.currency)}</span>
              </CardFact>
            }
          >
            <CardMeta>{formatIsoDate(refund.created_at)}</CardMeta>
            <CardTitle href={`/customer/contracts/${refund.contract_id}`}>
              {getContractTitle(refund.contract_id)}
            </CardTitle>
            {refund.reason ? <CardLine>Причина: {refund.reason}</CardLine> : null}
          </ListCardBody>
        </ListCard>
      ))}
    </CardList>
  )
}
