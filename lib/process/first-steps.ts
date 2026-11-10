import type { ContractWithRelations, RfqWithRelations } from "@/types"
import { formatCount } from "@/lib/format"
import { getDealPhase } from "@/lib/process/deal-stages"

/**
 * The path to a first deal, built from what the account already has.
 * Plain data, no icons or markup: the screen decides how to draw it.
 */
export type FirstStepData = {
  id: string
  title: string
  text: string
  done: boolean
  actions?: { label: string; href: string }[]
}

type Deal = Pick<ContractWithRelations, "id" | "status" | "payment_type" | "payment_plan" | "dispute">

const milestonesOf = (deal: Deal) => deal.payment_plan?.milestones ?? []

const PAID_STATUSES = ["funded", "in_progress", "submitted", "approved", "released"]

/** Money for the deal has reached the bank (or already the supplier). */
const isPaid = (deal: Deal) =>
  milestonesOf(deal).some((m) => PAID_STATUSES.includes(m.status)) || getDealPhase(deal) === "done"

const isAccepted = (deal: Deal) => deal.status === "completed"

export type BuyerFirstStepsInput = {
  rfqs: Pick<RfqWithRelations, "id" | "status" | "title">[]
  /** Offers waiting for the buyer's choice, per request. */
  offers: { rfqId: string; count: number }[]
  contracts: Deal[]
}

export function buildBuyerFirstSteps({ rfqs, offers, contracts }: BuyerFirstStepsInput): FirstStepData[] {
  const hasDeal = contracts.length > 0
  const draft = rfqs.find((r) => r.status === "draft")
  const asked = hasDeal || rfqs.some((r) => r.status !== "draft")
  const best = [...offers].sort((a, b) => b.count - a.count)[0]
  const offerCount = offers.reduce((sum, o) => sum + o.count, 0)
  const toPay = contracts.find((c) => getDealPhase(c) === "prepay" || getDealPhase(c) === "postpay")
  const toAccept = contracts.find((c) => getDealPhase(c) === "acceptance")
  const open = contracts.find((c) => c.status !== "completed" && c.status !== "cancelled")

  return [
    {
      id: "ask",
      title: "Расскажите, что нужно",
      text: draft && !asked
        ? "Черновик заявки сохранён. Дополните его и опубликуйте — поставщики пришлют цены."
        : "Создайте заявку — поставщики сами пришлют цены. Или купите готовый товар в каталоге.",
      done: asked,
      actions:
        draft && !asked
          ? [
              { label: "Дополнить черновик", href: `/customer/rfqs/${draft.id}/edit` },
              { label: "Каталог товаров", href: "/customer/catalog" },
            ]
          : [
              { label: "Новая заявка", href: "/customer/rfqs/new" },
              { label: "Каталог товаров", href: "/customer/catalog" },
            ],
    },
    {
      id: "choose",
      title: "Выберите предложение",
      text:
        offerCount > 0
          ? `Пришло ${formatCount(offerCount, "предложение", "предложения", "предложений")}. Сравните цены и сроки и выберите поставщика.`
          : "Поставщики уже видят вашу заявку. Когда пришлют предложения, сравните цены и сроки.",
      done: hasDeal,
      actions:
        best && best.count > 0
          ? [{ label: "Сравнить предложения", href: `/customer/rfqs/${best.rfqId}` }]
          : [{ label: "Мои заявки", href: "/customer/rfqs?status=quotes" }],
    },
    {
      id: "pay",
      title: "Оплатите с гарантией",
      text: "Деньги хранит банк‑партнёр. Поставщик видит оплату и начинает работу, но получит её только после вашей приёмки.",
      done: contracts.some(isPaid),
      actions: [
        {
          label: toPay ? "Перейти к оплате" : "Открыть сделку",
          href: toPay || open ? `/customer/contracts/${(toPay ?? open)!.id}` : "/customer/contracts?tab=active",
        },
      ],
    },
    {
      id: "accept",
      title: "Примите товар или работу",
      text: "Проверьте, что всё в порядке, и подтвердите приёмку. После этого банк переведёт деньги поставщику.",
      done: contracts.some(isAccepted),
      actions: [
        {
          label: toAccept ? "Проверить и принять" : "Открыть сделку",
          href: toAccept || open ? `/customer/contracts/${(toAccept ?? open)!.id}` : "/customer/contracts?tab=active",
        },
      ],
    },
  ]
}

export type SupplierFirstStepsInput = {
  /** What is still missing in the profile, in the order to fix it; empty when ready. */
  profileGaps: { label: string; cta: string; href: string }[]
  newRfqCount: number
  proposalCount: number
  contracts: Deal[]
  hasPayoutAccount: boolean
}

export function buildSupplierFirstSteps({
  profileGaps,
  newRfqCount,
  proposalCount,
  contracts,
  hasPayoutAccount,
}: SupplierFirstStepsInput): FirstStepData[] {
  const hasDeal = contracts.length > 0
  const open = contracts.find((c) => c.status !== "completed" && c.status !== "cancelled")
  const delivered = contracts.some((c) => c.status === "delivered" || c.status === "completed")
  const gotMoney = contracts.some((c) => milestonesOf(c).some((m) => m.status === "released"))

  return [
    {
      id: "profile",
      title: "Подготовьте профиль",
      text: profileGaps.length
        ? `Покупатели смотрят профиль перед выбором. Осталось: ${profileGaps.map((g) => g.label).join(", ")}.`
        : "Описание компании, товары и счёт для выплат на месте.",
      done: profileGaps.length === 0,
      actions: profileGaps.slice(0, 2).map((gap) => ({ label: gap.cta, href: gap.href })),
    },
    {
      id: "offer",
      title: "Отправьте предложение",
      text:
        newRfqCount > 0
          ? `${formatCount(newRfqCount, "заявка покупателя ждёт", "заявки покупателей ждут", "заявок покупателей ждут")} ответа. Откройте заявку и назовите цену и срок — это и есть КП, коммерческое предложение.`
          : "Откройте заявку покупателя и назовите цену и срок — это и есть КП, коммерческое предложение.",
      done: hasDeal || proposalCount > 0,
      actions: [{ label: "Заявки покупателей", href: "/supplier/rfqs?response=open" }],
    },
    {
      id: "deliver",
      title: "Выполните заказ",
      text: hasDeal
        ? "Покупатель выбрал вас. Когда оплата окажется в банке, отгрузите товар или сдайте работу."
        : "Если покупатель выберет ваше предложение, появится сделка — мы сообщим. Останется отгрузить товар или сдать работу в срок.",
      done: delivered,
      actions: [
        hasDeal && open
          ? { label: "Открыть сделку", href: `/supplier/contracts/${open.id}` }
          : { label: "Мои КП", href: "/supplier/proposals" },
      ],
    },
    {
      id: "money",
      title: "Получите деньги",
      text: "После приёмки покупателем банк переводит оплату на ваш счёт.",
      done: gotMoney,
      actions: [
        hasPayoutAccount
          ? { label: "Деньги и выплаты", href: "/supplier/finance" }
          : { label: "Добавить счёт для выплат", href: "/supplier/finance#payout" },
      ],
    },
  ]
}
