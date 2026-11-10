import type { ContractWithRelations } from "@/types"
import { formatCount, formatCurrency, formatIsoDate } from "@/lib/format"
import {
  DEAL_NEXT_STEP,
  dealNeedsAction,
  getDealPhase,
  getFundedMilestone,
  getUnpaidMilestone,
} from "@/lib/process/deal-stages"

export type TodoIcon =
  | "deal"
  | "proposal"
  | "draft"
  | "rfq"
  | "clock"
  | "message"
  | "dispute"
  | "approval"

export type TodoItem = {
  id: string
  icon: TodoIcon
  title: string
  text: string
  href: string
  cta: string
  hot?: boolean
}

const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1)

const dealTodoTitle = (contract: ContractWithRelations, step: string) =>
  `${contract.title}: ${lowerFirst(step)}`

const unreadTodo = (count: number, href: string): TodoItem => ({
  id: "unread-messages",
  icon: "message",
  title: formatCount(count, "непрочитанное сообщение", "непрочитанных сообщения", "непрочитанных сообщений"),
  text: "Ответьте, чтобы не задерживать работу.",
  href,
  cta: "Открыть",
})

const disputeTodo = (contract: ContractWithRelations, href: string): TodoItem => ({
  id: `dispute-${contract.id}`,
  icon: "dispute",
  title: `Спор по сделке «${contract.title}»`,
  text: "Деньги остаются на гарантии площадки, пока администратор не примет решение.",
  href,
  cta: "Открыть",
})

export type BuyerRfqProposalsSummary = {
  rfqId: string
  rfqTitle: string
  count: number
}

export type BuyerTodoInput = {
  contracts: ContractWithRelations[]
  getSupplierName: (supplierActorId: number) => string
  rfqsWithNewProposals: BuyerRfqProposalsSummary[]
  drafts: { id: string; title: string }[]
  unreadMessages: number
  pendingApprovals?: {
    id: string
    what: string
    whoName: string
    amountLabel: string
    reason: string
  }[]
}

const buyerDealText = (contract: ContractWithRelations, supplierName: string): { text: string; cta: string } => {
  const phase = getDealPhase(contract)
  const amount = formatCurrency(contract.agreed_amount, contract.currency)
  if (phase === "acceptance") {
    return {
      text: `${supplierName} сдал работу. Деньги уйдут поставщику только после вашей приёмки.`,
      cta: "Проверить работу",
    }
  }
  if (phase === "prepay") {
    const milestone = getUnpaidMilestone(contract)
    const due = milestone ? formatCurrency(milestone.amount, contract.currency) : amount
    return {
      text: `Оплатите ${due} на гарантию площадки — поставщик получит деньги только после приёмки.`,
      cta: "Оплатить",
    }
  }
  if (phase === "postpay") {
    const milestone = getUnpaidMilestone(contract)
    const due = milestone ? formatCurrency(milestone.amount, contract.currency) : amount
    return { text: `Работа принята. Оплатите ${due}, чтобы завершить сделку.`, cta: "Оплатить" }
  }
  const funded = getFundedMilestone(contract)
  const held = funded ? formatCurrency(funded.amount, contract.currency) : amount
  return {
    text: `${held} на гарантии площадки. Подтвердите выплату поставщику.`,
    cta: "Подтвердить",
  }
}

export const buildBuyerTodo = ({
  contracts,
  getSupplierName,
  rfqsWithNewProposals,
  drafts,
  unreadMessages,
  pendingApprovals = [],
}: BuyerTodoInput): TodoItem[] => {
  const items: TodoItem[] = []

  contracts
    .filter((c) => dealNeedsAction("buyer", c))
    .forEach((contract) => {
      const phase = getDealPhase(contract)
      const { text, cta } = buyerDealText(contract, getSupplierName(contract.supplier_actor_id))
      items.push({
        id: `deal-${contract.id}`,
        icon: "deal",
        hot: true,
        title: dealTodoTitle(contract, DEAL_NEXT_STEP.buyer[phase]),
        text,
        href: `/customer/contracts/${contract.id}`,
        cta,
      })
    })

  pendingApprovals.forEach((approval) => {
    items.push({
      id: `approval-${approval.id}`,
      icon: "approval",
      hot: true,
      title: `Согласовать покупку: ${approval.what}`,
      text: `${approval.whoName} · ${approval.amountLabel} · ${approval.reason}`,
      href: "/customer/approvals",
      cta: "Рассмотреть",
    })
  })

  rfqsWithNewProposals
    .filter((r) => r.count > 0)
    .forEach((rfq) => {
      items.push({
        id: `proposals-${rfq.rfqId}`,
        icon: "proposal",
        title: `${formatCount(rfq.count, "предложение", "предложения", "предложений")} по заявке «${rfq.rfqTitle}»`,
        text: "Сравните цены и сроки и выберите поставщика.",
        href: `/customer/rfqs/${rfq.rfqId}/proposals`,
        cta: "Сравнить",
      })
    })

  contracts
    .filter((c) => getDealPhase(c) === "disputed")
    .forEach((contract) => items.push(disputeTodo(contract, `/customer/contracts/${contract.id}`)))

  drafts.forEach((draft) => {
    items.push({
      id: `draft-${draft.id}`,
      icon: "draft",
      title: `Черновик «${draft.title}» не опубликован`,
      text: "Поставщики не увидят заявку, пока вы её не опубликуете.",
      href: `/customer/rfqs/${draft.id}/edit`,
      cta: "Продолжить",
    })
  })

  if (unreadMessages > 0) items.push(unreadTodo(unreadMessages, "/customer/messages"))

  return items
}

export type SupplierTodoInput = {
  contracts: ContractWithRelations[]
  newRfqs: { id: string; title: string }[]
  unreadMessages: number
}

export const buildSupplierTodo = ({
  contracts,
  newRfqs,
  unreadMessages,
}: SupplierTodoInput): TodoItem[] => {
  const items: TodoItem[] = []

  contracts
    .filter((c) => dealNeedsAction("supplier", c))
    .forEach((contract) => {
      items.push({
        id: `deal-${contract.id}`,
        icon: "deal",
        hot: true,
        title: dealTodoTitle(contract, DEAL_NEXT_STEP.supplier.work),
        text: `Сделка на ${formatCurrency(contract.agreed_amount, contract.currency)}. Срок сдачи — ${formatIsoDate(contract.due_date)}.`,
        href: `/supplier/contracts/${contract.id}?tab=submission`,
        cta: "Сдать работу",
      })
    })

  if (newRfqs.length > 0) {
    const titles = newRfqs
      .slice(0, 3)
      .map((r) => `«${r.title}»`)
      .join(", ")
    items.push({
      id: "new-rfqs",
      icon: "rfq",
      title: `${formatCount(newRfqs.length, "новая заявка", "новые заявки", "новых заявок")} от покупателей`,
      text: newRfqs.length > 3 ? `${titles} и другие` : titles,
      href: "/supplier/rfqs",
      cta: "Смотреть",
    })
  }

  contracts
    .filter((c) => getDealPhase(c) === "acceptance")
    .forEach((contract) => {
      items.push({
        id: `acceptance-${contract.id}`,
        icon: "clock",
        title: dealTodoTitle(contract, DEAL_NEXT_STEP.supplier.acceptance),
        text: "Покупатель проверяет работу. Деньги поступят после приёмки.",
        href: `/supplier/contracts/${contract.id}`,
        cta: "Открыть",
      })
    })

  contracts
    .filter((c) => getDealPhase(c) === "disputed")
    .forEach((contract) => items.push(disputeTodo(contract, `/supplier/contracts/${contract.id}`)))

  if (unreadMessages > 0) items.push(unreadTodo(unreadMessages, "/supplier/messages"))

  return items
}
