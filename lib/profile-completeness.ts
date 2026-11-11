/** The tabs of "Мой профиль"; a step of the checklist opens the tab it is done on. */
export type ProfileTab = "main" | "page" | "verify" | "security" | "telegram"

export type ProfileStep = {
  id: "photo" | "phone" | "page" | "verify" | "security" | "telegram"
  /** What to do, as a button: «Добавить фото». */
  label: string
  /** Why it is worth doing, in one line. */
  hint: string
  tab: ProfileTab
  done: boolean
}

export type ProfileFacts = {
  hasPhoto: boolean
  hasPhone: boolean
  /** Documents checked: the person's own or their company's. */
  verified: boolean
  /** Two-step sign-in is on; undefined while it is not known yet. */
  twoFactor?: boolean
  /** The public page of a private seller is filled in; undefined when the person has none. */
  pageFilled?: boolean
  /** The Telegram bot: undefined while the admin has it switched off. */
  telegramLinked?: boolean
}

/**
 * What makes a profile complete, in the order worth doing it. Only the steps
 * that apply are listed: a buyer has no public page, and Telegram is offered
 * only when the bot is on.
 */
export const profileSteps = (facts: ProfileFacts): ProfileStep[] => {
  const steps: ProfileStep[] = [
    {
      id: "photo",
      label: "Добавить фото",
      hint: "С фото вас узнают в сообщениях и сделках",
      tab: "main",
      done: facts.hasPhoto,
    },
    {
      id: "phone",
      label: "Указать телефон",
      hint: "Чтобы поддержка и партнёр по сделке могли с вами связаться",
      tab: "main",
      done: facts.hasPhone,
    },
  ]
  if (facts.pageFilled !== undefined) {
    steps.push({
      id: "page",
      label: "Заполнить страничку",
      hint: "Её видят покупатели: чем вы занимаетесь, навыки, примеры работ",
      tab: "page",
      done: facts.pageFilled,
    })
  }
  steps.push({
    id: "verify",
    label: "Пройти проверку",
    hint: "Проверенным доверяют больше, и это первый шаг к знаку надёжности",
    tab: "verify",
    done: facts.verified,
  })
  if (facts.twoFactor !== undefined) {
    steps.push({
      id: "security",
      label: "Включить защиту входа",
      hint: "Код из приложения при входе: аккаунт не откроют, даже узнав пароль",
      tab: "security",
      done: facts.twoFactor,
    })
  }
  if (facts.telegramLinked !== undefined) {
    steps.push({
      id: "telegram",
      label: "Подключить Telegram",
      hint: "Заявки, ответы и уведомления прямо в Telegram",
      tab: "telegram",
      done: facts.telegramLinked,
    })
  }
  return steps
}

export const profileProgress = (steps: ProfileStep[]) => {
  const done = steps.filter((step) => step.done).length
  return {
    done,
    total: steps.length,
    percent: steps.length ? Math.round((done / steps.length) * 100) : 100,
    /** Up to two things to do next. */
    next: steps.filter((step) => !step.done).slice(0, 2),
  }
}

export const PROFILE_TABS: { value: ProfileTab; label: string }[] = [
  { value: "main", label: "Основное" },
  { value: "page", label: "Моя страничка" },
  { value: "verify", label: "Проверка" },
  { value: "security", label: "Безопасность" },
  { value: "telegram", label: "Telegram" },
]

export const isProfileTab = (value: string | null | undefined): value is ProfileTab =>
  PROFILE_TABS.some((tab) => tab.value === value)
