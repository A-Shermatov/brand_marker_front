import type {
  AdminDeviceFlag,
  AdminDeviceKind,
  AdminLogAudience,
  AdminLogEventCategory,
  AdminLogKind,
  AdminLogPeriod,
  AdminLogSection,
  AdminLogSource,
  AdminLogStatus,
} from "@/lib/api/admin"

export const LOG_AUDIENCE_LABELS: Record<AdminLogAudience, string> = {
  users: "Пользователи",
  staff: "Сотрудники",
}

export const LOG_KIND_LABELS: Record<AdminLogKind, string> = {
  login: "Вход",
  register: "Регистрация",
  create: "Создание",
  update: "Изменение",
  delete: "Удаление",
  view: "Просмотр",
}

export const LOG_SECTION_LABELS: Record<AdminLogSection, string> = {
  auth: "Вход и аккаунт",
  rfqs: "Заявки",
  proposals: "Предложения",
  contracts: "Контракты",
  finance: "Финансы",
  catalog: "Каталог",
  companies: "Компании",
  staff: "Сотрудники",
  roles: "Роли и доступы",
  disputes: "Споры",
  reports: "Жалобы",
  reviews: "Отзывы",
  notifications: "Уведомления",
  subscription: "Подписка",
  users: "Пользователи",
  settings: "Настройки",
  profiles: "Профили участников",
  messages: "Сообщения",
  support: "Поддержка",
  approvals: "Согласования",
  overview: "Обзор и аналитика",
  journal: "Журнал и логи",
  service: "Служебные запросы сайта",
  other: "Прочее",
}

export const LOG_STATUS_META: Record<
  AdminLogStatus,
  { label: string; hint: string; className: string }
> = {
  success: {
    label: "Успешно",
    hint: "Запрос выполнен без ошибок",
    className: "border-success/20 bg-success/10 text-success",
  },
  invalid: {
    label: "Ошибка в данных",
    hint: "Поля заполнены неверно или не полностью",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  unauthorized: {
    label: "Не выполнен вход",
    hint: "Неверный логин или пароль, либо сессия истекла",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  forbidden: {
    label: "Нет доступа",
    hint: "У пользователя нет прав на это действие",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  not_found: {
    label: "Не найдено",
    hint: "Запись не существует или была удалена",
    className: "border-border bg-muted text-muted-foreground",
  },
  conflict: {
    label: "Конфликт",
    hint: "Такая запись уже существует или её состояние изменилось",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  rate_limited: {
    label: "Слишком много попыток",
    hint: "Запросы временно ограничены, нужно подождать",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  rejected: {
    label: "Запрос отклонён",
    hint: "Система не приняла запрос",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
  server_error: {
    label: "Сбой на сервере",
    hint: "Внутренняя ошибка платформы, стоит сообщить разработчикам",
    className: "border-transparent bg-destructive text-white",
  },
}

export const LOG_PERIOD_LABELS: Record<AdminLogPeriod, string> = {
  "1h": "За час",
  "24h": "За сутки",
  "7d": "За 7 дней",
  "30d": "За 30 дней",
  all: "За всё время",
}

const USER_ROLE_LABELS: Record<string, string> = {
  buyer: "Покупатель",
  supplier: "Поставщик",
  both: "Покупатель и поставщик",
  admin: "Администратор",
  moderator: "Модератор",
  superadmin: "Суперадминистратор",
}

export const getLogUserRoleLabel = (role: string) => USER_ROLE_LABELS[role] ?? role

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Пароль",
  first_name: "Имя",
  last_name: "Фамилия",
  phone: "Телефон",
  role: "Роль",
  role_id: "Роль (номер)",
  status: "Статус",
  action: "Действие",
  reason: "Причина",
  title: "Название",
  name: "Название",
  description: "Описание",
  message: "Сообщение",
  comment: "Комментарий",
  note: "Примечание",
  price: "Цена",
  amount: "Сумма",
  currency: "Валюта",
  deadline: "Срок",
  delivery_time: "Срок выполнения",
  type: "Тип",
  category_id: "Категория",
  company_id: "Компания",
  slug: "Адрес (slug)",
  parent_id: "Родительская категория",
  permission_ids: "Права",
  payment_type: "Тип оплаты",
  visibility: "Видимость",
  budget_type: "Тип бюджета",
  file_names: "Файлы",
  plan: "Тариф",
  rating: "Оценка",
  side: "Сторона",
  invited_count: "Приглашено поставщиков",
  contract_id: "Контракт",
  proposal_id: "Предложение",
  rfq_id: "Заявка",
  milestone_id: "Этап",
  submission_id: "Сдача работы",
  order_id: "Номер заказа",
  actor_id: "Профиль",
  member_user_id: "Участник",
  destination_id: "Реквизиты",
  change_request_id: "Заявка на изменение",
  certificate_id: "Сертификат",
  supplier_actor_id: "Поставщик",
  buyer_actor_id: "Покупатель",
  target_actor_id: "Кому отзыв",
  opened_by_actor_id: "Кто открыл",
  gateway: "Платёжный шлюз",
  gateway_status: "Статус шлюза",
  source: "Источник",
  purpose: "Назначение",
  milestones: "Этапов",
  commission_amount: "Комиссия",
  active_until: "Активна до",
  available_before: "Доступно до запроса",
  released_milestone_ids: "Выплаченные этапы",
  rejected_proposals: "Отклонено предложений",
  profile_fields: "Изменённые поля профиля",
  message_changed: "Сообщение изменено",
  supplier_actor_ids: "Приглашённые поставщики",
  actor_types: "Роли компании",
  files: "Файлов",
  photos: "Фото",
  file_name: "Файл",
  file_type: "Тип файла",
  website: "Сайт",
  logo: "Логотип",
  legal_name: "Юридическое название",
  tax_number: "ИНН",
  address: "Адрес",
  city: "Город",
  country: "Страна",
  quantity: "Количество",
  budget_from: "Бюджет от",
  budget_to: "Бюджет до",
  new_device: "Вход с нового устройства",
  command: "Команда",
  text: "Текст",
  request: "Запрос окна бота",
  error: "Ошибка",
  telegram_id: "Telegram ID",
  username: "Имя в Telegram",
  via: "Способ подтверждения",
  account_type: "Тип аккаунта",
}

export const getLogFieldLabel = (key: string) => FIELD_LABELS[key] ?? key

export const LOG_SOURCE_LABELS: Record<AdminLogSource, string> = {
  events: "События",
  http: "Все действия",
  pages: "Страницы",
}

/** What each view of the journal holds, in one line under the page title. */
export const LOG_VIEW_HINTS: Record<AdminLogSource | "devices", string> = {
  events: "Значимые события: кто и что изменил в компаниях, заявках, контрактах и платежах",
  http: "Каждое обращение к платформе: просмотры, изменения, отказы и ошибки, с устройством и адресом",
  pages: "Какие страницы сайта открывали и сколько на них пробыли",
  devices: "Все устройства, с которых заходили на платформу, и кто ими пользовался",
}

export const DEVICE_KIND_LABELS: Record<AdminDeviceKind, string> = {
  desktop: "Компьютер",
  mobile: "Телефон",
  tablet: "Планшет",
  messenger: "Чат в Telegram",
  bot: "Программа или бот",
  other: "Неизвестное устройство",
}

export const getDeviceKindLabel = (kind: string) =>
  DEVICE_KIND_LABELS[kind as AdminDeviceKind] ?? DEVICE_KIND_LABELS.other

export const DEVICE_FLAG_LABELS: Record<AdminDeviceFlag, string> = {
  shared: "Несколько аккаунтов",
  bot: "Боты и программы",
  automated: "Управляется программой",
  unidentified: "Без своего идентификатора",
}

/** «Windows 11 · Chrome 142», or what is known of it. */
export const describeDevice = (device: { os: string | null; browser: string | null }) =>
  [device.os, device.browser].filter(Boolean).join(" · ") || "Устройство не определено"

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["ru"], { type: "region" })
    : null

/** «Таджикистан» for «TJ»; Cloudflare's «T1» is the Tor network. */
export const getCountryLabel = (code: string | null | undefined): string | null => {
  if (!code) return null
  if (code === "T1") return "Сеть Tor"
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

/** What a browser reported about its machine, in the order it is shown. */
const CLIENT_FIELD_LABELS: [string, string][] = [
  ["platform", "Система"],
  ["platform_version", "Версия системы"],
  ["architecture", "Архитектура"],
  ["bitness", "Разрядность"],
  ["model", "Модель"],
  ["mobile", "Мобильное устройство"],
  ["brands", "Браузер"],
  ["language", "Язык"],
  ["languages", "Языки"],
  ["timezone", "Часовой пояс"],
  ["timezone_offset", "Смещение от UTC, мин"],
  ["screen", "Экран"],
  ["viewport", "Окно браузера"],
  ["pixel_ratio", "Плотность пикселей"],
  ["color_depth", "Глубина цвета, бит"],
  ["cpu_cores", "Ядер процессора"],
  ["memory_gb", "Память, ГБ"],
  ["touch_points", "Касаний одновременно"],
  ["gpu", "Видеокарта"],
  ["gpu_vendor", "Производитель видеокарты"],
  ["connection", "Соединение"],
  ["cookies", "Cookie включены"],
  ["standalone", "Открыт как приложение"],
  ["webdriver", "Управляется программой"],
  ["dark", "Тёмная тема системы"],
  ["referrer", "Откуда пришёл"],
]

const clientValue = (value: unknown): string => {
  if (typeof value === "boolean") return value ? "Да" : "Нет"
  if (Array.isArray(value)) return value.join(", ")
  return String(value)
}

/** The browser's report as rows to show; width and height become one «1920 × 1080». */
export const getClientReportRows = (client: Record<string, unknown>): { label: string; value: string }[] => {
  const size = (width: unknown, height: unknown) =>
    typeof width === "number" && typeof height === "number" ? `${width} × ${height}` : undefined
  const merged: Record<string, unknown> = {
    ...client,
    screen: size(client.screen_width, client.screen_height),
    viewport: size(client.viewport_width, client.viewport_height),
  }
  return CLIENT_FIELD_LABELS.flatMap(([key, label]) => {
    const value = merged[key]
    if (value === undefined || value === null || value === "") return []
    if (Array.isArray(value) && value.length === 0) return []
    return [{ label, value: clientValue(value) }]
  })
}

export const LOG_EVENT_CATEGORY_LABELS: Record<AdminLogEventCategory, string> = {
  auth: "Вход и аккаунт",
  company: "Компании",
  catalog: "Каталог",
  rfq: "Заявки",
  proposal: "Предложения",
  contract: "Контракты",
  payment: "Платежи",
  finance: "Выводы средств",
  review: "Отзывы",
  dispute: "Споры",
  telegram: "Telegram-бот",
  "admin.company": "Админ: компании",
  "admin.user": "Админ: пользователи",
  "admin.catalog": "Админ: каталог",
  "admin.rfq": "Админ: заявки",
  "admin.proposal": "Админ: предложения",
  "admin.contract": "Админ: контракты",
  "admin.dispute": "Админ: споры",
  "admin.finance": "Админ: финансы",
  "admin.report": "Админ: жалобы",
  "admin.staff": "Админ: сотрудники, роли, категории",
  other: "Прочее",
}

const EVENT_ACTION_LABELS: Record<string, string> = {
  register: "Регистрация",
  login: "Вход в систему",
  login_failed: "Неудачная попытка входа",
  login_2fa_challenge: "Запрошен код 2FA при входе",
  password_reset_requested: "Запрошен сброс пароля",
  password_reset: "Пароль сброшен",
  password_changed: "Пароль изменён",
  "auth.logout": "Выход из системы",
  "auth.2fa.enable": "Включена двухфакторная защита",
  "auth.2fa.disable": "Отключена двухфакторная защита",
  "auth.switch_actor": "Переключение профиля",
  "auth.switch_company": "Переключение компании",
  "auth.activate_role": "Подключена роль",
  "platform_settings.update": "Изменены настройки платформы",

  "company.create": "Компания создана",
  "company.update": "Профиль компании изменён",
  "company.change_request.submit": "Отправлена заявка на изменение данных",
  "company.member.invite": "Сотрудник добавлен в компанию",
  "company.member.remove": "Сотрудник удалён из компании",
  "company.member.role_change": "Изменена роль сотрудника компании",
  "company.certificate.add": "Добавлен сертификат",
  "company.certificate.remove": "Удалён сертификат",

  "catalog.create": "Создана позиция каталога",
  "catalog.update": "Позиция каталога изменена",
  "catalog.submit_review": "Позиция отправлена на модерацию",
  "catalog.status.change": "Изменён статус позиции",
  "catalog.delete": "Позиция каталога удалена",

  "rfq.create": "Заявка создана",
  "rfq.update": "Заявка изменена",
  "rfq.publish": "Заявка опубликована",
  "rfq.close": "Заявка закрыта",
  "rfq.cancel": "Заявка отменена",
  "rfq.invite": "Приглашены поставщики",

  "proposal.submit": "Отправлено предложение",
  "proposal.update": "Предложение изменено",
  "proposal.withdraw": "Предложение отозвано",
  "proposal.offer_withdraw": "Покупатель отозвал запрос",
  "proposal.shortlist": "Предложение в избранном",
  "proposal.accept": "Предложение принято",
  "proposal.reject": "Предложение отклонено",
  "proposal.supplier_accept": "Поставщик принял запрос",
  "proposal.supplier_reject": "Поставщик отклонил запрос",

  "contract.create": "Контракт создан",
  "contract.activate": "Контракт активирован",
  "contract.sign": "Контракт подписан",
  "contract.submission.submit": "Работа сдана на проверку",
  "contract.submission.approve": "Работа принята",
  "contract.submission.reject": "Работа отклонена",
  "contract.complete": "Контракт завершён",
  "contract.cancel": "Контракт отменён",

  "payment.milestone.fund": "Этап оплачен (средства в escrow)",
  "payment.milestone.approve": "Этап подтверждён",
  "payment.milestone.release": "Средства по этапу выплачены",
  "payment.callback.success": "Платёжный шлюз: оплата прошла",
  "payment.callback.fail": "Платёжный шлюз: оплата не прошла",
  "subscription.activate": "Подписка активирована",
  "withdrawal.request": "Запрошен вывод средств",
  "review.create": "Оставлен отзыв",
  "dispute.open": "Открыт спор",
  "dispute.statement": "Добавлено заявление по спору",
  "dispute.evidence.add": "Добавлено доказательство по спору",

  "telegram.account.link": "Telegram подключён к аккаунту",
  "telegram.account.unlink": "Telegram отключён от аккаунта",
  "telegram.command": "Команда боту в Telegram",
  "telegram.request.start": "Боту написан текст заявки",
  "telegram.request.publish": "Заявка опубликована из Telegram",
  "telegram.feed.view": "Просмотр заявки в Telegram",
  "telegram.offer.submit": "Предложение отправлено из Telegram",
  "telegram.widget": "Нажатие в окне бота",

  "admin.company.approve": "Компания верифицирована",
  "admin.company.reject": "Верификация компании отклонена",
  "admin.company.request_documents": "Запрошены документы компании",
  "admin.company.block": "Компания заблокирована",
  "admin.company.deactivate": "Компания деактивирована",
  "admin.company.reactivate": "Компания восстановлена",
  "admin.company.vip.grant": "Компании выдан VIP",
  "admin.company.vip.revoke": "У компании снят VIP",
  "admin.company.update": "Админ изменил данные компании",
  "admin.company.logo.update": "Админ изменил логотип компании",
  "admin.company.member.add": "Админ добавил сотрудника компании",
  "admin.company.member.update": "Админ изменил сотрудника компании",
  "admin.company.member.remove": "Админ удалил сотрудника компании",
  "admin.company.owner.change": "Админ сменил владельца компании",
  "admin.company.categories.update": "Админ изменил категории компании",
  "admin.company.document.add": "Админ добавил документ компании",
  "admin.company.document.delete": "Админ удалил документ компании",
  "admin.company.verification.set": "Админ изменил статус верификации компании",
  "admin.company.change_request.approve": "Заявка на изменение данных одобрена",
  "admin.company.change_request.reject": "Заявка на изменение данных отклонена",
  "admin.individual.verification.set": "Админ изменил верификацию физлица",

  "admin.user.status.active": "Пользователь активирован",
  "admin.user.status.blocked": "Пользователь заблокирован",
  "admin.user.status.pending": "Пользователь переведён в ожидание",
  "admin.user.sessions.revoke": "Сессии пользователя завершены",

  "admin.catalog.approve": "Позиция каталога одобрена",
  "admin.catalog.hide": "Позиция каталога скрыта",
  "admin.catalog.reject": "Позиция каталога отклонена",
  "admin.catalog.delete": "Позиция каталога удалена админом",
  "admin.catalog.restore": "Позиция каталога восстановлена",
  "admin.catalog.update": "Админ изменил позицию каталога",
  "admin.catalog.media.add": "Админ добавил медиа позиции",
  "admin.catalog.media.delete": "Админ удалил медиа позиции",
  "admin.catalog.media.reorder": "Админ изменил порядок медиа",
  "admin.catalog.bulk": "Массовое действие с каталогом",

  "admin.rfq.hide": "Заявка скрыта",
  "admin.rfq.close": "Заявка закрыта админом",
  "admin.rfq.delete": "Заявка удалена админом",
  "admin.rfq.warn_buyer": "Покупателю вынесено предупреждение",
  "admin.proposal.delete": "Предложение удалено админом",
  "admin.proposal.investigate": "Предложение на проверке",
  "admin.proposal.block_supplier": "Поставщик заблокирован",
  "admin.contract.freeze": "Контракт заморожен",
  "admin.contract.cancel": "Контракт отменён админом",
  "admin.contract.force_complete": "Контракт принудительно завершён",
  "admin.contract.open_investigation": "Открыто расследование по контракту",
  "admin.dispute.release_funds": "Спор: средства выплачены поставщику",
  "admin.dispute.refund_buyer": "Спор: возврат покупателю",
  "admin.dispute.partial_refund": "Спор: частичный возврат",
  "admin.dispute.request_evidence": "Спор: запрошены доказательства",
  "admin.dispute.close_case": "Спор закрыт",
  "admin.finance.refund": "Платёж возвращён",
  "admin.finance.retry": "Повтор платежа",
  "admin.finance.mark_paid": "Платёж отмечен оплаченным",
  "admin.report.delete": "Жалоба удалена",
  "admin.staff.create": "Добавлен сотрудник платформы",
  "admin.staff.update": "Изменён сотрудник платформы",
  "admin.role.create": "Создана роль",
  "admin.role.update": "Роль изменена",
  "admin.role.delete": "Роль удалена",
  "admin.role.matrix": "Изменены права роли",
  "admin.role.assign": "Назначена роль",
  "admin.category.create": "Создана категория",
  "admin.category.update": "Категория изменена",
  "admin.category.delete": "Категория удалена",
}

const ACTION_SUBJECT_LABELS: Record<string, string> = {
  auth: "Аккаунт",
  company: "Компания",
  individual: "Физлицо",
  user: "Пользователь",
  catalog: "Каталог",
  rfq: "Заявка",
  proposal: "Предложение",
  contract: "Контракт",
  dispute: "Спор",
  finance: "Финансы",
  report: "Жалоба",
  staff: "Сотрудник",
  role: "Роль",
  category: "Категория",
  payment: "Платёж",
  withdrawal: "Вывод средств",
  review: "Отзыв",
  subscription: "Подписка",
  member: "сотрудник",
  media: "медиа",
  document: "документ",
  verification: "верификация",
  change_request: "заявка на изменение",
  milestone: "этап",
  submission: "работа",
}

const ACTION_VERB_LABELS: Record<string, string> = {
  create: "создание",
  add: "добавление",
  update: "изменение",
  delete: "удаление",
  remove: "удаление",
  restore: "восстановление",
  approve: "одобрение",
  reject: "отклонение",
  hide: "скрытие",
  block: "блокировка",
  unblock: "разблокировка",
  close: "закрытие",
  cancel: "отмена",
  publish: "публикация",
  submit: "отправка",
  set: "установка",
  change: "смена",
  reorder: "изменение порядка",
  bulk: "массовое действие",
  resolve: "решение",
  dismiss: "отклонение",
  grant: "выдача",
  revoke: "отзыв",
  fund: "оплата",
  release: "выплата",
  invite: "приглашение",
  enable: "включение",
  disable: "отключение",
}

const humanizeSegment = (segment: string) =>
  ACTION_SUBJECT_LABELS[segment] ?? ACTION_VERB_LABELS[segment] ?? segment.replace(/_/g, " ")

/** Russian label for any audit action; unknown `admin.*` and module actions get a readable fallback. */
export const getLogEventLabel = (action: string): string => {
  const known = EVENT_ACTION_LABELS[action]
  if (known) return known
  const isAdmin = action.startsWith("admin.")
  const parts = (isAdmin ? action.slice("admin.".length) : action).split(".").filter(Boolean)
  if (parts.length === 0) return action
  const [subject, ...rest] = parts
  const subjectLabel = ACTION_SUBJECT_LABELS[subject] ?? humanizeSegment(subject)
  const tail = rest.map(humanizeSegment).join(" · ")
  const text = tail ? `${subjectLabel}: ${tail}` : subjectLabel
  return isAdmin ? `Админ · ${text}` : text
}

export const getLogEventCategoryLabel = (category: string) =>
  LOG_EVENT_CATEGORY_LABELS[category as AdminLogEventCategory] ?? category

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  company: "Компания",
  user: "Пользователь",
  catalog_item: "Позиция каталога",
  rfq: "Заявка",
  proposal: "Предложение",
  contract: "Контракт",
  milestone: "Этап оплаты",
  payment: "Платёж",
  platform_payment: "Платёж платформы",
  withdrawal: "Вывод средств",
  review: "Отзыв",
  dispute: "Спор",
  role: "Роль",
  category: "Категория",
  report: "Жалоба",
  staff: "Сотрудник",
  platform_settings: "Настройки платформы",
}

export const getLogResourceTypeLabel = (resourceType: string) =>
  RESOURCE_TYPE_LABELS[resourceType] ?? resourceType

const RESOURCE_ROUTES: Record<string, string> = {
  company: "/admin/companies",
  user: "/admin/users",
  catalog_item: "/admin/catalog",
  rfq: "/admin/rfqs",
  proposal: "/admin/proposals",
  contract: "/admin/contracts",
  dispute: "/admin/disputes",
  platform_payment: "/admin/finance",
}

/** Admin page for an audited object, or null when the object has no detail page. */
export const getLogResourceHref = (resourceType: string, resourceId: string | null | undefined) => {
  const base = RESOURCE_ROUTES[resourceType]
  if (!base || !resourceId || resourceId === "-") return null
  return `${base}/${encodeURIComponent(resourceId)}`
}

/** Links to related objects mentioned in event details (`contract_id`, `rfq_id`, ...). */
export const getLogRelatedLinks = (details: Record<string, unknown>) =>
  Object.entries(details).flatMap(([key, value]) => {
    if (!key.endsWith("_id") || (typeof value !== "string" && typeof value !== "number")) return []
    const href = getLogResourceHref(key.slice(0, -"_id".length), String(value))
    return href ? [{ key, label: getLogFieldLabel(key), value: String(value), href }] : []
  })
