/**
 * Menus of the three cabinets, the tabs some sections keep inside, and the
 * name and one-line description each page shows at its top.
 */

export type CabinetRole = "buyer" | "supplier" | "admin"

export type CabinetNavHub = {
  id: string
  label: string
  /** Primary href when opening the hub from the sidebar */
  href: string
  /** Path prefixes that belong to this hub (for active state) */
  match: string[]
  badgeKeys?: string[]
  /** Heading of the menu group the item stands in; items without one come first. */
  group?: string
  /** Shown only when the person works as a company, or only as a private person. */
  only?: ProfileKind
}

/** On whose behalf the person works in the cabinet right now. */
export type ProfileKind = "individual" | "company"

/** The menu for this kind of profile; while the kind is unknown, only what everyone has. */
export const hubsFor = (hubs: CabinetNavHub[], kind: ProfileKind | null): CabinetNavHub[] =>
  hubs.filter((hub) => !hub.only || hub.only === kind)

/** Menu items in the order they are drawn, cut into groups by their headings. */
export const groupHubs = (hubs: CabinetNavHub[]): { label: string | null; hubs: CabinetNavHub[] }[] => {
  const groups: { label: string | null; hubs: CabinetNavHub[] }[] = []
  for (const hub of hubs) {
    const label = hub.group ?? null
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.hubs.push(hub)
    else groups.push({ label, hubs: [hub] })
  }
  return groups
}

export type CabinetSubtab = {
  id: string
  label: string
  href: string
  match?: string[]
}

export type SectionMeta = {
  title: string
  description: string
}

/**
 * The buyer's menu. Every page a person needs is one click away and is called
 * by what they do there; items that open one after another stand together
 * under a short heading. "Компания" and "Согласования" make sense only for a
 * company profile: a private person sees "Мой профиль" there instead.
 */
export const BUYER_HUBS: CabinetNavHub[] = [
  {
    id: "home",
    label: "Главная",
    href: "/customer",
    match: ["/customer"],
  },
  {
    id: "rfqs",
    label: "Мои заявки",
    href: "/customer/rfqs",
    match: ["/customer/rfqs"],
    badgeKeys: ["rfqs"],
    group: "Покупки",
  },
  {
    id: "catalog",
    label: "Каталог",
    href: "/customer/catalog",
    match: ["/customer/catalog", "/customer/cart"],
    badgeKeys: ["cart"],
    group: "Покупки",
  },
  {
    id: "suppliers",
    label: "Поставщики",
    href: "/customer/suppliers",
    match: ["/customer/suppliers"],
    group: "Покупки",
  },
  {
    id: "deals",
    label: "Сделки",
    href: "/customer/contracts?tab=active",
    match: ["/customer/contracts"],
    badgeKeys: ["deals"],
    group: "Сделки",
  },
  {
    id: "payments",
    label: "Оплаты и документы",
    href: "/customer/payments",
    match: ["/customer/payments"],
    group: "Сделки",
  },
  {
    id: "messages",
    label: "Сообщения",
    href: "/customer/messages",
    match: ["/customer/messages"],
    badgeKeys: ["messages"],
    group: "Сделки",
  },
  {
    id: "company",
    label: "Компания",
    href: "/customer/company",
    match: ["/customer/company"],
    group: "Аккаунт",
    only: "company",
  },
  {
    id: "approvals",
    label: "Согласования",
    href: "/customer/approvals",
    match: ["/customer/approvals"],
    badgeKeys: ["approvals"],
    group: "Аккаунт",
    only: "company",
  },
  {
    id: "profile",
    label: "Мой профиль",
    href: "/customer/profile",
    match: ["/customer/profile"],
    group: "Аккаунт",
  },
  {
    id: "reviews",
    label: "Отзывы",
    href: "/customer/reviews",
    match: ["/customer/reviews"],
    group: "Аккаунт",
  },
]

export const BUYER_SUBTABS: Record<string, CabinetSubtab[]> = {
  // The cart belongs to the catalogue: two views of one purchase.
  catalog: [
    {
      id: "catalog",
      label: "Товары и услуги",
      href: "/customer/catalog",
      match: ["/customer/catalog"],
    },
    {
      id: "cart",
      label: "Корзина",
      href: "/customer/cart",
      match: ["/customer/cart"],
    },
  ],
}

/** The name of each page as the menu calls it, and one line on what is there. */
export const BUYER_SECTION_TITLE: Record<string, SectionMeta> = {
  rfqs: {
    title: "Мои заявки",
    description: "Что вы ищете и какие предложения прислали поставщики",
  },
  catalog: {
    title: "Каталог",
    description: "Готовые товары и услуги: можно купить сразу, без заявки",
  },
  suppliers: {
    title: "Поставщики",
    description: "Компании и специалисты, которые продают на площадке",
  },
  deals: {
    title: "Сделки",
    description: "Ваши покупки: что в работе, что нужно оплатить или принять",
  },
  payments: {
    title: "Оплаты и документы",
    description: "Ваши платежи, деньги на гарантии банка, счета и возвраты",
  },
  messages: {
    title: "Сообщения",
    description: "Переписка с поставщиками по заявкам и сделкам",
  },
  company: {
    title: "Компания",
    description: "Сотрудники, их права и реквизиты компании",
  },
  approvals: {
    title: "Согласования",
    description: "Покупки сотрудников, которые ждут решения руководителя",
  },
  profile: {
    title: "Мой профиль",
    description: "Имя, фото, пароль и защита входа",
  },
  reviews: {
    title: "Отзывы",
    description: "Оценки, которые вы оставили поставщикам и получили от них",
  },
}

/** The supplier's menu, built the same way as the buyer's. */
export const SUPPLIER_HUBS: CabinetNavHub[] = [
  {
    id: "home",
    label: "Главная",
    href: "/supplier",
    match: ["/supplier"],
  },
  {
    id: "leads",
    label: "Заявки покупателей",
    href: "/supplier/rfqs?response=open",
    match: ["/supplier/rfqs"],
    badgeKeys: ["rfqs"],
    group: "Заказы",
  },
  {
    id: "quotes",
    label: "Мои предложения",
    href: "/supplier/proposals",
    match: ["/supplier/proposals"],
    group: "Заказы",
  },
  {
    id: "deals",
    label: "Сделки",
    href: "/supplier/contracts?tab=active",
    match: ["/supplier/contracts"],
    badgeKeys: ["deals"],
    group: "Заказы",
  },
  {
    id: "messages",
    label: "Сообщения",
    href: "/supplier/messages",
    match: ["/supplier/messages"],
    badgeKeys: ["messages"],
    group: "Заказы",
  },
  {
    id: "products",
    label: "Товары и услуги",
    href: "/supplier/catalog",
    match: ["/supplier/catalog", "/supplier/listings"],
    badgeKeys: ["catalog"],
    group: "Мой магазин",
  },
  {
    id: "customers",
    label: "Покупатели",
    href: "/supplier/customers",
    match: ["/supplier/customers"],
    group: "Мой магазин",
  },
  {
    id: "reviews",
    label: "Отзывы",
    href: "/supplier/reviews",
    match: ["/supplier/reviews"],
    group: "Мой магазин",
  },
  {
    id: "finance",
    label: "Деньги",
    href: "/supplier/finance",
    match: ["/supplier/finance"],
    group: "Деньги",
  },
  {
    id: "tariff",
    label: "Тариф и надёжность",
    href: "/supplier/trust",
    match: ["/supplier/trust", "/supplier/subscription"],
    group: "Деньги",
  },
  {
    id: "company",
    label: "Компания",
    href: "/supplier/team",
    match: ["/supplier/team", "/supplier/company"],
    group: "Аккаунт",
    only: "company",
  },
  {
    id: "profile",
    label: "Мой профиль",
    href: "/supplier/profile",
    match: ["/supplier/profile"],
    group: "Аккаунт",
  },
]

export const SUPPLIER_SUBTABS: Record<string, CabinetSubtab[]> = {
  company: [
    {
      id: "team",
      label: "Сотрудники и роли",
      href: "/supplier/team",
      match: ["/supplier/team"],
    },
    {
      id: "page",
      label: "Страница компании",
      href: "/supplier/company",
      match: ["/supplier/company"],
    },
  ],
  tariff: [
    {
      id: "trust",
      label: "Знак надёжности",
      href: "/supplier/trust",
      match: ["/supplier/trust"],
    },
    {
      id: "tariff",
      label: "Подписка",
      href: "/supplier/subscription",
      match: ["/supplier/subscription"],
    },
  ],
}

export const SUPPLIER_SECTION_TITLE: Record<string, SectionMeta> = {
  leads: {
    title: "Заявки покупателей",
    description: "Что сейчас ищут покупатели. Откройте заявку и отправьте своё предложение",
  },
  quotes: {
    title: "Мои предложения",
    description: "Ваши КП (коммерческие предложения) и что по ним решил покупатель",
  },
  deals: {
    title: "Сделки",
    description: "Заказы в работе: что отгрузить, что сдать и что уже оплачено",
  },
  messages: {
    title: "Сообщения",
    description: "Переписка с покупателями по заявкам и сделкам",
  },
  products: {
    title: "Товары и услуги",
    description: "Ваша витрина: то, что покупатели видят в каталоге",
  },
  customers: {
    title: "Покупатели",
    description: "С кем у вас были сделки",
  },
  reviews: {
    title: "Отзывы",
    description: "Оценки покупателей и ваши оценки им",
  },
  finance: {
    title: "Деньги",
    description: "Поступления по сделкам, баланс и выплаты на ваш счёт",
  },
  tariff: {
    title: "Тариф и надёжность",
    description: "Знак надёжности зарабатывается сделками, тариф поднимает вас в каталоге",
  },
  company: {
    title: "Компания",
    description: "Сотрудники, их права и страница компании",
  },
  profile: {
    title: "Мой профиль",
    description: "Ваша страничка для покупателей, имя, фото, пароль и защита входа",
  },
}

export const ADMIN_HUBS: CabinetNavHub[] = [
  {
    id: "home",
    label: "Обзор",
    href: "/admin",
    match: ["/admin"],
  },
  {
    id: "verif",
    label: "Проверки",
    href: "/admin/verification",
    match: [
      "/admin/verification",
      "/admin/moderation",
      "/admin/companies",
      "/admin/catalog",
      "/admin/rfqs",
      "/admin/proposals",
      "/admin/trust",
    ],
    badgeKeys: ["companies", "moderation"],
  },
  {
    id: "disputes",
    label: "Споры и чаты",
    href: "/admin/disputes",
    match: [
      "/admin/disputes",
      "/admin/chats",
      "/admin/support",
      "/admin/contracts",
    ],
    badgeKeys: ["disputes", "chats", "support"],
  },
  {
    id: "payouts",
    label: "Деньги",
    href: "/admin/finance",
    match: ["/admin/finance", "/admin/escrow", "/admin/gateway-logs"],
    badgeKeys: ["finance"],
  },
  {
    id: "users",
    label: "Пользователи",
    href: "/admin/users",
    match: ["/admin/users"],
  },
  {
    id: "audit",
    label: "Журнал действий",
    href: "/admin/logs",
    match: ["/admin/logs"],
  },
  {
    id: "cats",
    label: "Настройки",
    href: "/admin/settings",
    match: [
      "/admin/settings",
      "/admin/categories",
      "/admin/staff",
      "/admin/roles",
      "/admin/telegram",
    ],
  },
]

export const ADMIN_SUBTABS: Record<string, CabinetSubtab[]> = {
  verif: [
    {
      id: "verif",
      label: "Компании",
      href: "/admin/verification",
      match: ["/admin/verification"],
    },
    {
      id: "moder",
      label: "Товары и жалобы",
      href: "/admin/moderation",
      match: ["/admin/moderation", "/admin/catalog", "/admin/rfqs", "/admin/proposals"],
    },
    {
      id: "changes",
      label: "Изменения профилей",
      href: "/admin/companies",
      match: ["/admin/companies"],
    },
    {
      id: "trustadm",
      label: "Знак надёжности",
      href: "/admin/trust",
      match: ["/admin/trust"],
    },
  ],
  disputes: [
    {
      id: "disputes",
      label: "Споры",
      href: "/admin/disputes",
      match: ["/admin/disputes", "/admin/contracts"],
    },
    {
      id: "chats",
      label: "Все переписки",
      href: "/admin/chats",
      match: ["/admin/chats", "/admin/support"],
    },
  ],
  payouts: [
    {
      id: "payouts",
      label: "Выплаты",
      href: "/admin/finance?view=payouts",
      match: ["/admin/finance", "/admin/escrow"],
    },
    {
      id: "billing",
      label: "Подписки и доходы",
      href: "/admin/finance?view=billing",
      match: [],
    },
    {
      id: "bank-logs",
      label: "Логи банка",
      href: "/admin/gateway-logs",
      match: ["/admin/gateway-logs"],
    },
  ],
  cats: [
    {
      id: "cats",
      label: "Категории",
      href: "/admin/categories",
      match: ["/admin/categories"],
    },
    {
      id: "tierset",
      label: "Тарифы и правила",
      href: "/admin/settings",
      match: ["/admin/settings", "/admin/staff", "/admin/roles"],
    },
    {
      id: "telegram",
      label: "Telegram-бот",
      href: "/admin/telegram",
      match: ["/admin/telegram"],
    },
  ],
}

export const ADMIN_SECTION_TITLE: Record<string, SectionMeta> = {
  verif: {
    title: "Проверки",
    description: "Все проверки проходят через администратора",
  },
  disputes: {
    title: "Споры и чаты",
    description: "Решение конфликтов на основе переписки и документов",
  },
  payouts: {
    title: "Деньги",
    description: "Выплаты, подписки и логи банка для сверки с шлюзом",
  },
  cats: {
    title: "Настройки",
    description: "Категории, цены тарифов и правила Щита доверия",
  },
}

const exactHome = (pathname: string, home: string) => pathname === home

export function matchHub(
  hubs: CabinetNavHub[],
  pathname: string,
  homePath: string,
): CabinetNavHub | null {
  if (exactHome(pathname, homePath)) {
    return hubs.find((h) => h.id === "home") ?? null
  }
  // Prefer longest prefix among non-home hubs
  let best: CabinetNavHub | null = null
  let bestLen = -1
  for (const hub of hubs) {
    if (hub.id === "home") continue
    for (const prefix of hub.match) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (prefix.length > bestLen) {
          best = hub
          bestLen = prefix.length
        }
      }
    }
  }
  return best
}

export function matchSubtab(
  tabs: CabinetSubtab[],
  pathname: string,
  search?: string,
): CabinetSubtab | null {
  // Prefer query-aware finance billing tab
  if (search?.includes("view=billing")) {
    const billing = tabs.find((t) => t.id === "billing")
    if (billing) return billing
  }
  let best: CabinetSubtab | null = null
  let bestLen = -1
  for (const tab of tabs) {
    const prefixes = tab.match?.length
      ? tab.match
      : [tab.href.split("?")[0]!]
    for (const prefix of prefixes) {
      if (!prefix) continue
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        if (prefix.length > bestLen) {
          best = tab
          bestLen = prefix.length
        }
      }
    }
  }
  return best ?? tabs[0] ?? null
}
