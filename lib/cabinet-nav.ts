/**
 * CNAV v7 + SUBTABS + SECTION_TITLE from BrendMarket-v7.1.html
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
  /** Listed under "Ещё" in the menu rather than among the main sections. */
  more?: boolean
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

export const BUYER_HUBS: CabinetNavHub[] = [
  {
    id: "home",
    label: "Главная",
    href: "/customer",
    match: ["/customer"],
  },
  {
    id: "rfqs",
    label: "Закупки",
    href: "/customer/rfqs?status=quotes",
    match: ["/customer/rfqs", "/customer/approvals"],
    badgeKeys: ["rfqs", "approvals"],
  },
  {
    id: "deals",
    label: "Сделки и оплаты",
    href: "/customer/contracts?tab=active",
    match: ["/customer/contracts", "/customer/payments"],
    badgeKeys: ["deals"],
  },
  {
    id: "suppliers",
    label: "Поставщики",
    href: "/customer/suppliers",
    match: ["/customer/suppliers"],
  },
  {
    id: "messages",
    label: "Сообщения",
    href: "/customer/messages",
    match: ["/customer/messages"],
    badgeKeys: ["messages"],
  },
  {
    id: "catalog",
    label: "Каталог товаров",
    href: "/customer/catalog",
    match: ["/customer/catalog", "/customer/cart"],
    badgeKeys: ["cart"],
  },
  {
    id: "company",
    label: "Компания",
    href: "/customer/company",
    match: ["/customer/company", "/customer/plan", "/customer/profile"],
    more: true,
  },
]

export const BUYER_SUBTABS: Record<string, CabinetSubtab[]> = {
  rfqs: [
    {
      id: "rfqs",
      label: "Заявки",
      href: "/customer/rfqs?status=quotes",
      match: ["/customer/rfqs"],
    },
    {
      id: "approvals",
      label: "Согласования",
      href: "/customer/approvals",
      match: ["/customer/approvals"],
    },
  ],
  deals: [
    {
      id: "deals",
      label: "Сделки",
      href: "/customer/contracts?tab=active",
      match: ["/customer/contracts"],
    },
    {
      id: "finance",
      label: "Платежи и документы",
      href: "/customer/payments",
      match: ["/customer/payments"],
    },
  ],
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
  company: [
    {
      id: "company",
      label: "Сотрудники и реквизиты",
      href: "/customer/company",
      match: ["/customer/company", "/customer/profile"],
    },
    {
      id: "plan",
      label: "Тариф и услуги",
      href: "/customer/plan",
      match: ["/customer/plan"],
    },
  ],
}

export const BUYER_SECTION_TITLE: Record<string, SectionMeta> = {
  rfqs: {
    title: "Закупки",
    description: "Заявки поставщикам и согласование покупок",
  },
  deals: {
    title: "Сделки и оплаты",
    description: "Договоры, деньги на гарантии и документы",
  },
  catalog: {
    title: "Каталог товаров",
    description: "Покупайте у проверенных поставщиков без заявки",
  },
  company: {
    title: "Компания",
    description: "Сотрудники, реквизиты и тариф",
  },
}

export const SUPPLIER_HUBS: CabinetNavHub[] = [
  {
    id: "home",
    label: "Главная",
    href: "/supplier",
    match: ["/supplier"],
  },
  {
    id: "leads",
    label: "Заявки и КП",
    href: "/supplier/rfqs?response=open",
    match: ["/supplier/rfqs", "/supplier/proposals"],
    badgeKeys: ["rfqs"],
  },
  {
    id: "deals",
    label: "Сделки и деньги",
    href: "/supplier/contracts?tab=active",
    match: ["/supplier/contracts", "/supplier/finance"],
    badgeKeys: ["deals"],
  },
  {
    id: "products",
    label: "Витрина",
    href: "/supplier/catalog",
    match: ["/supplier/catalog", "/supplier/listings"],
    badgeKeys: ["catalog"],
  },
  {
    id: "messages",
    label: "Сообщения",
    href: "/supplier/messages",
    match: ["/supplier/messages"],
    badgeKeys: ["messages"],
  },
  {
    id: "tariff",
    label: "Надёжность и тариф",
    href: "/supplier/trust",
    match: ["/supplier/trust", "/supplier/subscription"],
  },
  {
    id: "company",
    label: "Компания",
    href: "/supplier/team",
    match: ["/supplier/team", "/supplier/company", "/supplier/profile"],
  },
]

export const SUPPLIER_SUBTABS: Record<string, CabinetSubtab[]> = {
  leads: [
    {
      id: "leads",
      label: "Заявки покупателей",
      href: "/supplier/rfqs?response=open",
      match: ["/supplier/rfqs"],
    },
    {
      id: "quotes",
      label: "Мои КП",
      href: "/supplier/proposals",
      match: ["/supplier/proposals"],
    },
  ],
  deals: [
    {
      id: "deals",
      label: "Сделки",
      href: "/supplier/contracts?tab=active",
      match: ["/supplier/contracts"],
    },
    {
      id: "finance",
      label: "Деньги",
      href: "/supplier/finance",
      match: ["/supplier/finance"],
    },
  ],
  company: [
    {
      id: "team",
      label: "Сотрудники и роли",
      href: "/supplier/team",
      match: ["/supplier/team", "/supplier/profile"],
    },
    {
      id: "profile",
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
    title: "Заявки и КП",
    description: "Найдите покупателя и отправьте предложение",
  },
  deals: {
    title: "Сделки и деньги",
    description: "Отгрузки, поступления и выплаты",
  },
  products: {
    title: "Витрина",
    description: "Ваши товары и услуги в каталоге",
  },
  company: {
    title: "Компания",
    description: "Сотрудники, роли и страница компании",
  },
  tariff: {
    title: "Надёжность и тариф",
    description: "Знак надёжности зарабатывается сделками, тариф подписки поднимает в каталоге",
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
      label: "Изменения данных",
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
