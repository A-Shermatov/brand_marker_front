/** Monthly sums for dashboard charts. No sample data: empty months are zero. */

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

export type MonthPoint = {
  key: string
  label: string
  /** One value per series name */
  values: Record<string, number>
}

type Dated = { created_at: string; amount: number | string }

/**
 * Last `months` calendar months, oldest first. `seriesOf` names the series an
 * item belongs to (or null to skip it).
 */
export const monthlySeries = <T extends Dated>(
  items: T[],
  seriesOf: (item: T) => string | null,
  { months = 6, now = new Date() }: { months?: number; now?: Date } = {},
): MonthPoint[] => {
  const points: MonthPoint[] = []
  const index = new Map<string, MonthPoint>()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const point = { key, label: MONTHS_SHORT[d.getMonth()]!, values: {} }
    points.push(point)
    index.set(key, point)
  }
  for (const item of items) {
    const series = seriesOf(item)
    if (!series) continue
    const d = new Date(item.created_at)
    if (Number.isNaN(d.getTime())) continue
    const point = index.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (!point) continue
    point.values[series] = (point.values[series] ?? 0) + Number(item.amount || 0)
  }
  return points
}

export const seriesTotal = (points: MonthPoint[], series: string, last = points.length) =>
  points.slice(-last).reduce((sum, p) => sum + (p.values[series] ?? 0), 0)

/** Change of the last month against the one before, in %; null when not comparable. */
export const monthOverMonth = (points: MonthPoint[], series: string): number | null => {
  const current = points.at(-1)?.values[series] ?? 0
  const previous = points.at(-2)?.values[series] ?? 0
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}
