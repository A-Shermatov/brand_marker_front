"use client"

import { statusPillClass } from "@/components/ui/status-badge"
import {
  CardFact,
  CardLine,
  CardList,
  CardMeta,
  CardNo,
  CardTitle,
  ListCard,
  ListCardBody,
} from "@/components/layout/card-list"
import type { Invoice } from "@/types"
import { invoiceStatusMeta } from "@/lib/finance-display"
import { formatCurrency, formatIsoDate } from "@/lib/format"

type InvoicesTableProps = {
  invoices: Invoice[]
  getContractTitle: (contractId: number | null) => string
}

/** The supplier's invoices as cards: deal, what for, amount, status and due date. */
export const InvoicesTable = ({ invoices, getContractTitle }: InvoicesTableProps) => {
  if (invoices.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Счетов пока нет</p>
  }
  return (
    <CardList label="Счета">
      {invoices.map((invoice) => {
        const meta = invoiceStatusMeta[invoice.status]
        return (
          <ListCard key={invoice.id}>
            <ListCardBody
              aside={
                <>
                  <CardFact label="Сумма" className="min-w-[130px]">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </CardFact>
                  <CardFact label="Оплатить до" className="min-w-[110px]">
                    {invoice.due_at ? formatIsoDate(invoice.due_at) : "—"}
                  </CardFact>
                  <span className={`${statusPillClass} ${meta.className}`}>{meta.label}</span>
                </>
              }
            >
              <CardMeta>
                <CardNo>{invoice.number}</CardNo>
              </CardMeta>
              <CardTitle href={invoice.contract_id ? `/supplier/contracts/${invoice.contract_id}` : undefined}>
                {getContractTitle(invoice.contract_id)}
              </CardTitle>
              {invoice.title ? <CardLine>{invoice.title}</CardLine> : null}
            </ListCardBody>
          </ListCard>
        )
      })}
    </CardList>
  )
}
