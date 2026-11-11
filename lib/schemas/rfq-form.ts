import { z } from "zod"
import { ISO_DATE_TIME_MESSAGE, deadlineMoment, isValidIsoDateTime, startMoment } from "@/lib/iso-date"

const rfqDateYearRange = () => {
  const current = new Date().getFullYear()
  return { minYear: current - 1, maxYear: current + 10 }
}

/** A day, or a day with hours and minutes: `yyyy-mm-dd` / `yyyy-mm-ddThh:mm`. */
const dateTimeRequired = (emptyMessage: string) =>
  z
    .string()
    .min(1, emptyMessage)
    .refine((v) => isValidIsoDateTime(v, rfqDateYearRange()), ISO_DATE_TIME_MESSAGE)

/** Any length the buyer likes (the field itself stops at what the database holds). */
export const RFQ_TITLE_MAX_LENGTH = 500
const titleRequired = z.string().trim().min(1, "Напишите название заявки")

const baseSchema = z.object({
  type: z.enum(["product", "service"]),
  title: titleRequired,
  category_id: z.string().min(1, "Выберите категорию"),
  budget_type: z.enum(["fixed", "range", "open"]),
  budget_from: z.string().optional(),
  budget_to: z.string().optional(),
  currency: z.enum(["TJS", "USD", "EUR", "KZT", "CNY"]),
  deadline: dateTimeRequired("Укажите дедлайн заявки — до какого времени принимать предложения"),
  visibility: z.enum(["public", "invited_only"]).default("public"),
})

const productSchema = baseSchema.extend({
  type: z.literal("product"),
  category_id: z
    .string()
    .min(1, "Выберите категорию — так заявку увидят нужные поставщики"),
  description: z.string().min(1, "Опишите позицию"),
  quantity: z.string().min(1, "Количество больше нуля"),
  delivery_country: z.string().min(1, "Укажите адрес доставки"),
  delivery_city: z.string().min(1, "Укажите адрес доставки"),
  delivery_address: z.string().optional(),
  delivery_date: dateTimeRequired("Укажите дедлайн поставки — когда товар должен быть у вас"),
})

const serviceSchema = baseSchema.extend({
  type: z.literal("service"),
  description: z.string().min(10, "Описание от 10 символов"),
  // Worked out from the two dates below; kept for screens that show it as text.
  project_duration: z.string(),
  start_date: dateTimeRequired("Укажите, когда начать работу"),
  delivery_date: dateTimeRequired("Укажите дедлайн работы — когда результат должен быть готов"),
  team_size_required: z.string().optional(),
  experience_required: z.string().optional(),
})

export const rfqFormSchema = z.discriminatedUnion("type", [productSchema, serviceSchema])

export type RfqFormValues = z.infer<typeof rfqFormSchema>

/** The dates must make sense together: answers first, then the work or the delivery. */
const validateDates = (values: RfqFormValues, now: Date): Record<string, string> => {
  const errors: Record<string, string> = {}
  const deadline = deadlineMoment(values.deadline)
  const due = deadlineMoment(values.delivery_date)
  if (deadline && deadline.getTime() < now.getTime()) {
    errors.deadline = "Этот срок уже прошёл — выберите дату и время позже"
  }
  if (deadline && due && due.getTime() < deadline.getTime()) {
    errors.delivery_date =
      values.type === "product"
        ? "Дедлайн поставки не может быть раньше дедлайна заявки"
        : "Дедлайн работы не может быть раньше дедлайна заявки"
  }
  if (values.type === "service") {
    const start = startMoment(values.start_date)
    if (start && due && due.getTime() < start.getTime() && !errors.delivery_date) {
      errors.delivery_date = "Дедлайн работы не может быть раньше начала работы"
    }
  }
  return errors
}

const validateAmounts = (values: RfqFormValues): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (values.budget_type === "fixed") {
    const from = Number(values.budget_from)
    if (!values.budget_from || Number.isNaN(from) || from <= 0) {
      errors.budget_from = "Укажите бюджет"
    }
  }
  if (values.budget_type === "range") {
    const from = Number(values.budget_from)
    const to = Number(values.budget_to)
    if (!values.budget_from || Number.isNaN(from) || from <= 0) {
      errors.budget_from = "Укажите минимум"
    }
    if (!values.budget_to || Number.isNaN(to) || to <= from) {
      errors.budget_to = "Максимум должен быть больше минимума"
    }
  }
  if (values.type === "product") {
    const qty = Number(values.quantity)
    if (Number.isNaN(qty) || qty < 1) errors.quantity = "Количество от 1"
  }
  return errors
}

export const validateRfqForm = (
  values: RfqFormValues,
  now: Date = new Date(),
): Record<string, string> => {
  const result = rfqFormSchema.safeParse(values)
  const errors: Record<string, string> = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "form")
      if (!errors[key]) errors[key] = issue.message
    }
  }
  return { ...validateAmounts(values), ...validateDates(values, now), ...errors }
}
