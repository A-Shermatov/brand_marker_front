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
  /** Admin tabs: any of these rights lets a member of staff see the tab. */
  permissions?: string[]
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
    id: "tariff",
    label: "Тариф и надёжность",
    href: "/customer/plan",
    match: ["/customer/plan", "/customer/trust"],
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
  // The plan is bought, the mark is earned: two pages, kept apart on purpose.
  tariff: [
    {
      id: "tariff",
      label: "Подписка",
      href: "/customer/plan",
      match: ["/customer/plan"],
    },
    {
      id: "trust",
      label: "Знак надёжности",
      href: "/customer/trust",
      match: ["/customer/trust"],
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
  tariff: {
    title: "Тариф и надёжность",
    description: "Подписка поднимает ваши заявки в ленте поставщиков; знак надёжности зарабатывается сделками",
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
    href: "/supplier/subscription",
    match: ["/supplier/subscription", "/supplier/trust"],
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
  // The same two pages, in the same order, as in the buying cabinet.
  tariff: [
    {
      id: "tariff",
      label: "Подписка",
      href: "/supplier/subscription",
      match: ["/supplier/subscription"],
    },
    {
      id: "trust",
      label: "Знак надёжности",
      href: "/supplier/trust",
      match: ["/supplier/trust"],
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
    description: "Подписка поднимает ваши товары и предложения в списках; знак надёжности зарабатывается сделками",
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

/**
 * The admin menu. Three groups, by what the administrator comes for: what
 * waits for a decision, everything that is on the marketplace, and the panel
 * itself. Every page has one place and is called by what is done there; a
 * section never keeps more than one row of tabs.
 */
const ADMIN_QUEUE = "Требует решения"
const ADMIN_MARKET = "Площадка"
const ADMIN_PANEL = "Управление"

export const ADMIN_HUBS: CabinetNavHub[] = [
  {
    id: "home",
    label: "Обзор",
    href: "/admin",
    match: ["/admin"],
  },
  {
    id: "verif",
    label: "Проверка клиентов",
    href: "/admin/verification",
    match: ["/admin/verification"],
    badgeKeys: ["companies"],
    group: ADMIN_QUEUE,
  },
  {
    id: "catalog",
    label: "Товары и услуги",
    href: "/admin/catalog",
    match: ["/admin/catalog"],
    badgeKeys: ["catalog"],
    group: ADMIN_QUEUE,
  },
  {
    id: "reports",
    label: "Жалобы",
    href: "/admin/moderation",
    match: ["/admin/moderation"],
    badgeKeys: ["reports"],
    group: ADMIN_QUEUE,
  },
  {
    id: "disputes",
    label: "Споры",
    href: "/admin/disputes",
    match: ["/admin/disputes"],
    badgeKeys: ["disputes"],
    group: ADMIN_QUEUE,
  },
  {
    id: "support",
    label: "Поддержка",
    href: "/admin/support",
    match: ["/admin/support"],
    badgeKeys: ["support"],
    group: ADMIN_QUEUE,
  },
  {
    id: "users",
    label: "Пользователи",
    href: "/admin/users",
    match: ["/admin/users", "/admin/companies", "/admin/trust"],
    group: ADMIN_MARKET,
  },
  {
    id: "deals",
    label: "Заявки и сделки",
    href: "/admin/rfqs",
    match: ["/admin/rfqs", "/admin/proposals", "/admin/contracts"],
    group: ADMIN_MARKET,
  },
  {
    id: "chats",
    label: "Переписки",
    href: "/admin/chats",
    match: ["/admin/chats"],
    badgeKeys: ["chats"],
    group: ADMIN_MARKET,
  },
  {
    id: "money",
    label: "Деньги",
    href: "/admin/finance",
    match: ["/admin/finance", "/admin/escrow", "/admin/gateway-logs"],
    badgeKeys: ["finance"],
    group: ADMIN_MARKET,
  },
  {
    id: "audit",
    label: "Журнал действий",
    href: "/admin/logs",
    match: ["/admin/logs"],
    group: ADMIN_PANEL,
  },
  {
    id: "staff",
    label: "Сотрудники и доступ",
    href: "/admin/staff",
    match: ["/admin/staff", "/admin/roles"],
    group: ADMIN_PANEL,
  },
  {
    id: "settings",
    label: "Настройки",
    href: "/admin/settings",
    match: ["/admin/settings", "/admin/categories", "/admin/telegram"],
    group: ADMIN_PANEL,
  },
]

/**
 * The tabs of the admin sections that keep several pages. A tab is a link:
 * to a page of its own, or to the same page with a search parameter. Each
 * names the right a member of staff needs to see it.
 */
export const ADMIN_SUBTABS: Record<string, CabinetSubtab[]> = {
  verif: [
    {
      id: "suppliers",
      label: "Компании-поставщики",
      href: "/admin/verification",
      permissions: ["admin_companies.view"],
    },
    {
      id: "buyers",
      label: "Компании-покупатели",
      href: "/admin/verification?tab=buyers",
      permissions: ["admin_companies.view"],
    },
    {
      id: "individuals",
      label: "Частные лица",
      href: "/admin/verification?tab=individuals",
      permissions: ["admin_companies.view", "admin_users.view"],
    },
    {
      id: "changes",
      label: "Изменения профилей",
      href: "/admin/verification?tab=changes",
      permissions: ["admin_companies.view"],
    },
  ],
  users: [
    {
      id: "people",
      label: "Люди",
      href: "/admin/users",
      match: ["/admin/users"],
      permissions: ["admin_users.view"],
    },
    {
      id: "companies",
      label: "Компании",
      href: "/admin/companies",
      match: ["/admin/companies"],
      permissions: ["admin_companies.view"],
    },
    {
      id: "trust",
      label: "Знак надёжности",
      href: "/admin/trust",
      match: ["/admin/trust"],
      permissions: ["admin_companies.view"],
    },
  ],
  deals: [
    {
      id: "rfqs",
      label: "Заявки",
      href: "/admin/rfqs",
      match: ["/admin/rfqs"],
      permissions: ["admin_rfqs.view"],
    },
    {
      id: "proposals",
      label: "Предложения",
      href: "/admin/proposals",
      match: ["/admin/proposals"],
      permissions: ["admin_proposals.view"],
    },
    {
      id: "contracts",
      label: "Сделки",
      href: "/admin/contracts",
      match: ["/admin/contracts"],
      permissions: ["admin_contracts.view"],
    },
  ],
  money: [
    {
      id: "ledger",
      label: "Платежи",
      href: "/admin/finance",
      match: ["/admin/finance"],
      permissions: ["admin_finance.view"],
    },
    {
      id: "escrow",
      label: "На гарантии",
      href: "/admin/finance?tab=escrow",
      permissions: ["admin_finance.view"],
    },
    {
      id: "billing",
      label: "Подписки и доходы",
      href: "/admin/finance?view=billing",
      permissions: ["admin_finance.view"],
    },
    {
      id: "merchants",
      label: "Счета продавцов",
      href: "/admin/finance?tab=merchants",
      permissions: ["admin_finance.view"],
    },
    {
      id: "bank",
      label: "Обмен с банком",
      href: "/admin/gateway-logs",
      match: ["/admin/gateway-logs"],
      permissions: ["admin_finance.view"],
    },
  ],
  staff: [
    {
      id: "staff",
      label: "Сотрудники",
      href: "/admin/staff",
      permissions: ["admin_staff.view"],
    },
    {
      id: "roles",
      label: "Роли и права",
      href: "/admin/staff?tab=roles",
      permissions: ["roles.manage"],
    },
  ],
  settings: [
    {
      id: "fees",
      label: "Комиссия и лимиты",
      href: "/admin/settings",
      match: ["/admin/settings"],
      permissions: ["platform_settings.view"],
    },
    {
      id: "categories",
      label: "Категории",
      href: "/admin/categories",
      match: ["/admin/categories"],
      permissions: ["admin_catalog.view"],
    },
    {
      id: "telegram",
      label: "Telegram-бот",
      href: "/admin/telegram",
      match: ["/admin/telegram"],
      permissions: ["platform_settings.view"],
    },
  ],
}

/** The right each admin page without tabs asks for. */
export const ADMIN_HUB_PERMISSIONS: Record<string, string[]> = {
  home: ["admin_dashboard.view"],
  catalog: ["admin_catalog.view"],
  reports: ["admin_reports.view"],
  disputes: ["admin_disputes.view"],
  support: ["admin_support.view"],
  chats: ["admin_contracts.view", "admin_proposals.view"],
  audit: ["audit_logs.view"],
}

export const ADMIN_SECTION_TITLE: Record<string, SectionMeta> = {
  verif: {
    title: "Проверка клиентов",
    description: "Документы компаний и людей. Подтверждайте только после сверки всех пунктов",
  },
  catalog: {
    title: "Товары и услуги",
    description: "Всё, что продают на площадке. Новые позиции выходят в каталог после вашего одобрения",
  },
  reports: {
    title: "Жалобы",
    description: "На что пожаловались пользователи: товары, заявки и предложения",
  },
  disputes: {
    title: "Споры",
    description: "Деньги по спорной сделке остаются на гарантии, пока вы не примете решение",
  },
  support: {
    title: "Поддержка",
    description: "Вопросы пользователей к площадке. Вы отвечаете от имени поддержки",
  },
  users: {
    title: "Пользователи",
    description: "Люди и компании площадки: кто это, чем занят и можно ли ему доверять",
  },
  deals: {
    title: "Заявки и сделки",
    description: "Что покупают, что предлагают и о чём уже договорились",
  },
  chats: {
    title: "Переписки",
    description: "О чём стороны пишут друг другу. Сообщения с признаками обхода площадки помечены",
  },
  money: {
    title: "Деньги",
    description: "Платежи, деньги на гарантии, подписки и сверка с банком",
  },
  audit: {
    title: "Журнал действий",
    description: "Кто, что и с какого устройства делал на площадке",
  },
  staff: {
    title: "Сотрудники и доступ",
    description: "Кто работает в этой панели и что ему разрешено",
  },
  settings: {
    title: "Настройки",
    description: "Правила площадки: комиссия, категории каталога и Telegram-бот",
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

/** A tab's address split into the path and the search parameters it names. */
const tabTarget = (href: string) => {
  const [path = "", query = ""] = href.split("?")
  return { path, params: new URLSearchParams(query) }
}

/**
 * The tab the address belongs to. A tab that names search parameters
 * («?tab=escrow») is the page only with those parameters; among the tabs that
 * fit, the one with the longest path wins, then the one that names more.
 */
export function matchSubtab(
  tabs: CabinetSubtab[],
  pathname: string,
  search?: string,
): CabinetSubtab | null {
  const current = new URLSearchParams(search ?? "")
  let best: CabinetSubtab | null = null
  let bestScore = -1
  for (const tab of tabs) {
    const { path, params } = tabTarget(tab.href)
    let named = 0
    let fits = true
    params.forEach((value, key) => {
      named += 1
      if (current.get(key) !== value) fits = false
    })
    if (!fits) continue
    const prefixes = tab.match?.length ? tab.match : [path]
    for (const prefix of prefixes) {
      if (!prefix) continue
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        const score = prefix.length * 10 + named
        if (score > bestScore) {
          best = tab
          bestScore = score
        }
      }
    }
  }
  return best ?? tabs[0] ?? null
}
