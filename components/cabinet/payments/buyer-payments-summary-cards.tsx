"use client"

import type { Currency } from "@/types"
import { formatCurrency } from "@/lib/format"
import { SurfaceCard } from "@/components/bm"

type BuyerPaymentsSummaryCardsProps = {
  totalOutgoing: number
  inEscrow: number
  pendingFunding: number
  currency: Currency
  hydrated: boolean
}

export const BuyerPaymentsSummaryCards = ({
  totalOutgoing,
  inEscrow,
  pendingFunding,
  currency,
  hydrated,
}: BuyerPaymentsSummaryCardsProps) => {
  const cards = [
    { label: "Исходящие", value: totalOutgoing, hint: "всего оплачено" },
    { label: "Заморожено", value: inEscrow, hint: "на гарантии" },
    { label: "К оплате", value: pendingFunding, hint: "ожидает финансирования" },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <SurfaceCard key={card.label} className="grid gap-1 p-4" padded={false}>
          <p className="text-[12.5px] font-semibold text-mute">{card.label}</p>
          <p className="tnum text-[22px] font-bold text-ink">
            {hydrated ? formatCurrency(card.value, currency) : "—"}
          </p>
          <p className="text-[12.5px] text-mute">{card.hint}</p>
        </SurfaceCard>
      ))}
    </div>
  )
}
