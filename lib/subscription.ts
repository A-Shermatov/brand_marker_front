import type { SubscriptionPlan } from "@/lib/store/subscription-store"

/** A plan is bought for one cabinet: the selling one or the buying one. */
export type PlanSide = "supplier" | "buyer"

export interface PlanMeta {
  id: Exclude<SubscriptionPlan, "none">
  name: string
  price: number
  tagline: string
  /** What the plan gives in the selling cabinet. */
  features: string[]
  /** What the same plan gives in the buying cabinet. */
  buyerFeatures: string[]
  highlighted?: boolean
}

export const plans: PlanMeta[] = [
  {
    id: "start",
    name: "Старт",
    price: 1990,
    tagline: "Для начала продвижения",
    features: [
      "Товары и услуги выше обычных в каталоге",
      "Ваши предложения покупатель видит первыми",
      "Выделение цветом и метка «В топе»",
      "До 10 активных позиций",
      "До 2 компаний",
    ],
    buyerFeatures: [
      "Заявки выше обычных в ленте поставщиков",
      "Выделение цветом и метка «В топе»",
    ],
  },
  {
    id: "pro",
    name: "Про",
    price: 4990,
    tagline: "Оптимально для роста",
    features: [
      "Всё из тарифа «Старт»",
      "Место выше «Старта» во всех списках",
      "Расширенная аналитика",
      "До 50 активных позиций",
      "До 5 компаний",
    ],
    buyerFeatures: [
      "Всё из тарифа «Старт»",
      "Заявки выше, чем у тарифа «Старт»",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Бизнес",
    price: 9990,
    tagline: "Максимальная видимость",
    features: [
      "Всё из тарифа «Про»",
      "Первое место во всех списках",
      "Персональный менеджер",
      "Безлимит позиций",
      "Безлимит компаний",
    ],
    buyerFeatures: [
      "Всё из тарифа «Про»",
      "Заявки на первом месте в ленте",
    ],
  },
]

export const planFeatures = (plan: PlanMeta, side: PlanSide): string[] =>
  side === "buyer" ? plan.buyerFeatures : plan.features

/** The words of each cabinet: what is lifted, who sees it, where the page is. */
export const PLAN_SIDE_COPY: Record<
  PlanSide,
  { cabinet: string; otherCabinet: string; lifted: string; audience: string; href: string; idle: string; active: string }
> = {
  supplier: {
    cabinet: "кабинете поставщика",
    otherCabinet: "кабинета покупателя",
    lifted: "товары, услуги и предложения",
    audience: "покупатели",
    href: "/supplier/subscription",
    idle: "С подпиской ваши товары, услуги и предложения стоят первыми в списках и выделены цветом.",
    active: "Ваши товары, услуги и предложения стоят первыми в списках и выделены цветом.",
  },
  buyer: {
    cabinet: "кабинете покупателя",
    otherCabinet: "кабинета поставщика",
    lifted: "заявки",
    audience: "поставщики",
    href: "/customer/plan",
    idle: "С подпиской ваши заявки стоят первыми в ленте поставщиков и выделены цветом.",
    active: "Ваши заявки стоят первыми в ленте поставщиков и выделены цветом.",
  },
}

export type PaidPlan = PlanMeta["id"]

export const normalizePlan = (plan: string | null | undefined): PaidPlan | null => {
  const id = (plan || "").toLowerCase()
  return plans.some((p) => p.id === id) ? (id as PaidPlan) : null
}

/** Tooltip text: a paid plan must never look like an earned reliability mark. */
export const planMarkHint = (plan: string | null | undefined): string => {
  const id = normalizePlan(plan)
  if (!id) return "Без подписки"
  const meta = plans.find((p) => p.id === id)!
  return `Тариф «${meta.name}»: платная подписка и продвижение на площадке, не знак надёжности`
}

/** Tooltip of a highlighted card: say plainly that the place is paid for. */
export const PROMOTED_HINT = "Размещение по платной подписке: показывается первым и выделено цветом"

export const planName = (plan: SubscriptionPlan): string =>
  plan === "none" ? "Нет подписки" : plans.find((p) => p.id === plan)?.name ?? plan

export const companyLimits: Record<SubscriptionPlan, number | null> = {
  none: 1,
  start: 2,
  pro: 5,
  business: null,
}

export const getCompanyLimit = (plan: SubscriptionPlan): number | null =>
  companyLimits[plan]

export const canCreateMoreCompanies = (
  ownedCount: number,
  plan: SubscriptionPlan,
): boolean => {
  const limit = getCompanyLimit(plan)
  if (limit === null) return true
  return ownedCount < limit
}
