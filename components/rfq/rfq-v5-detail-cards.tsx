"use client"

import {
  BriefcaseIcon,
  CalendarDotsIcon,
  CoinsIcon,
  FlagCheckeredIcon,
  HourglassIcon,
  LightningIcon,
  MapPinIcon,
  PackageIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  TimerIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"
import type { RfqWithRelations } from "@/types"
import { formatIsoDate, formatRfqBudget, formatTimeLeft, getDaysLeft, pluralRu } from "@/lib/format"
import { isDeadlinePassed } from "@/lib/iso-date"
import { OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import { readRfqNeed } from "@/lib/rfq-positions"
import { FactGrid, type RequestFact } from "@/components/rfq/fact-tile"
import { FilePreviewLink } from "@/components/shared/file-preview-link"

const cardClass = "overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(14_22_48/0.04)]"
const partHeading = "mb-2 text-[12.5px] font-medium uppercase tracking-[0.04em] text-mute"

/** Who reads the card: the words about money and time differ for the two sides. */
type Audience = "buyer" | "supplier"

type RfqPositionsCardProps = {
  rfq: RfqWithRelations
  categoryLabel?: string
}

/**
 * What the request asks for — the first thing a reader needs. A plain line on
 * top ("нужен товар: 2 позиции"), the positions as a list with amounts, the
 * buyer's own words, and the files they attached.
 */
export const RfqPositionsCard = ({ rfq, categoryLabel }: RfqPositionsCardProps) => {
  const isProduct = rfq.type === "product"
  const { positions, text } = readRfqNeed(rfq)
  const TypeIcon = isProduct ? PackageIcon : BriefcaseIcon
  const files = rfq.attachments ?? []
  const heading = isProduct
    ? `Что купить: ${positions.length} ${pluralRu(positions.length, "позиция", "позиции", "позиций")}`
    : "Что нужно сделать"

  return (
    <section aria-label="Что нужно" className={cardClass}>
      <header className="flex items-center gap-3 border-b border-line bg-brand-50/60 px-5 py-4">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-brand-600 shadow-[0_1px_2px_rgb(14_22_48/0.06)]"
          aria-hidden
        >
          <TypeIcon weight="duotone" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-brand-700">
            {isProduct ? "Нужен товар" : "Нужна услуга"}
            {categoryLabel ? (
              <>
                <span className="mx-1.5 text-mute" aria-hidden>
                  ·
                </span>
                <span className="text-ink-soft">{categoryLabel}</span>
              </>
            ) : null}
          </p>
          <h2 className="mt-0.5 text-[17px] font-semibold leading-snug text-ink">
            {heading}
          </h2>
        </div>
      </header>

      <div className="grid gap-4 px-5 py-4">
        {positions.length > 0 ? (
          <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line" aria-label="Позиции">
            {positions.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex items-baseline gap-3 px-3.5 py-2.5">
                <span className="w-5 shrink-0 text-[13px] text-mute tnum">{index + 1}</span>
                <span className="min-w-0 flex-1 wrap-break-word text-[14.5px] text-ink">{item.name}</span>
                <span className="shrink-0 whitespace-nowrap text-[14.5px] font-semibold text-ink tnum">
                  {item.amount}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {text ? (
          <div>
            <h3 className={partHeading}>{isProduct ? "Пожелания покупателя" : "Описание задачи"}</h3>
            <p className="whitespace-pre-line wrap-break-word text-[14.5px] leading-relaxed text-ink-soft">{text}</p>
          </div>
        ) : !isProduct ? (
          <p className="text-[14px] text-mute">Покупатель не добавил описание. Уточните детали в чате.</p>
        ) : null}

        {files.length > 0 ? (
          <div>
            <h3 className={partHeading}>
              <PaperclipIcon className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
              Файлы · {files.length}
            </h3>
            <ul className="grid gap-2">
              {files.map((file) => (
                <li key={file.id}>
                  <FilePreviewLink url={file.file_url} fileName={file.file_name} fileType={file.file_type} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

type RfqTermsCardProps = {
  rfq: RfqWithRelations
  footer?: React.ReactNode
  audience?: Audience
  /** Tiles across on a wide page. */
  columns?: 2 | 3
}

/** The terms as facts: money, the dates with their time of day, the place, how it is paid. */
export const rfqTermFacts = (rfq: RfqWithRelations, audience: Audience = "buyer"): RequestFact[] => {
  const isOpen = OPEN_RFQ_STATUSES.includes(rfq.status)
  const passed = isDeadlinePassed(rfq.deadline)
  const facts: RequestFact[] = [
    {
      icon: CoinsIcon,
      label: "Бюджет",
      value: formatRfqBudget(rfq.budget_type, rfq.budget_from, rfq.budget_to, rfq.currency),
      hint:
        rfq.budget_type === "open"
          ? audience === "supplier"
            ? "Цену предлагаете вы"
            : "Поставщики предлагают цену сами"
          : undefined,
    },
    {
      icon: HourglassIcon,
      label: audience === "supplier" ? "Предложение можно отправить до" : "Дедлайн заявки",
      value: formatIsoDate(rfq.deadline),
      hint: rfq.status === "draft" ? undefined : isOpen && !passed ? formatTimeLeft(rfq.deadline) : "приём закрыт",
      attention: isOpen && !passed && getDaysLeft(rfq.deadline) <= 2,
    },
  ]

  if (rfq.type === "product") {
    // Requests made before the delivery deadline had its own field carry a copy of the request deadline.
    if (rfq.delivery_date && rfq.delivery_date !== rfq.deadline) {
      facts.push({
        icon: FlagCheckeredIcon,
        label: "Дедлайн поставки",
        value: formatIsoDate(rfq.delivery_date),
        hint: audience === "supplier" ? "К этому времени товар должен быть у покупателя" : formatTimeLeft(rfq.delivery_date),
      })
    }
  } else {
    if (rfq.start_date) {
      facts.push({ icon: CalendarDotsIcon, label: "Начало работы", value: formatIsoDate(rfq.start_date) })
    }
    if (rfq.delivery_date) {
      facts.push({
        icon: FlagCheckeredIcon,
        label: "Дедлайн работы",
        value: formatIsoDate(rfq.delivery_date),
        hint: rfq.project_duration ? `На работу: ${rfq.project_duration}` : undefined,
      })
    } else if (rfq.project_duration) {
      facts.push({ icon: TimerIcon, label: "Срок работы", value: rfq.project_duration })
    }
  }

  facts.push({
    icon: rfq.payment_mode === "direct" ? LightningIcon : ShieldCheckIcon,
    label: "Оплата",
    value: rfq.payment_mode === "direct" ? "Сразу поставщику" : "С гарантией площадки",
    hint:
      audience === "supplier"
        ? rfq.payment_mode === "direct"
          ? "Деньги приходят вам в момент оплаты"
          : "Покупатель платит заранее, деньги придут вам после приёмки"
        : rfq.payment_mode === "direct"
          ? "Деньги сразу уходят поставщику"
          : "Банк держит деньги до вашей приёмки",
  })

  if (rfq.type === "product") {
    const place =
      rfq.delivery_address || [rfq.delivery_city, rfq.delivery_country].filter(Boolean).join(", ")
    if (place) facts.push({ icon: MapPinIcon, label: "Куда доставить", value: place, wide: true })
  }

  if (rfq.visibility === "invited_only") {
    facts.push({
      icon: UsersThreeIcon,
      label: "Кто видит заявку",
      value: audience === "supplier" ? "Персональная заявка" : "Только приглашённые поставщики",
      hint: audience === "supplier" ? "Покупатель пригласил вас лично" : undefined,
      wide: true,
    })
  }
  return facts
}

export const RfqTermsCard = ({ rfq, footer, audience = "buyer", columns = 2 }: RfqTermsCardProps) => (
  <section aria-label="Условия" className={`${cardClass} p-5`}>
    <h2 className="mb-3 text-[16px] font-semibold text-ink">Условия</h2>
    <FactGrid facts={rfqTermFacts(rfq, audience)} columns={columns} />
    {footer ? <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">{footer}</div> : null}
  </section>
)
