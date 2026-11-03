/**
 * Reliability marks («знак надёжности»): earned automatically for completed
 * deals, rating and on-time delivery; never sold. Ladder: silver → gold → diamond.
 * Thresholds must match the backend (app/modules/trust/levels.py).
 */

export const TRUST_MARK_NAME = "Знак надёжности"

export const REPUTATION_TIERS = [
  "none",
  "silver",
  "gold",
  "diamond",
] as const

export type ReputationTier = (typeof REPUTATION_TIERS)[number]

/** Legacy API / UI values remapped to the current tiers. */
export type LegacyReputationTier =
  | ReputationTier
  | "verified"
  | "shield"

export type TrustLevelMeta = {
  id: Exclude<ReputationTier, "none">
  name: string
  condition: string
  description: string
  minCompleted: number
  minRating: number
  /** On-time / success rate %, null = not required */
  minOnTime: number | null
  minMonths: number
  /** Accent for borders and progress bars */
  accent: string
  /** Soft background behind the mark on cards */
  soft: string
}

export const TRUST_LEVELS: TrustLevelMeta[] = [
  {
    id: "silver",
    name: "Серебро",
    condition: "от 10 сделок · рейтинг от 4.5 · 90% без споров",
    description: "Первые стабильные сделки после проверки документов.",
    minCompleted: 10,
    minRating: 4.5,
    minOnTime: 90,
    minMonths: 3,
    accent: "#8A919B",
    soft: "#F2F3F5",
  },
  {
    id: "gold",
    name: "Золото",
    condition: "от 40 сделок · рейтинг от 4.7 · 95% без споров",
    description: "Высокий рейтинг и спокойные сделки на длинной дистанции.",
    minCompleted: 40,
    minRating: 4.7,
    minOnTime: 95,
    minMonths: 12,
    accent: "#C08A17",
    soft: "#FBF4E2",
  },
  {
    id: "diamond",
    name: "Алмаз",
    condition: "от 100 сделок · рейтинг от 4.8 · 98% без споров",
    description: "Высший знак площадки: почти без срывов и споров.",
    minCompleted: 100,
    minRating: 4.8,
    minOnTime: 98,
    minMonths: 24,
    accent: "#A12BC0",
    soft: "#F8EBFB",
  },
]

export const normalizeReputationTier = (
  tier: string | null | undefined,
): ReputationTier => {
  switch ((tier || "").toLowerCase()) {
    case "silver":
      return "silver"
    case "gold":
      return "gold"
    case "diamond":
      return "diamond"
    // legacy ladder
    case "verified":
    case "shield":
    case "none":
    default:
      return "none"
  }
}

export const reputationTierLabel = (
  tier: LegacyReputationTier | string | null | undefined,
): string => {
  const meta = trustLevelMeta(tier)
  return meta ? meta.name : "Без знака"
}

/** Full sentence for tooltips and screen readers. */
export const reputationTierHint = (
  tier: LegacyReputationTier | string | null | undefined,
): string => {
  const meta = trustLevelMeta(tier)
  if (!meta) return `${TRUST_MARK_NAME} пока не получен`
  return `${TRUST_MARK_NAME} «${meta.name}»: ${meta.condition}. Выдаёт площадка, купить нельзя`
}

export const trustLevelMeta = (
  tier: ReputationTier | string | null | undefined,
): TrustLevelMeta | null => {
  const n = normalizeReputationTier(tier)
  if (n === "none") return null
  return TRUST_LEVELS.find((t) => t.id === n) ?? null
}

export type ReputationStats = {
  verification_status?: string | null
  completed_contracts?: number | null
  rating?: number | null
  /** On-time / success %, 0–100 */
  success_rate?: number | null
  /** Months on platform — optional */
  months_on_platform?: number | null
  disputes_lost?: number | null
}

export const resolveReputationTier = (stats: ReputationStats): ReputationTier => {
  const verified = (stats.verification_status || "").toLowerCase() === "verified"
  if (!verified) return "none"

  const completed = Math.max(0, Number(stats.completed_contracts) || 0)
  const rating = Number(stats.rating) || 0
  const onTime =
    stats.success_rate == null || Number.isNaN(Number(stats.success_rate))
      ? null
      : Number(stats.success_rate)
  const months = Math.max(0, Number(stats.months_on_platform) || 0)
  const disputes = Math.max(0, Number(stats.disputes_lost) || 0)

  const meets = (L: TrustLevelMeta) => {
    if (completed < L.minCompleted) return false
    if (rating < L.minRating) return false
    // Skip when API has no on-time / tenure yet
    if (
      L.minOnTime != null &&
      onTime != null &&
      onTime < L.minOnTime
    ) {
      return false
    }
    if (months > 0 && months < L.minMonths) return false
    if (disputes > 0) return false
    return true
  }

  // Highest first
  for (const L of [...TRUST_LEVELS].reverse()) {
    if (meets(L)) return L.id
  }
  return "none"
}

/** Prefer the tier computed by the API; fall back to local stats. */
export const pickReputationTier = (
  apiTier: string | null | undefined,
  stats: ReputationStats,
): ReputationTier => {
  const fromApi = normalizeReputationTier(apiTier)
  return fromApi !== "none" ? fromApi : resolveReputationTier(stats)
}
