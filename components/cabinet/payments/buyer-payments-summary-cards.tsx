"use client"

import type { Currency } from "@/types"
import { formatCurrency } from "@/lib/format"
import { SurfaceCard } from "@/components/bm"
import { CountUp } from "@/components/ui/count-up"

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
    // Named by what the money is doing now, in the buyer's words.
    { label: "Оплачено всего", value: totalOutgoing, hint: "по всем сделкам" },
    { label: "Хранит банк", value: inEscrow, hint: "поставщик получит после вашей приёмки" },
    { label: "Нужно оплатить", value: pendingFunding, hint: "чтобы поставщик начал работу" },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <SurfaceCard key={card.label} className="grid gap-1 p-4" padded={false}>
          <p className="text-[12.5px] font-semibold text-mute">{card.label}</p>
          <p className="tnum text-[22px] font-bold text-ink">
            {hydrated ? (
              <CountUp value={card.value} format={(value) => formatCurrency(value, currency)} />
            ) : (
              <span className="inline-block h-[22px] w-28 rounded-md align-middle bm-shimmer" aria-label="Загрузка" />
            )}
          </p>
          <p className="text-[12.5px] text-mute">{card.hint}</p>
        </SurfaceCard>
      ))}
    </div>
  )
}
