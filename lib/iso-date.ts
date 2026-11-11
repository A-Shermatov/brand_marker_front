export const ISO_DATE_MESSAGE = "Укажите дату в формате дд.мм.гггг"
export const RU_DATE_PLACEHOLDER = "дд.мм.гггг"

type IsoDateOptions = {
  minYear?: number
  maxYear?: number
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const RU_DATE_RE = /^(\d{2})\.(\d{2})\.(\d{4})$/

export const isValidIsoDate = (
  value: string,
  options: IsoDateOptions = {},
): boolean => {
  const match = ISO_DATE_RE.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (options.minYear != null && year < options.minYear) return false
  if (options.maxYear != null && year > options.maxYear) return false

  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export const isoDateBounds = (minYear: number, maxYear: number) => ({
  min: `${minYear}-01-01`,
  max: `${maxYear}-12-31`,
})

/**
 * Keep at most YYYY-MM-DD; reject completed dates outside year bounds.
 * Empty string and incomplete values while typing are allowed.
 */
export const sanitizeIsoDateInput = (
  value: string,
  options: IsoDateOptions = {},
): string | null => {
  const clipped = value.length > 10 ? value.slice(0, 10) : value
  if (!clipped) return ""
  if (!ISO_DATE_RE.test(clipped)) {
    // Allow incomplete draft while the browser date picker is filling the value
    if (clipped.length < 10) return clipped
    return null
  }
  if (!isValidIsoDate(clipped, options)) return null
  return clipped
}

/** Format ISO `yyyy-mm-dd` → display `дд.мм.гггг`. */
export const isoToRuDate = (iso: string): string => {
  const match = ISO_DATE_RE.exec(iso.trim())
  if (!match) return ""
  return `${match[3]}.${match[2]}.${match[1]}`
}

/** Parse display `дд.мм.гггг` → ISO `yyyy-mm-dd`, or "" if incomplete/invalid. */
export const ruDateToIso = (
  ru: string,
  options: IsoDateOptions = {},
): string => {
  const match = RU_DATE_RE.exec(ru.trim())
  if (!match) return ""
  const day = match[1]
  const month = match[2]
  const year = match[3]
  const iso = `${year}-${month}-${day}`
  return isValidIsoDate(iso, options) ? iso : ""
}

/** Keep only digits and format as `дд.мм.гггг` while typing (max 8 digits). */
export const maskRuDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

// ---------------------------------------------------------------------------
// A date with an optional time of day: `yyyy-mm-dd` or `yyyy-mm-ddThh:mm`.
// Request deadlines use it: a day alone means "through the end of that day".
// ---------------------------------------------------------------------------

export const RU_TIME_PLACEHOLDER = "чч:мм"
export const ISO_DATE_TIME_MESSAGE = "Укажите дату: дд.мм.гггг, время — чч:мм"

const ISO_DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/
const TIME_RE = /^(\d{2}):(\d{2})$/

export const isValidTime = (value: string): boolean => {
  const match = TIME_RE.exec(value)
  if (!match) return false
  return Number(match[1]) <= 23 && Number(match[2]) <= 59
}

/** "2026-11-20T18:30" → { date: "2026-11-20", time: "18:30" }; a day alone has an empty time. */
export const splitDateTime = (value: string | null | undefined): { date: string; time: string } => {
  const match = ISO_DATE_TIME_RE.exec((value ?? "").trim())
  if (!match) return { date: "", time: "" }
  return { date: match[1], time: match[2] ?? "" }
}

export const joinDateTime = (date: string, time: string): string => {
  if (!date) return ""
  return time ? `${date}T${time}` : date
}

export const isValidIsoDateTime = (value: string, options: IsoDateOptions = {}): boolean => {
  const { date, time } = splitDateTime(value)
  if (!date || joinDateTime(date, time) !== value) return false
  if (!isValidIsoDate(date, options)) return false
  return time === "" || isValidTime(time)
}

/** Keep only digits and format as `чч:мм` while typing. */
export const maskTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

/**
 * The moment a deadline runs out, in the reader's local time: the given minute,
 * or the last minute of the day when no time was set. Null for anything else.
 */
export const deadlineMoment = (value: string | null | undefined): Date | null => {
  const { date, time } = splitDateTime(value)
  if (!date || !isValidIsoDate(date)) return null
  const [year, month, day] = date.split("-").map(Number)
  if (time && isValidTime(time)) {
    const [hours, minutes] = time.split(":").map(Number)
    return new Date(year, month - 1, day, hours, minutes, 0, 0)
  }
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

export const isDeadlinePassed = (value: string | null | undefined, now: Date = new Date()): boolean => {
  const moment = deadlineMoment(value)
  return moment ? moment.getTime() < now.getTime() : false
}

/** "yyyy-mm-dd" for a local calendar day. */
export const toIsoDay = (day: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
}

/** The moment a period starts: the given minute, or the first minute of the day. */
export const startMoment = (value: string | null | undefined): Date | null => {
  const { date, time } = splitDateTime(value)
  if (!date || !isValidIsoDate(date)) return null
  const [year, month, day] = date.split("-").map(Number)
  if (time && isValidTime(time)) {
    const [hours, minutes] = time.split(":").map(Number)
    return new Date(year, month - 1, day, hours, minutes, 0, 0)
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/** Whole calendar days from one request date to another; null when either is not a date or they run backwards. */
export const calendarDaysBetween = (from: string | null | undefined, to: string | null | undefined): number | null => {
  const start = splitDateTime(from).date
  const end = splitDateTime(to).date
  if (!start || !end || !isValidIsoDate(start) || !isValidIsoDate(end) || end < start) return null
  const [sy, sm, sd] = start.split("-").map(Number)
  const [ey, em, ed] = end.split("-").map(Number)
  return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000)
}
