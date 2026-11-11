import type { Rfq } from "@/types"
import { formatIsoDate } from "@/lib/format"
import { budgetTypeMeta } from "@/lib/rfq-display"

export type RfqRequirement = {
  label: string
  value: string
}

export const getRfqRequirements = (rfq: Rfq): RfqRequirement[] => {
  const base: RfqRequirement[] = [
    { label: "Тип бюджета", value: budgetTypeMeta[rfq.budget_type] },
    { label: "Валюта", value: rfq.currency },
    { label: "Видимость", value: rfq.visibility === "public" ? "Публичный" : "Только приглашённые" },
  ]

  if (rfq.type === "product") {
    return [
      ...base,
      { label: "Количество", value: `${rfq.quantity} шт.` },
      { label: "Страна доставки", value: rfq.delivery_country },
      { label: "Город доставки", value: rfq.delivery_city },
      ...(rfq.delivery_address
        ? [{ label: "Адрес доставки", value: rfq.delivery_address }]
        : []),
      { label: "Дата доставки", value: formatIsoDate(rfq.delivery_date) },
    ]
  }

  return [
    ...base,
    { label: "Длительность проекта", value: rfq.project_duration },
    { label: "Дата начала", value: formatIsoDate(rfq.start_date) },
    ...(rfq.delivery_date
      ? [{ label: "Дедлайн работы", value: formatIsoDate(rfq.delivery_date) }]
      : []),
    ...(rfq.team_size_required != null
      ? [{ label: "Размер команды", value: `${rfq.team_size_required} чел.` }]
      : []),
    ...(rfq.experience_required
      ? [{ label: "Требуемый опыт", value: rfq.experience_required }]
      : []),
  ]
}
