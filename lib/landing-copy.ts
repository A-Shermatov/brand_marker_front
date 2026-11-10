import { BuildingsIcon as Building2, FileTextIcon as FileText, TrayIcon as Inbox, PaperPlaneRightIcon as Send, ShieldCheckIcon as ShieldCheck, WalletIcon as Wallet } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"

export type LandingRole = "buyer" | "supplier"

export type LandingStep = {
  Icon: PhosphorIcon
  title: string
  description: string
}

export const LANDING_HOW_IT_WORKS_STEPS: Record<LandingRole, LandingStep[]> = {
  buyer: [
    {
      Icon: FileText,
      title: "1. Создайте заявку",
      description: "Опишите, какой товар или услуга вам нужны, бюджет и сроки.",
    },
    {
      Icon: Inbox,
      title: "2. Получите предложения",
      description:
        "Проверенные поставщики пришлют цены и условия. Сравните и выберите лучшее.",
    },
    {
      Icon: ShieldCheck,
      title: "3. Оплатите безопасно",
      description:
        "Деньги удерживает банк‑партнёр, поставщик получит их только после приёмки.",
    },
  ],
  supplier: [
    {
      Icon: Building2,
      title: "1. Заполните компанию и каталог",
      description:
        "Добавьте данные о компании и позиции каталога, чтобы вам доверяли покупатели.",
    },
    {
      Icon: Send,
      title: "2. Откликайтесь на заявки",
      description:
        "Находите заявки покупателей и отправляйте отклики с ценой и сроками.",
    },
    {
      Icon: Wallet,
      title: "3. Работайте и получайте оплату",
      description:
        "Заключайте договоры, выполняйте этапы и получайте оплату после приёмки.",
    },
  ],
}

export type LandingFaqItem = {
  id: string
  question: string
  answer: string
}

export const LANDING_FAQ_ITEMS: LandingFaqItem[] = [
  {
    id: "who",
    question: "Кто может пользоваться БрендМаркет?",
    answer:
      "Покупателями могут быть компании и предприниматели, которым нужны товары или услуги. Поставщиками — проверенные компании и подрядчики, готовые откликаться на заявки и заключать сделки на площадке.",
  },
  {
    id: "register",
    question: "Как зарегистрироваться?",
    answer:
      "Нажмите «Зарегистрироваться», укажите email и пароль, затем заполните профиль. Чтобы принимать заказы как поставщик, добавьте компанию и каталог в кабинете.",
  },
  {
    id: "escrow",
    question: "Как проходят оплаты?",
    answer:
      "Средства по договору удерживаются на площадке (эскроу) и переводятся поставщику после приёмки работ или поставки. Это снижает риски для обеих сторон.",
  },
  {
    id: "fees",
    question: "Есть ли комиссии со сделок?",
    answer:
      "Для покупателей площадка бесплатна. С поставщика удерживается комиссия платформы при выплате этапа договора — её размер виден при отправке предложения и в карточке договора. Абонентской платы и лимитов на заявки и отклики нет.",
  },
  {
    id: "contract",
    question: "Как заключается договор?",
    answer:
      "После выбора предложения создаётся контракт внутри платформы: этапы, сообщения и оплата проходят в одном кабинете — без бумажной волокиты.",
  },
  {
    id: "support",
    question: "Куда обращаться за поддержкой?",
    answer:
      "Раздел «Помощь» на сайте и контакты в подвале страницы. По спорным ситуациям доступны инструменты споров в карточке контракта.",
  },
]
