import { formatIsoDate } from "@/lib/format"
import type { ProposalOutcome, ProposalWithRelations } from "@/types"

/** How an outcome looks: the colour family of the card, never the only signal. */
export type OutcomeTone = "waiting" | "action" | "won" | "lost" | "muted"

export type OutcomeView = {
  tone: OutcomeTone
  /** One line that answers "what happened to my proposal". */
  title: string
  /** What it means or what to do next. */
  hint: string
  /** Where to go from here, if anywhere. */
  action?: { label: string; href: string }
}

/**
 * The outcome from the API; for local data without one, the closest reading
 * of the proposal status (the winner's name is then unknown).
 */
export function outcomeOf(proposal: ProposalWithRelations): ProposalOutcome {
  if (proposal.outcome) return proposal.outcome
  switch (proposal.status) {
    case "accepted":
      return { kind: "won", contract_id: null }
    case "rejected":
      return { kind: "rejected" }
    case "withdrawn":
      return { kind: "withdrawn" }
    case "pending_supplier":
      return { kind: "your_move" }
    case "archived":
      return { kind: "closed" }
    default:
      return { kind: "waiting" }
  }
}

/** Words, colour and next step for a supplier's proposal. */
export function outcomeView(outcome: ProposalOutcome, deadline?: string | null): OutcomeView {
  switch (outcome.kind) {
    case "won":
      return {
        tone: "won",
        title: "Покупатель выбрал вас",
        hint: "Сделка создана: выполните заказ и сдайте работу в сделке.",
        action: outcome.contract_id
          ? { label: "Открыть сделку", href: `/supplier/contracts/${outcome.contract_id}` }
          : { label: "К сделкам", href: "/supplier/contracts" },
      }
    case "lost":
      return {
        tone: "lost",
        title: "Выбран другой поставщик",
        hint: `Заказ получил «${outcome.winner_name}».`,
      }
    case "your_move":
      return {
        tone: "action",
        title: "Ждёт вашего ответа",
        hint: "Покупатель выбрал ваш товар из каталога: подтвердите или отклоните заказ.",
      }
    case "rejected":
      return {
        tone: "muted",
        title: "Покупатель отклонил КП",
        hint: "Другого поставщика он пока не выбрал.",
      }
    case "withdrawn":
      return { tone: "muted", title: "Вы отозвали КП", hint: "Покупатель его больше не видит." }
    case "closed":
      return { tone: "muted", title: "Заявка закрыта без выбора", hint: "Покупатель не выбрал ни одно КП." }
    default:
      return {
        tone: "waiting",
        title: "Покупатель ещё выбирает",
        // The date already ends with "г.", so no full stop of our own.
        hint: deadline ? `Приём КП до ${formatIsoDate(deadline)}` : "Решение пока не принято.",
      }
  }
}
