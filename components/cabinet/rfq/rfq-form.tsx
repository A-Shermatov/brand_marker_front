"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  BriefcaseIcon as Briefcase,
  CalendarDotsIcon,
  CoinsIcon,
  FlagCheckeredIcon,
  HourglassIcon,
  LightningIcon,
  MapPinIcon,
  PaperPlaneRightIcon as Send,
  PaperclipIcon as Paperclip,
  ShieldCheckIcon,
  ShoppingCartIcon as ShoppingCart,
  XIcon as X,
} from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { RFQ_TITLE_MAX_LENGTH, validateRfqForm, type RfqFormValues } from "@/lib/schemas/rfq-form"
import { isoDateBounds, toIsoDay } from "@/lib/iso-date"
import { formatCurrency, formatDateSpan, formatIsoDate, formatRfqBudget, formatTimeLeft } from "@/lib/format"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"
import { PageFrame, PageHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { DateTimeInput } from "@/components/ui/date-time-input"
import { RfqReview } from "@/components/cabinet/rfq/rfq-form-review"
import type { RequestFact } from "@/components/rfq/fact-tile"
import { InlineHint } from "@/components/process"
import type { PaymentMode, RfqCreate, RfqWithRelations } from "@/types"
import { PAYMENT_MODE_LABEL, PaymentModeChoice } from "@/components/payments/payment-mode-choice"
import type { RfqFormPrefill } from "@/lib/rfq-from-listing"
import { useCategoryOptions } from "@/hooks/use-category-options"
import {
  PRODUCT_WIZARD_STEPS,
  ProductConditionsStep,
  ProductWhatStep,
  cityFromAddress,
  composeProductDescription,
  emptyProductItem,
  parseProductItems,
  totalProductQuantity,
  validateProductItems,
  type ProductLineItem,
} from "@/components/cabinet/rfq/rfq-form-product-steps"

type FormState = {
  type: "product" | "service"
  title: string
  category_id: string
  description: string
  note: string
  items: ProductLineItem[]
  payment_mode: PaymentMode
  budget_type: "fixed" | "range" | "open"
  budget_from: string
  budget_to: string
  currency: RfqFormValues["currency"]
  deadline: string
  visibility: "public" | "invited_only"
  quantity: string
  delivery_country: string
  delivery_city: string
  delivery_address: string
  delivery_date: string
  project_duration: string
  start_date: string
  team_size_required: string
  experience_required: string
}

export type { RfqFormPrefill }

type PreviewAttachment = {
  id: string
  file_name: string
}

type RfqFormProps = {
  initial?: RfqWithRelations
  prefill?: RfqFormPrefill
  listingTitle?: string
  invitedSupplierId?: number
  invitedSupplierName?: string
  pendingAttachments?: PreviewAttachment[]
  cancelHref: string
  isSubmitting?: boolean
  onSaveDraft: (input: RfqCreate) => void
  onPublish: (input: RfqCreate) => void
  onAddAttachment?: (file: File) => void
  onRemoveAttachment?: (attachmentId: string) => void
  onRemovePendingAttachment?: (id: string) => void
}

const rfqDateYear = new Date().getFullYear()
const { min: DATE_INPUT_MIN, max: DATE_INPUT_MAX } = isoDateBounds(
  rfqDateYear - 1,
  rfqDateYear + 10,
)

const defaultValues = (
  initial?: RfqWithRelations,
  invitedSupplierId?: number,
  prefill?: RfqFormPrefill,
): FormState => {
  if (!initial) {
    const base: FormState = {
      type: "product",
      title: "",
      category_id: "",
      description: "",
      note: "",
      items: [emptyProductItem()],
      payment_mode: "escrow",
      budget_type: "open",
      budget_from: "",
      budget_to: "",
      currency: "TJS",
      deadline: "",
      visibility: invitedSupplierId ? "invited_only" : "public",
      project_duration: "",
      start_date: "",
      team_size_required: "",
      experience_required: "",
      quantity: "1",
      delivery_country: "Таджикистан",
      delivery_city: "",
      delivery_address: "",
      delivery_date: "",
    }
    if (!prefill) return base
    const qty = Number(prefill.quantity) || 1
    const parsed = parseProductItems(prefill.description, qty)
    return {
      ...base,
      ...prefill,
      note: parsed.note || prefill.description || "",
      items: parsed.items[0]?.name
        ? parsed.items
        : [{ name: prefill.title ?? "", qty: String(qty), unit: "шт" }],
      visibility: invitedSupplierId ? "invited_only" : (prefill.visibility ?? base.visibility),
    }
  }

  const qty = initial.type === "product" ? initial.quantity : 1
  const parsed = parseProductItems(initial.description, qty)
  const address =
    initial.type === "product"
      ? [initial.delivery_address, initial.delivery_city, initial.delivery_country]
          .filter(Boolean)
          .join(", ")
      : ""

  return {
    type: initial.type,
    title: initial.title,
    category_id: initial.category_id,
    description: initial.description ?? "",
    note: parsed.note,
    items: initial.type === "product" ? parsed.items : [emptyProductItem()],
    payment_mode: initial.payment_mode ?? "escrow",
    budget_type: initial.budget_type,
    budget_from: initial.budget_from != null ? String(initial.budget_from) : "",
    budget_to: initial.budget_to != null ? String(initial.budget_to) : "",
    currency: initial.currency as FormState["currency"],
    deadline: initial.deadline,
    visibility: initial.visibility,
    quantity: initial.type === "product" ? String(initial.quantity) : "1",
    delivery_country: initial.type === "product" ? initial.delivery_country : "Таджикистан",
    delivery_city: initial.type === "product" ? initial.delivery_city : "",
    delivery_address:
      initial.type === "product"
        ? (initial.delivery_address || address)
        : "",
    delivery_date: initial.delivery_date ?? "",
    project_duration: initial.type === "service" ? initial.project_duration : "",
    start_date: initial.type === "service" ? initial.start_date : "",
    team_size_required:
      initial.type === "service" && initial.team_size_required != null
        ? String(initial.team_size_required)
        : "",
    experience_required:
      initial.type === "service" ? (initial.experience_required ?? "") : "",
  }
}

/** Budget choices as the buyer reads them; "open" means no budget at all. */
const BUDGET_CHOICE: Record<FormState["budget_type"], string> = {
  open: "Без бюджета",
  fixed: "Точная сумма",
  range: "Диапазон",
}

const toFormValues = (values: FormState): RfqFormValues => {
  if (values.type === "product") {
    const description = composeProductDescription(values.items, values.note)
    const hasBudget =
      Boolean(values.budget_from.trim()) && Number(values.budget_from) > 0
    const address = values.delivery_address.trim()
    return {
      type: "product",
      title: values.title,
      category_id: values.category_id,
      description,
      budget_type: hasBudget ? "fixed" : "open",
      budget_from: hasBudget ? values.budget_from : "",
      budget_to: "",
      currency: values.currency,
      deadline: values.deadline,
      visibility: values.visibility,
      quantity: String(totalProductQuantity(values.items)),
      delivery_country: "Таджикистан",
      delivery_city: cityFromAddress(address),
      delivery_address: address || undefined,
      delivery_date: values.delivery_date,
    }
  }

  return {
    type: "service",
    title: values.title,
    category_id: values.category_id,
    description: values.description,
    budget_type: values.budget_type,
    budget_from: values.budget_from,
    budget_to: values.budget_to,
    currency: values.currency,
    deadline: values.deadline,
    visibility: values.visibility,
    // The length of the work follows from its two dates; older requests keep their own wording.
    project_duration:
      formatDateSpan(values.start_date, values.delivery_date) || values.project_duration,
    start_date: values.start_date,
    delivery_date: values.delivery_date,
    team_size_required: values.team_size_required,
    experience_required: values.experience_required,
  }
}

const toRfqCreate = (values: FormState): RfqCreate => {
  const parsed = toFormValues(values)
  const budgetFrom =
    parsed.budget_type === "open" ? null : Number(parsed.budget_from) || null
  const budgetTo =
    parsed.budget_type === "range" ? Number(parsed.budget_to) || null : null

  const base = {
    actor_id: "",
    created_by: "",
    title: parsed.title.trim(),
    description: parsed.description.trim() || null,
    category_id: parsed.category_id,
    budget_type: parsed.budget_type,
    budget_from: budgetFrom,
    budget_to: budgetTo,
    currency: parsed.currency,
    deadline: parsed.deadline,
    visibility: parsed.visibility,
    payment_mode: values.payment_mode,
    status: "draft" as const,
  }

  if (parsed.type === "product") {
    return {
      ...base,
      type: "product",
      quantity: Number(parsed.quantity),
      delivery_country: parsed.delivery_country.trim(),
      delivery_city: parsed.delivery_city.trim(),
      delivery_address: parsed.delivery_address?.trim() || null,
      delivery_date: parsed.delivery_date,
    }
  }

  return {
    ...base,
    type: "service",
    project_duration: parsed.project_duration.trim(),
    start_date: parsed.start_date,
    delivery_date: parsed.delivery_date,
    team_size_required: parsed.team_size_required
      ? Number(parsed.team_size_required)
      : null,
    experience_required: parsed.experience_required?.trim() || null,
  }
}

type WizardStep = 1 | 2 | 3

const SERVICE_WIZARD_STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "Что нужно" },
  { step: 2, label: "Бюджет и сроки" },
  { step: 3, label: "Проверка" },
]

const STEP_FIELDS_SERVICE: Record<1 | 2, string[]> = {
  1: ["type", "title", "category_id", "description"],
  2: [
    "budget_type",
    "budget_from",
    "budget_to",
    "currency",
    "deadline",
    "project_duration",
    "start_date",
    "delivery_date",
  ],
}

const STEP_FIELDS_PRODUCT: Record<1 | 2, string[]> = {
  1: ["type", "title", "category_id", "description", "quantity"],
  2: [
    "budget_from",
    "deadline",
    "delivery_address",
    "delivery_city",
    "delivery_country",
    "delivery_date",
  ],
}

const FIELD_INPUT_ID: Record<string, string> = {
  title: "rfq-title",
  category_id: "rfq-category",
  description: "rfq-description",
  quantity: "quantity",
  budget_from: "budget-from",
  budget_to: "budget-to",
  deadline: "deadline",
  delivery_date: "work-deadline",
  delivery_country: "delivery-country",
  delivery_city: "delivery-city",
  delivery_address: "w-delivery",
  project_duration: "duration",
  start_date: "start-date",
}

const getFieldStep = (field: string, type: FormState["type"]): 1 | 2 => {
  const step1 =
    type === "product" ? STEP_FIELDS_PRODUCT[1] : STEP_FIELDS_SERVICE[1]
  if (step1.includes(field) || field.startsWith("item_")) return 1
  return 2
}

const focusField = (field: string, type: FormState["type"]) => {
  const productIds: Record<string, string> = {
    title: "w-title",
    category_id: "w-cat",
    description: "item-0-name",
    quantity: "item-0-qty",
    budget_from: "w-budget",
    deadline: "w-deadline",
    delivery_date: "w-work-deadline",
    delivery_address: "w-delivery",
  }
  const inputId =
    type === "product"
      ? (productIds[field] ?? FIELD_INPUT_ID[field])
      : FIELD_INPUT_ID[field]
  if (!inputId) return
  requestAnimationFrame(() => {
    const element = document.getElementById(inputId)
    element?.scrollIntoView({ behavior: "smooth", block: "center" })
    element?.focus({ preventScroll: true })
  })
}

const labelClass = "block text-sm font-medium text-foreground mb-1.5"

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-destructive mt-1">{message}</p> : null

/** A date of the request as a tile: the day (and time), and how far away it is. */
const dateFact = (
  icon: RequestFact["icon"],
  label: string,
  value: string,
  hint?: string,
): RequestFact => ({
  icon,
  label,
  value: value ? formatIsoDate(value) : "Не указан",
  hint: value ? (hint ?? formatTimeLeft(value)) : undefined,
})

const paymentFact = (mode: PaymentMode): RequestFact => ({
  icon: mode === "escrow" ? ShieldCheckIcon : LightningIcon,
  label: "Оплата",
  value: PAYMENT_MODE_LABEL[mode],
  hint:
    mode === "escrow"
      ? "Банк держит деньги до вашей приёмки"
      : "Деньги сразу уходят поставщику",
})

export const RfqForm = ({
  initial,
  prefill,
  listingTitle,
  invitedSupplierId,
  invitedSupplierName,
  pendingAttachments = [],
  cancelHref,
  isSubmitting = false,
  onSaveDraft,
  onPublish,
  onAddAttachment,
  onRemoveAttachment,
  onRemovePendingAttachment,
}: RfqFormProps) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const { rfqCategories } = useCategoryOptions()
  const [values, setValues] = useState<FormState>(() =>
    defaultValues(initial, invitedSupplierId, prefill),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<WizardStep>(1)

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    // The person is fixing the field: its complaint goes away until the next check.
    setErrors((prev) => {
      const stale = key === "delivery_address" ? ["delivery_address", "delivery_city"] : [key as string]
      if (!stale.some((field) => prev[field])) return prev
      return Object.fromEntries(Object.entries(prev).filter(([field]) => !stale.includes(field)))
    })
  }

  const handleDateChange = (
    key: "deadline" | "delivery_date" | "start_date",
    value: string,
  ) => {
    setField(key, value)
  }

  const today = toIsoDay(new Date())
  const dateFieldClass = (field: string) =>
    cn(
      "h-11 rounded-xl text-sm focus-within:ring-2 focus-within:ring-primary/20",
      !errors[field] && "border-input",
    )

  const inputClass = (field: string) =>
    cn(
      values.type === "product"
        ? "w-full h-10 px-3.5 rounded-lg border bg-card text-[15px] outline-none transition-colors"
        : "w-full h-11 px-4 rounded-xl border bg-card text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
      errors[field]
        ? "border-destructive"
        : values.type === "product"
          ? "border-border focus:border-primary"
          : "border-input focus:border-primary",
    )

  const goToStep = (next: WizardStep) => {
    setStep(next)
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }))
  }

  const collectErrors = () => {
    const formErrors = validateRfqForm(toFormValues(values))
    if (values.type !== "product") return formErrors
    const itemErrors = validateProductItems(values.items)
    if (!values.delivery_address.trim()) {
      formErrors.delivery_address = "Укажите адрес доставки"
      formErrors.delivery_city = "Укажите адрес доставки"
    }
    if (formErrors.description && !itemErrors.description) {
      itemErrors.description = formErrors.description
      itemErrors.item_0_name = formErrors.description
    }
    return { ...formErrors, ...itemErrors }
  }

  /** Validates the whole form; on failure jumps to the step with the first error. */
  const handleValidateAll = (): boolean => {
    const nextErrors = collectErrors()
    setErrors(nextErrors)
    const firstField = Object.keys(nextErrors)[0]
    if (!firstField) return true
    setStep(getFieldStep(firstField, values.type))
    focusField(firstField, values.type)
    return false
  }

  const handleNext = () => {
    if (step === 3) return
    const allErrors = collectErrors()
    const stepFields =
      values.type === "product" ? STEP_FIELDS_PRODUCT[step] : STEP_FIELDS_SERVICE[step]
    const stepErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => {
        if (values.type === "product" && step === 1 && field.startsWith("item_")) {
          return true
        }
        return stepFields.includes(field)
      }),
    )
    setErrors(stepErrors)
    const firstField = Object.keys(stepErrors)[0]
    if (firstField) {
      focusField(firstField, values.type)
      return
    }
    goToStep((step + 1) as WizardStep)
  }

  const switchType = (type: "product" | "service") => {
    setField("type", type)
    setErrors({})
    setStep(1)
  }

  const handleBack = () => {
    if (step === 1) return
    goToStep((step - 1) as WizardStep)
  }

  const handleSaveDraft = () => {
    if (isSubmitting) return
    if (!handleValidateAll()) return
    onSaveDraft(toRfqCreate(values))
  }

  const handlePublish = () => {
    if (isSubmitting) return
    if (!handleValidateAll()) return
    onPublish(toRfqCreate(values))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onAddAttachment) return
    onAddAttachment(file)
    event.target.value = ""
  }

  const categoryLabel = rfqCategories.find((c) => c.id === values.category_id)?.label ?? "—"
  const attachmentsCount = (initial?.attachments.length ?? 0) + pendingAttachments.length
  const budgetLabel = formatRfqBudget(
    values.budget_type,
    values.budget_from ? Number(values.budget_from) : null,
    values.budget_to ? Number(values.budget_to) : null,
    values.currency,
  )

  const renderServiceWhatStep = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        {([
          { value: "service" as const, title: "Услуга", desc: "Работа или сервис", Icon: Briefcase },
          { value: "product" as const, title: "Товар", desc: "Закупка товара", Icon: ShoppingCart },
        ]).map(({ value, title, desc, Icon }) => {
          const active = values.type === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => switchType(value)}
              disabled={!!initial}
              aria-pressed={active}
              className={cn(
                "text-left rounded-2xl border-2 p-4 transition-all",
                active ? "border-primary bg-secondary shadow-sm" : "border-border bg-card hover:border-primary/40",
                initial && "opacity-70 cursor-not-allowed",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-2.5",
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
                )}
              >
                <Icon size={18} />
              </div>
              <div className="text-sm font-bold text-foreground">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
            </button>
          )
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <label htmlFor="rfq-title" className={labelClass}>
            Что нужно сделать или купить
          </label>
          <input
            maxLength={RFQ_TITLE_MAX_LENGTH}
            id="rfq-title"
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            className={inputClass("title")}
            placeholder={
              values.type === "product"
                ? "Например: 200 офисных стульев"
                : "Например: логотип и фирменный стиль"
            }
            aria-invalid={!!errors.title}
          />
          <FieldError message={errors.title} />
        </div>

        <div>
          <label htmlFor="rfq-category" className={labelClass}>
            Категория
          </label>
          <select
            id="rfq-category"
            value={values.category_id}
            onChange={(e) => setField("category_id", e.target.value)}
            className={cn(inputClass("category_id"), "appearance-none")}
            aria-invalid={!!errors.category_id}
          >
            <option value="">Выберите категорию</option>
            {rfqCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <FieldError message={errors.category_id} />
        </div>

        <div>
          <label htmlFor="rfq-description" className={labelClass}>
            Подробности
          </label>
          <textarea
            id="rfq-description"
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={5}
            className={cn(
              "w-full px-4 py-3 rounded-xl border bg-card text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 resize-none",
              errors.description ? "border-destructive" : "border-input focus:border-primary",
            )}
            placeholder="Объём, требования, пожелания по качеству и срокам"
            aria-invalid={!!errors.description}
          />
          <FieldError message={errors.description} />
        </div>

        {values.type === "product" && (
          <div className="max-w-60">
            <label htmlFor="quantity" className={labelClass}>
              Количество
            </label>
            <input
              maxLength={MAX_NUMERIC_INPUT_LENGTH}
              id="quantity"
              type="text"
              inputMode="numeric"
              value={values.quantity}
              onChange={(e) => {
                const next = sanitizeDigitInput(e.currentTarget.value)
                if (next === null) return
                setField("quantity", next)
              }}
              className={cn(inputClass("quantity"), "tnum")}
              aria-invalid={!!errors.quantity}
            />
            <FieldError message={errors.quantity} />
          </div>
        )}

        <div>
          <span className={labelClass}>Файлы (необязательно)</span>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Загрузить файл"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            <Paperclip size={16} />
            Добавить файл
          </button>
          {attachmentsCount > 0 && (
            <ul className="mt-3 space-y-2">
              {initial?.attachments.map((file) => (
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
      </div>

      <InlineHint>
        Чем подробнее описание, тем точнее цены в предложениях. Фото, чертежи или техзадание
        можно приложить файлами.
      </InlineHint>
    </>
  )

  const renderServiceBudgetStep = () => (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-5">
        <div>
          <span className={labelClass}>Бюджет</span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Тип бюджета">
            {(["open", "fixed", "range"] as const).map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => setField("budget_type", bt)}
                aria-pressed={values.budget_type === bt}
                className={cn(
                  "h-10 rounded-xl border text-xs font-semibold transition-colors",
                  values.budget_type === bt
                    ? "border-primary bg-secondary text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                {BUDGET_CHOICE[bt]}
              </button>
            ))}
          </div>
          {values.budget_type === "open" && (
            <p className="text-xs text-muted-foreground mt-2">
              Бюджет можно не указывать: поставщики сами предложат цену, а вы сравните предложения
              на странице заявки.
            </p>
          )}
        </div>

        {values.budget_type !== "open" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="budget-from" className={labelClass}>
                {values.budget_type === "range" ? "От" : "Сумма"}
              </label>
              <input
                maxLength={MAX_NUMERIC_INPUT_LENGTH}
                id="budget-from"
                type="text"
                inputMode="numeric"
                value={values.budget_from}
                onChange={(e) => {
                  const next = sanitizeDigitInput(e.currentTarget.value)
                  if (next === null) return
                  setField("budget_from", next)
                }}
                className={cn(inputClass("budget_from"), "tnum")}
                aria-invalid={!!errors.budget_from}
              />
              <FieldError message={errors.budget_from} />
            </div>
            {values.budget_type === "range" && (
              <div>
                <label htmlFor="budget-to" className={labelClass}>
                  До
                </label>
                <input
                  maxLength={MAX_NUMERIC_INPUT_LENGTH}
                  id="budget-to"
                  type="text"
                  inputMode="numeric"
                  value={values.budget_to}
                  onChange={(e) => {
                    const next = sanitizeDigitInput(e.currentTarget.value)
                    if (next === null) return
                    setField("budget_to", next)
                  }}
                  className={cn(inputClass("budget_to"), "tnum")}
                  aria-invalid={!!errors.budget_to}
                />
                <FieldError message={errors.budget_to} />
              </div>
            )}
            <div>
              <label htmlFor="currency" className={labelClass}>
                Валюта
              </label>
              <select
                id="currency"
                value={values.currency}
                onChange={(e) => setField("currency", e.target.value as FormState["currency"])}
                className={cn(inputClass("currency"), "appearance-none")}
              >
                {(["TJS", "USD", "EUR", "KZT", "CNY"] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="deadline" className={labelClass}>
              Дедлайн заявки
            </label>
            <DateTimeInput
              id="deadline"
              label="дедлайн заявки"
              min={DATE_INPUT_MIN}
              max={DATE_INPUT_MAX}
              notBefore={today}
              value={values.deadline}
              onChange={(v) => handleDateChange("deadline", v)}
              invalid={!!errors.deadline}
              className={dateFieldClass("deadline")}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              До этого времени исполнители присылают предложения. Время можно не указывать — тогда до
              конца дня.
            </p>
            <FieldError message={errors.deadline} />
          </div>
          <div>
            <label htmlFor="start-date" className={labelClass}>
              Когда начать работу
            </label>
            <DateTimeInput
              id="start-date"
              label="начало работы"
              min={DATE_INPUT_MIN}
              max={DATE_INPUT_MAX}
              notBefore={today}
              value={values.start_date}
              onChange={(v) => handleDateChange("start_date", v)}
              invalid={!!errors.start_date}
              className={dateFieldClass("start_date")}
            />
            <FieldError message={errors.start_date} />
          </div>
          <div>
            <label htmlFor="work-deadline" className={labelClass}>
              Дедлайн работы
            </label>
            <DateTimeInput
              id="work-deadline"
              label="дедлайн работы"
              min={DATE_INPUT_MIN}
              max={DATE_INPUT_MAX}
              notBefore={values.start_date.slice(0, 10) || today}
              value={values.delivery_date}
              onChange={(v) => handleDateChange("delivery_date", v)}
              invalid={!!errors.delivery_date}
              className={dateFieldClass("delivery_date")}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {formatDateSpan(values.start_date, values.delivery_date)
                ? `К этому времени результат должен быть готов. На работу: ${formatDateSpan(values.start_date, values.delivery_date)}.`
                : "К этому времени результат должен быть готов."}
            </p>
            <FieldError message={errors.delivery_date} />
          </div>
        </div>
      </div>

      <PaymentModeChoice
        value={values.payment_mode}
        onChange={(v) => setField("payment_mode", v)}
      />
    </>
  )

  const workSpan = formatDateSpan(values.start_date, values.delivery_date)
  const reviewFacts: RequestFact[] =
    values.type === "product"
      ? [
          dateFact(HourglassIcon, "Дедлайн заявки", values.deadline),
          dateFact(FlagCheckeredIcon, "Дедлайн поставки", values.delivery_date),
          {
            icon: CoinsIcon,
            label: "Бюджет",
            value: values.budget_from.trim()
              ? formatCurrency(Number(values.budget_from), values.currency)
              : "Не указан",
            hint: values.budget_from.trim() ? undefined : "Поставщики предложат цену сами",
          },
          paymentFact(values.payment_mode),
          {
            icon: MapPinIcon,
            label: "Адрес доставки",
            value: values.delivery_address.trim() || "Не указан",
            wide: true,
          },
        ]
      : [
          { ...dateFact(HourglassIcon, "Дедлайн заявки", values.deadline), wide: true },
          dateFact(CalendarDotsIcon, "Начало работы", values.start_date, ""),
          dateFact(
            FlagCheckeredIcon,
            "Дедлайн работы",
            values.delivery_date,
            workSpan ? `На работу: ${workSpan}` : undefined,
          ),
          {
            icon: CoinsIcon,
            label: "Бюджет",
            value: budgetLabel,
            hint: values.budget_type === "open" ? "Исполнители предложат цену сами" : undefined,
          },
          paymentFact(values.payment_mode),
        ]

  const reviewFootnote =
    values.visibility === "invited_only" && invitedSupplierName
      ? `После публикации заявку увидит только ${invitedSupplierName}. Его предложение появится на странице заявки. Ваши контакты не показываются — общение только в чате площадки.`
      : values.type === "product"
        ? `После публикации поставщики категории «${categoryLabel}» получат уведомление. Предложения появятся на странице заявки — вы сравните их и выберете лучшее. Ваши контакты не показываются.`
        : "После публикации заявку увидят исполнители. Предложения появятся на странице заявки — вы сравните их и выберете лучшее. Ваши контакты не показываются."

  const renderReviewStep = () => (
    <RfqReview
      type={values.type}
      title={values.title}
      categoryLabel={categoryLabel}
      positions={values.type === "product" ? values.items : undefined}
      details={values.type === "product" ? values.note : values.description}
      detailsLabel={values.type === "product" ? "Дополнительно" : "Подробности"}
      filesCount={attachmentsCount}
      facts={reviewFacts}
      footnote={reviewFootnote}
      onEdit={goToStep}
    />
  )

  const isProduct = values.type === "product"
  const wizardSteps = isProduct ? PRODUCT_WIZARD_STEPS : SERVICE_WIZARD_STEPS

  return (
    <PageFrame>
      <PageHeader
        title={initial ? (isProduct ? "Заявка" : "Редактирование заявки") : "Новая заявка"}
        description={
          isProduct
            ? undefined
            : "Три простых шага — и поставщики начнут присылать предложения"
        }
        backHref={cancelHref}
        backLabel={isProduct ? "Заявки" : "Назад"}
      />

      {invitedSupplierName && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm">
          <span className="font-semibold text-ink">
            {listingTitle ? "Отклик: " : "Приглашение: "}
          </span>
          <span className="text-mute">
            {listingTitle
              ? `Отклик на «${listingTitle}» — заявка только для ${invitedSupplierName}`
              : `Заявка будет доступна только для ${invitedSupplierName}`}
          </span>
        </div>
      )}

      <div className={cn("mx-auto w-full max-w-3xl", isProduct ? "" : "space-y-6")}>
        {isProduct ? (
          <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Шаги создания заявки">
            {wizardSteps.map((item) => (
              <li
                key={item.step}
                className={cn(
                  "grid gap-2 text-[13px]",
                  item.step === step ? "font-semibold text-ink" : "text-mute",
                )}
                aria-current={item.step === step ? "step" : undefined}
              >
                <span
                  className={cn(
                    "h-1 rounded-full",
                    item.step <= step ? "bg-brand-600" : "bg-line",
                  )}
                />
                <span>
                  <span className="mr-1 font-mono tnum">{item.step}</span>
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">
                {wizardSteps[step - 1].label}
              </span>
              <span className="text-mute">Шаг {step} из 3</span>
            </div>
            <ol className="grid grid-cols-3 gap-2" aria-label="Шаги создания заявки">
              {wizardSteps.map((item) => (
                <li key={item.step} aria-current={item.step === step ? "step" : undefined}>
                  <span
                    className={cn(
                      "block h-1.5 rounded-full transition-colors",
                      item.step <= step ? "bg-brand-600" : "bg-line",
                    )}
                  />
                  <span
                    className={cn(
                      "mt-1.5 hidden text-xs sm:block",
                      item.step === step ? "font-semibold text-ink" : "text-mute",
                    )}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {step === 3 ? (
          renderReviewStep()
        ) : isProduct ? (
          <div className="grid gap-5 rounded-xl border border-border bg-card p-5 md:p-6">
            {step === 1 && (
              <ProductWhatStep
                errors={errors}
                inputClass={inputClass}
                categories={rfqCategories}
                title={values.title}
                categoryId={values.category_id}
                note={values.note}
                items={values.items}
                type={values.type}
                typeLocked={!!initial}
                onTypeChange={switchType}
                onTitleChange={(v) => setField("title", v)}
                onCategoryChange={(v) => setField("category_id", v)}
                onNoteChange={(v) => setField("note", v)}
                onItemChange={(index, patch) =>
                  setValues((prev) => ({
                    ...prev,
                    items: prev.items.map((item, i) =>
                      i === index ? { ...item, ...patch } : item,
                    ),
                  }))
                }
                onAddItem={() =>
                  setValues((prev) => ({
                    ...prev,
                    items: [...prev.items, emptyProductItem()],
                  }))
                }
                onRemoveItem={(index) =>
                  setValues((prev) => ({
                    ...prev,
                    items:
                      prev.items.length < 2
                        ? prev.items
                        : prev.items.filter((_, i) => i !== index),
                  }))
                }
                fileRef={fileRef}
                onFileChange={handleFileChange}
                attachments={initial?.attachments ?? []}
                pendingAttachments={pendingAttachments}
                onRemoveAttachment={onRemoveAttachment}
                onRemovePendingAttachment={onRemovePendingAttachment}
              />
            )}
            {step === 2 && (
              <ProductConditionsStep
                errors={errors}
                inputClass={inputClass}
                categories={rfqCategories}
                budgetFrom={values.budget_from}
                deadline={values.deadline}
                deliveryDate={values.delivery_date}
                deliveryAddress={values.delivery_address}
                paymentMode={values.payment_mode}
                dateMin={DATE_INPUT_MIN}
                dateMax={DATE_INPUT_MAX}
                today={today}
                onBudgetChange={(v) => setField("budget_from", v)}
                onDeadlineChange={(v) => handleDateChange("deadline", v)}
                onDeliveryDateChange={(v) => handleDateChange("delivery_date", v)}
                onDeliveryChange={(v) => setField("delivery_address", v)}
                onPaymentModeChange={(v) => setField("payment_mode", v)}
              />
            )}
          </div>
        ) : (
          <>
            {step === 1 && renderServiceWhatStep()}
            {step === 2 && renderServiceBudgetStep()}
          </>
        )}

        {isProduct ? (
          <div className={cn("flex flex-wrap items-center gap-3", step === 3 ? "mt-6" : "mt-5")}>
            {step > 1 ? (
              <Button type="button" variant="ghost" onClick={handleBack}>
                <ArrowLeft /> Назад
              </Button>
            ) : null}
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-2 text-[13.5px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Сохранить черновик
            </button>
            <span className="flex-1" />
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Далее: {wizardSteps[step].label} <ArrowRight />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                <Send size={16} />
                {isSubmitting ? "Публикуем..." : "Опубликовать заявку"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step === 1 ? (
              <Button asChild variant="ghost">
                <Link href={cancelHref}>Отмена</Link>
              </Button>
            ) : (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft /> Назад
              </Button>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                Сохранить черновик
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext}>
                  Далее <ArrowRight />
                </Button>
              ) : (
                <Button onClick={handlePublish} disabled={isSubmitting} aria-busy={isSubmitting}>
                  {isSubmitting ? "Публикуем..." : "Опубликовать заявку"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  )
}
