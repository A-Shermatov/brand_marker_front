import type { Currency } from "@/types"
import { calendarDaysBetween, deadlineMoment, splitDateTime } from "@/lib/iso-date"

/** From this amount up, money is shown compactly (100 тыс., 1 млн, …). */
const COMPACT_MONEY_THRESHOLD = 100_000
const SCIENTIFIC_THRESHOLD = 1e15
const NUMERIC_DELIVERY_RE = /^\d+(\.\d+)?([eE][+-]?\d+)?$/

const toShortScientific = (value: number): string => {
  const [coeff, exp] = value.toExponential(1).split("e")
  return `${coeff}×10^${Number(exp)}`
}

const formatCompactNumber = (value: number): string => {
  if (!Number.isFinite(value)) return "—"
  if (Math.abs(value) >= SCIENTIFIC_THRESHOLD) return toShortScientific(value)
  return new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

/** Full amount with grouping, never compact — for tooltips, invoices, inputs. */
export const formatCurrencyExact = (
  value: number,
  currency: Currency | string = "TJS",
): string => {
  if (!Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatCompactCurrency = (
  value: number,
  currency: Currency | string = "TJS",
): string => {
  if (!Number.isFinite(value)) return "—"
  if (Math.abs(value) >= SCIENTIFIC_THRESHOLD) {
    return `${toShortScientific(value)} ${currency}`
  }
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Default money display for UI: compact from 100 тыс., scientific from 1e15.
 * Use {@link formatCurrencyExact} when the full figure must be shown.
 */
export const formatCurrency = (
  value: number,
  currency: Currency | string = "TJS",
): string => {
  if (!Number.isFinite(value)) return "—"
  if (Math.abs(value) >= COMPACT_MONEY_THRESHOLD) {
    return formatCompactCurrency(value, currency)
  }
  return formatCurrencyExact(value, currency)
}

export const formatPrice = (value: number): string => formatCurrency(value, "TJS")

/** Alias of {@link formatCurrency} — kept for existing call sites. */
export const formatMoneyDisplay = (
  value: number,
  currency: Currency | string = "TJS",
): string => formatCurrency(value, currency)

/** Short RFQ number for tables/headers, e.g. З‑0421 */
export const formatRfqNo = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  const short = (digits || rfqId).slice(-4)
  return `З‑${short}`
}

export const formatDeliveryTime = (value: string | null | undefined): string => {
  if (value == null || value.trim() === "") return "Не указан"
  const trimmed = value.trim()
  if (!NUMERIC_DELIVERY_RE.test(trimmed)) return trimmed

  const num = Number(trimmed)
  if (!Number.isFinite(num)) return "—"

  return `${formatCompactNumber(num)} дн`
}

const RU_DAY = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" })

/**
 * «20 нояб. 2026 г.» for a day or a timestamp. A request date that carries a
 * time of day («2026-11-20T18:30», set by the buyer) keeps it: «…, 18:30».
 */
export const formatIsoDate = (iso: string): string => {
  const wallClock = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(iso ?? "")
  if (!wallClock) return RU_DAY.format(new Date(iso))
  const [, year, month, day, hours, minutes] = wallClock
  // Built from its parts: `new Date("2026-11-20")` is UTC midnight, the day before west of Greenwich.
  const label = RU_DAY.format(new Date(Number(year), Number(month) - 1, Number(day)))
  return hours ? `${label}, ${hours}:${minutes}` : label
}

/** Date + time for payment/withdrawal history (e.g. «31 окт. 2026, 10:31»). */
export const formatIsoDateTime = (iso: string | null | undefined): string => {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const formatRating = (value: number): string => value.toFixed(1)

/** Russian plural form: pluralRu(3, "заявка", "заявки", "заявок") → "заявки". */
export const pluralRu = (count: number, one: string, few: string, many: string): string => {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export const formatCount = (count: number, one: string, few: string, many: string): string =>
  `${count} ${pluralRu(count, one, few, many)}`

const DAY_MS = 24 * 60 * 60 * 1000

/** Whole days left until the end of the given ISO date (0 = today is the last day, negative = passed). */
export const getDaysLeft = (isoDate: string, now: Date = new Date()): number => {
  const end = new Date(`${isoDate.slice(0, 10)}T23:59:59`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((endDay.getTime() - today.getTime()) / DAY_MS)
}

/**
 * How long a request date is away, in words: «осталось 7 дней», «сегодня до 18:30»,
 * «срок истёк». Knows the time of day when the date carries one.
 */
export const formatTimeLeft = (value: string | null | undefined, now: Date = new Date()): string => {
  const moment = deadlineMoment(value)
  if (!moment || !value) return ""
  if (moment.getTime() < now.getTime()) return "срок истёк"
  const daysLeft = getDaysLeft(value, now)
  if (daysLeft > 0) return formatDaysLeft(daysLeft)
  const { time } = splitDateTime(value)
  return time ? `сегодня до ${time}` : "сегодня последний день"
}

/** «14 дней» from one request date to another; "" when that cannot be told. */
export const formatDateSpan = (from: string | null | undefined, to: string | null | undefined): string => {
  const days = calendarDaysBetween(from, to)
  if (days == null) return ""
  return days === 0 ? "в тот же день" : formatCount(days, "день", "дня", "дней")
}

export const formatDaysLeft = (daysLeft: number): string => {
  if (daysLeft < 0) return "срок истёк"
  if (daysLeft === 0) return "последний день"
  return `${pluralRu(daysLeft, "остался", "осталось", "осталось")} ${formatCount(daysLeft, "день", "дня", "дней")}`
}

export const formatRelativeTime = (timestamp: number | string): string => {
  const ms = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime()
  if (!Number.isFinite(ms)) return "—"
  const diffMs = Date.now() - ms
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "только что"
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `${days} дн назад`
}

export const formatRelativeIso = (iso: string): string => formatRelativeTime(iso)

/** A request without a budget: the price comes from the suppliers' offers. */
export const RFQ_BUDGET_BY_PROPOSALS = "По предложениям"

export const formatRfqBudget = (
  budgetType: string,
  budgetFrom: number | null,
  budgetTo: number | null,
  currency: string,
): string => {
  if (budgetType === "open") return RFQ_BUDGET_BY_PROPOSALS
  if (budgetType === "fixed" && budgetFrom != null) {
    return formatCurrency(budgetFrom, currency)
  }
  if (budgetType === "range" && budgetFrom != null && budgetTo != null) {
    return `${formatCurrency(budgetFrom, currency)} – ${formatCurrency(budgetTo, currency)}`
  }
  if (budgetFrom != null) return formatCurrency(budgetFrom, currency)
  return RFQ_BUDGET_BY_PROPOSALS
}
