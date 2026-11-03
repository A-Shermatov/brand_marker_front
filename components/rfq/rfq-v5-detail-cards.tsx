"use client"

import type { RfqWithRelations } from "@/types"
import { formatIsoDate, formatRfqBudget, pluralRu } from "@/lib/format"

const cardClass =
  "rounded-xl border border-line bg-white p-5"

type RfqPositionsCardProps = {
  rfq: RfqWithRelations
}

export const RfqPositionsCard = ({ rfq }: RfqPositionsCardProps) => {
  const rows =
    rfq.type === "product"
      ? [
          {
            name: rfq.title,
            qty: `${rfq.quantity} ${pluralRu(rfq.quantity, "шт.", "шт.", "шт.")}`,
          },
        ]
      : [{ name: rfq.title, qty: "1 услуга" }]

  return (
    <section className={cardClass}>
      <h2 className="text-[12.5px] font-medium text-mute">
        Позиции
      </h2>
      <table className="mt-2 w-full text-[14px]">
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="py-2 text-ink">{row.name}</td>
              <td className="mono whitespace-nowrap py-2 text-right text-ink">
                {row.qty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rfq.description ? (
        <p className="mt-3 text-[13.5px] text-mute whitespace-pre-wrap">
          {rfq.description}
        </p>
      ) : null}
    </section>
  )
}

type RfqTermsCardProps = {
  rfq: RfqWithRelations
  footer?: React.ReactNode
  paymentLabel?: string
}

export const RfqTermsCard = ({
  rfq,
  footer,
  paymentLabel = "Гарантия сделки",
}: RfqTermsCardProps) => {
  const delivery =
    rfq.type === "product"
      ? rfq.delivery_address ||
        [rfq.delivery_city, rfq.delivery_country].filter(Boolean).join(", ") ||
        "—"
      : rfq.project_duration || "—"

  const rows: [string, string][] = [
    [
      "Бюджет",
      formatRfqBudget(
        rfq.budget_type,
        rfq.budget_from,
        rfq.budget_to,
        rfq.currency,
      ),
    ],
    ["Доставка", delivery],
    ["Оплата", paymentLabel],
    [
      "Кто видит",
      rfq.visibility === "public"
        ? "Проверенные поставщики категории"
        : "Только приглашённые",
    ],
    ["Приём КП до", formatIsoDate(rfq.deadline)],
  ]

  return (
    <section className={cardClass}>
      <h2 className="text-[12.5px] font-medium text-mute">
        Условия
      </h2>
      <dl className="mt-2 grid gap-2 text-[14px]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="text-mute">{label}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {footer ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {footer}
        </div>
      ) : null}
    </section>
  )
}
