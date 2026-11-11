/**
 * What a page of the site is called, for the journal: an administrator reads
 * «Кабинет покупателя · Мои заявки · № 12», not «/customer/rfqs/12».
 */

import { ADMIN_HUBS, BUYER_HUBS, SUPPLIER_HUBS, matchHub, type CabinetNavHub } from "./cabinet-nav"

export type PageLabel = {
  /** The part of the site: a cabinet, or the public site. */
  area: string
  /** The section, by the name it has in the menu. */
  name: string
  /** What exactly was open there: «№ 12», «создание». */
  detail?: string
}

const CABINETS: { root: string; area: string; hubs: CabinetNavHub[] }[] = [
  { root: "/customer", area: "Кабинет покупателя", hubs: BUYER_HUBS },
  { root: "/supplier", area: "Кабинет поставщика", hubs: SUPPLIER_HUBS },
  { root: "/admin", area: "Админка", hubs: ADMIN_HUBS },
]

const SITE = "Сайт"
const SITE_PAGES: Record<string, string> = {
  "": "Главная страница",
  login: "Вход",
  register: "Регистрация",
  "forgot-password": "Восстановление пароля",
  "reset-password": "Новый пароль",
  services: "Каталог услуг",
  performers: "Исполнители",
  categories: "Категории",
  "for-suppliers": "Поставщикам",
  guarantee: "Гарантия сделки",
  help: "Помощь",
  tariffs: "Тарифы",
  invite: "Приглашение в компанию",
  invitations: "Приглашения",
  orders: "Заказы",
  verification: "Проверка аккаунта",
}

/** Pages a cabinet has outside its menu. */
const CABINET_PAGES: Record<string, string> = {
  notifications: "Уведомления",
  login: "Вход",
  analytics: "Аналитика",
}

const STEPS: Record<string, string> = {
  new: "создание",
  edit: "редактирование",
  proposals: "предложения",
  return: "возврат после оплаты",
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-/i

const objectNumber = (part: string): string | null => {
  if (/^\d+$/.test(part)) return `№ ${part}`
  if (UUID.test(part)) return `№ ${part.slice(0, 8)}…`
  return null
}

/** «№ 12 · предложения» from the parts of a path that follow the section. */
const describeRest = (parts: string[]): string | undefined => {
  const words = parts.flatMap((part) => {
    const known = objectNumber(part) ?? STEPS[part]
    return known ? [known] : []
  })
  return words.length ? words.join(" · ") : undefined
}

export const describePage = (path: string): PageLabel => {
  const clean = (path.split("?")[0] ?? "").replace(/\/+$/, "") || "/"
  const parts = clean.split("/").filter(Boolean)
  const cabinet = CABINETS.find(({ root }) => clean === root || clean.startsWith(`${root}/`))
  if (cabinet) {
    const hub = matchHub(cabinet.hubs, clean, cabinet.root)
    const name = hub?.label ?? CABINET_PAGES[parts[1] ?? ""] ?? parts[1] ?? "Главная"
    return { area: cabinet.area, name, detail: describeRest(parts.slice(2)) }
  }
  const name = SITE_PAGES[parts[0] ?? ""] ?? (parts[0] ? `/${parts[0]}` : SITE_PAGES[""])
  return { area: SITE, name, detail: describeRest(parts.slice(1)) }
}

/** «2 мин 5 с»: how long a page stayed open. */
export const formatStay = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return "—"
  if (seconds < 60) return `${seconds} с`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин ${seconds % 60} с`
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`
}
