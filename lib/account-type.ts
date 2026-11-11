/**
 * Who a person is on the platform, chosen at registration: a company (or sole
 * trader) with employees, or a private person working under their own name.
 * A company employee is neither: they join by invitation.
 */

export type AccountType = "company" | "individual"

export const ACCOUNT_TYPE_OPTIONS: { type: AccountType; title: string; desc: string }[] = [
  {
    type: "company",
    title: "Компания или ИП",
    desc: "покупаю или продаю от имени организации",
  },
  {
    type: "individual",
    title: "Частное лицо",
    desc: "фрилансер, мастер, специалист",
  },
]

/**
 * Where a person lands right after registering. A private supplier goes
 * straight to their page: it is what buyers will see, and it starts empty.
 */
export const afterRegisterPath = ({
  role,
  accountType,
  invited,
}: {
  role: "customer" | "supplier"
  accountType: AccountType
  invited: boolean
}): string => {
  if (role === "customer") return "/customer"
  if (!invited && accountType === "individual") return "/supplier/profile?welcome=1"
  return "/supplier"
}

/** "180 TJS / час", "от 2 000 TJS за проект"; null when no rate is set. */
export const formatRate = (
  amount: number | null | undefined,
  currency: string | null | undefined,
  unit: "hour" | "project" | null | undefined,
): string | null => {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null
  const sum = `${new Intl.NumberFormat("ru-RU").format(amount)} ${currency || "TJS"}`
  return unit === "hour" ? `${sum} / час` : `от ${sum} за проект`
}

/** Skills typed as "Python, FastAPI; боты" → a clean list without repeats. */
export const parseSkills = (raw: string, limit = 20): string[] => {
  const seen = new Map<string, string>()
  for (const part of raw.split(/[,;\n]/)) {
    const skill = part.replace(/\s+/g, " ").trim().slice(0, 40)
    if (skill && !seen.has(skill.toLowerCase())) seen.set(skill.toLowerCase(), skill)
  }
  return [...seen.values()].slice(0, limit)
}
