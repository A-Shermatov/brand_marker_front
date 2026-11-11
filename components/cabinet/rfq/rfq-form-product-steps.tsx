"use client"

import type { ChangeEvent, RefObject } from "react"
import { PaperclipIcon as Paperclip, PlusIcon as Plus, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { RFQ_TITLE_MAX_LENGTH } from "@/lib/schemas/rfq-form"
import { DateTimeInput } from "@/components/ui/date-time-input"
import { PaymentModeChoice } from "@/components/payments/payment-mode-choice"
import type { PaymentMode } from "@/types"

export type ProductLineItem = {
  name: string
  qty: string
  unit: string
}

export const PRODUCT_UNITS = [
  "шт",
  "кг",
  "т",
  "м²",
  "м",
  "мешок",
  "коробка",
  "комплект",
  "проект",
  "рейс",
  "час",
] as const

export const emptyProductItem = (): ProductLineItem => ({
  name: "",
  qty: "1",
  unit: "шт",
})

export const composeProductDescription = (
  items: ProductLineItem[],
  note: string,
): string => {
  const lines = items
    .filter((item) => item.name.trim())
    .map((item) => `${item.name.trim()} — ${item.qty || "1"} ${item.unit}`)
  const body = lines.join("\n")
  const extra = note.trim()
  if (body && extra) return `${body}\n\n${extra}`
  return body || extra
}

export const totalProductQuantity = (items: ProductLineItem[]): number => {
  const sum = items.reduce((acc, item) => {
    const qty = Number(item.qty)
    return acc + (Number.isFinite(qty) && qty > 0 ? qty : 0)
  }, 0)
  return sum > 0 ? sum : 1
}

export const cityFromAddress = (address: string): string => {
  const part = address.split(",")[0]?.trim()
  return part || "Душанбе"
}

export const parseProductItems = (
  description: string | null | undefined,
  quantity: number,
): { items: ProductLineItem[]; note: string } => {
  const text = (description ?? "").trim()
  if (!text) {
    return { items: [emptyProductItem()], note: "" }
  }
  const blocks = text.split(/\n\n+/)
  const first = blocks[0] ?? ""
  const note = blocks.slice(1).join("\n\n")
  const lines = first.split("\n").map((line) => line.trim()).filter(Boolean)
  const parsed: ProductLineItem[] = []
  for (const line of lines) {
    const match = line.match(/^(.*?)\s*—\s*(\d+(?:[.,]\d+)?)\s+(\S+)\s*$/)
    if (match) {
      parsed.push({
        name: match[1].trim(),
        qty: match[2].replace(",", "."),
        unit: PRODUCT_UNITS.includes(match[3] as (typeof PRODUCT_UNITS)[number])
          ? match[3]
          : "шт",
      })
    }
  }
  if (parsed.length > 0) return { items: parsed, note }
  return {
    items: [{ name: lines[0] ?? text, qty: String(quantity || 1), unit: "шт" }],
    note: lines.length > 1 ? lines.slice(1).join("\n") : note,
  }
}

export const validateProductItems = (
  items: ProductLineItem[],
): Record<string, string> => {
  const errors: Record<string, string> = {}
  const named = items.filter((item) => item.name.trim())
  if (named.length === 0) {
    errors.description = "Опишите позицию"
    errors.item_0_name = "Опишите позицию"
  }
  items.forEach((item, index) => {
    if (!item.name.trim() && named.length > 0) return
    if (item.name.trim() || items.length === 1) {
      if (!item.name.trim()) {
        errors[`item_${index}_name`] = "Опишите позицию"
        errors.description = "Опишите позицию"
      }
      const qty = Number(item.qty)
      if (!item.qty || Number.isNaN(qty) || qty <= 0) {
        errors[`item_${index}_qty`] = "Количество больше нуля"
        errors.quantity = "Количество больше нуля"
      }
    }
  })
  return errors
}

const labelClass = "block text-[13.5px] font-medium text-foreground mb-1.5"

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1 text-[12.5px] text-destructive">⚠ {message}</p>
  ) : null

type Attachment = { id: string; file_name: string }

type SharedProps = {
  errors: Record<string, string>
  inputClass: (field: string) => string
  categories: { id: string; label: string }[]
}

type Step1Props = SharedProps & {
  title: string
  categoryId: string
  note: string
  items: ProductLineItem[]
  typeLocked?: boolean
  type: "product" | "service"
  onTypeChange: (type: "product" | "service") => void
  onTitleChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onNoteChange: (value: string) => void
  onItemChange: (index: number, patch: Partial<ProductLineItem>) => void
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  fileRef: RefObject<HTMLInputElement | null>
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  attachments: Attachment[]
  pendingAttachments: Attachment[]
  onRemoveAttachment?: (id: string) => void
  onRemovePendingAttachment?: (id: string) => void
}

export const ProductTypeToggle = ({
  type,
  locked,
  onChange,
}: {
  type: "product" | "service"
  locked?: boolean
  onChange: (type: "product" | "service") => void
}) => (
  <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border text-[14px] font-medium">
    {(
      [
        { value: "product" as const, label: "Товары" },
        { value: "service" as const, label: "Услуги" },
      ] as const
    ).map(({ value, label }) => {
      const active = type === value
      return (
        <button
          key={value}
          type="button"
          onClick={() => !locked && onChange(value)}
          disabled={locked}
          aria-pressed={active}
          className={cn(
            "py-2 transition-colors",
            active ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            locked && "cursor-not-allowed opacity-70",
          )}
        >
          {label}
        </button>
      )
    })}
  </div>
)

export const ProductWhatStep = ({
  errors,
  inputClass,
  categories,
  title,
  categoryId,
  note,
  items,
  typeLocked,
  type,
  onTypeChange,
  onTitleChange,
  onCategoryChange,
  onNoteChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  fileRef,
  onFileChange,
  attachments,
  pendingAttachments,
  onRemoveAttachment,
  onRemovePendingAttachment,
}: Step1Props) => {
  const attachmentsCount = attachments.length + pendingAttachments.length
  return (
    <>
      <ProductTypeToggle type={type} locked={typeLocked} onChange={onTypeChange} />

      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <label htmlFor="w-title" className={labelClass}>
            Название заявки
          </label>
          <input
            maxLength={RFQ_TITLE_MAX_LENGTH}
            id="w-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={inputClass("title")}
            placeholder="Например: Ноутбуки для нового филиала"
            aria-invalid={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>
        <div>
          <label htmlFor="w-cat" className={labelClass}>
            Категория
          </label>
          <select
            id="w-cat"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={cn(inputClass("category_id"), "appearance-none")}
            aria-invalid={!!errors.category_id}
          >
            <option value="">Выберите</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError message={errors.category_id} />
        </div>
      </div>

      <div className="grid gap-2">
        <span className={labelClass}>Позиции</span>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="hidden grid-cols-[1fr_110px_110px_40px] gap-2 bg-secondary px-3 py-2 text-[12px] text-muted-foreground sm:grid">
            <span>Наименование и требования</span>
            <span>Количество</span>
            <span>Ед.</span>
            <span />
          </div>
          {items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_90px] items-start gap-2 border-t border-border px-3 py-2.5 sm:grid-cols-[1fr_110px_110px_40px]"
            >
              <div className="col-span-2 grid gap-1 sm:col-span-1">
                <input
                  id={index === 0 ? "item-0-name" : undefined}
                  value={item.name}
                  onChange={(e) => onItemChange(index, { name: e.target.value })}
                  placeholder="Ноутбук 15″, Core i5, 16 ГБ"
                  className={inputClass(`item_${index}_name`)}
                  aria-invalid={!!errors[`item_${index}_name`]}
                />
                <FieldError message={errors[`item_${index}_name`]} />
              </div>
              <div className="grid gap-1">
                <input
                  id={index === 0 ? "item-0-qty" : undefined}
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={(e) => onItemChange(index, { qty: e.target.value })}
                  className={cn(inputClass(`item_${index}_qty`), "font-mono")}
                  aria-invalid={!!errors[`item_${index}_qty`]}
                />
                <FieldError message={errors[`item_${index}_qty`]} />
              </div>
              <select
                value={item.unit}
                onChange={(e) => onItemChange(index, { unit: e.target.value })}
                className={cn(inputClass("unit"), "appearance-none")}
              >
                {PRODUCT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemoveItem(index)}
                className={cn(
                  "grid h-10 place-items-center text-muted-foreground hover:text-destructive",
                  items.length < 2 && "invisible",
                )}
                aria-label="Удалить позицию"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-1 text-[13.5px] font-medium text-primary"
            >
              <Plus size={16} /> Добавить позицию
            </button>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="w-note" className={labelClass}>
          Дополнительно
        </label>
        <textarea
          id="w-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-card px-3.5 py-3 text-[15px] outline-none focus:border-primary"
          placeholder="Бренды, сертификаты, упаковка, гарантия"
        />
      </div>

      <div>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="sr-only"
          onChange={onFileChange}
          aria-label="Приложить файлы"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-3.5 text-left hover:border-primary"
        >
          <Paperclip size={20} className="shrink-0 text-muted-foreground" />
          <span className="text-[13.5px]">
            <b>Приложить файлы</b>{" "}
            <span className="text-muted-foreground">
              — ТЗ, спецификация, чертежи (до 20 МБ)
              {attachmentsCount > 0 ? ` · выбрано: ${attachmentsCount}` : ""}
            </span>
          </span>
        </button>
        {attachmentsCount > 0 && (
          <ul className="mt-3 space-y-2">
            {attachments.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="truncate">{file.file_name}</span>
                {onRemoveAttachment && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(file.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Удалить ${file.file_name}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
            {pendingAttachments.map((file) => (
              <li
                key={file.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="truncate">{file.file_name}</span>
                {onRemovePendingAttachment && (
                  <button
                    type="button"
                    onClick={() => onRemovePendingAttachment(file.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Удалить ${file.file_name}`}
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

type Step2Props = SharedProps & {
  budgetFrom: string
  deadline: string
  deliveryDate: string
  deliveryAddress: string
  paymentMode: PaymentMode
  dateMin: string
  dateMax: string
  /** Today as an ISO day: the calendars do not offer days before it. */
  today: string
  onBudgetChange: (value: string) => void
  onDeadlineChange: (value: string) => void
  onDeliveryDateChange: (value: string) => void
  onDeliveryChange: (value: string) => void
  onPaymentModeChange: (value: PaymentMode) => void
}

const hintClass = "mt-1.5 text-[12.5px] text-muted-foreground"
const dateFieldClass = "h-10 rounded-lg text-[15px]"

export const ProductConditionsStep = ({
  errors,
  inputClass,
  budgetFrom,
  deadline,
  deliveryDate,
  deliveryAddress,
  paymentMode,
  dateMin,
  dateMax,
  today,
  onBudgetChange,
  onDeadlineChange,
  onDeliveryDateChange,
  onDeliveryChange,
  onPaymentModeChange,
}: Step2Props) => (
  <>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="w-deadline" className={labelClass}>
          Дедлайн заявки
        </label>
        <DateTimeInput
          id="w-deadline"
          label="дедлайн заявки"
          min={dateMin}
          max={dateMax}
          notBefore={today}
          value={deadline}
          onChange={onDeadlineChange}
          invalid={!!errors.deadline}
          className={dateFieldClass}
        />
        <p className={hintClass}>До этого времени поставщики присылают предложения. Обычно 7–14 дней.</p>
        <FieldError message={errors.deadline} />
      </div>
      <div>
        <label htmlFor="w-work-deadline" className={labelClass}>
          Дедлайн поставки
        </label>
        <DateTimeInput
          id="w-work-deadline"
          label="дедлайн поставки"
          min={dateMin}
          max={dateMax}
          notBefore={deadline.slice(0, 10) || today}
          value={deliveryDate}
          onChange={onDeliveryDateChange}
          invalid={!!errors.delivery_date}
          className={dateFieldClass}
        />
        <p className={hintClass}>К этому времени товар должен быть у вас.</p>
        <FieldError message={errors.delivery_date} />
      </div>
      <div>
        <label htmlFor="w-budget" className={labelClass}>
          Бюджет, TJS
        </label>
        <input
          maxLength={12}
          id="w-budget"
          type="number"
          min={1}
          value={budgetFrom}
          onChange={(e) => onBudgetChange(e.target.value)}
          placeholder="необязательно"
          className={cn(inputClass("budget_from"), "font-mono")}
          aria-invalid={!!errors.budget_from}
        />
        <p className={hintClass}>Поставщики увидят сумму. Без бюджета предложения разбросаны сильнее.</p>
        <FieldError message={errors.budget_from} />
      </div>
      <div>
        <label htmlFor="w-delivery" className={labelClass}>
          Адрес доставки
        </label>
        <input
          id="w-delivery"
          value={deliveryAddress}
          onChange={(e) => onDeliveryChange(e.target.value)}
          placeholder="Душанбе, ул. Айни 48, склад"
          className={inputClass("delivery_address")}
          aria-invalid={!!errors.delivery_address || !!errors.delivery_city}
        />
        <FieldError message={errors.delivery_address || errors.delivery_city} />
      </div>
    </div>

    <PaymentModeChoice value={paymentMode} onChange={onPaymentModeChange} />
  </>
)

export const PRODUCT_WIZARD_STEPS = [
  { step: 1 as const, label: "Что купить" },
  { step: 2 as const, label: "Условия" },
  { step: 3 as const, label: "Проверка" },
]
