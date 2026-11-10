import type { ContractWithRelations, Rfq } from "@/types"
import { formatIsoDate } from "@/lib/format"
import { getDealPhase, isPostpaymentDeal } from "@/lib/process/deal-stages"

export type ProcessStepState = "done" | "now" | "todo"

export type ProcessStep = {
  title: string
  description?: string
  state: ProcessStepState
}

const SELECTING_STATUSES: Rfq["status"][] = ["published", "receiving_proposals", "expired"]

type TimelineRfq = Pick<Rfq, "status" | "created_at" | "deadline" | "visibility" | "invited_supplier_ids">

export const getRfqTimeline = (
  rfq: TimelineRfq,
  proposalsCount: number,
  contract?: ContractWithRelations | null,
): ProcessStep[] => {
  const isDraft = rfq.status === "draft"
  const isSelecting = SELECTING_STATUSES.includes(rfq.status)
  const isPersonal = rfq.visibility === "invited_only" && (rfq.invited_supplier_ids?.length ?? 0) <= 1
  const awaitingSupplier = isPersonal && isSelecting && proposalsCount === 0
  const phase = contract ? getDealPhase(contract) : null
  const postpay = contract ? isPostpaymentDeal(contract) : true

  const published: ProcessStep = isDraft
    ? {
        title: "Опубликуйте заявку",
        description: "Поставщики не увидят заявку, пока вы её не опубликуете.",
        state: "now",
      }
    : {
        title: "Заявка опубликована",
        description: `${formatIsoDate(rfq.created_at.split("T")[0] ?? rfq.created_at)}. ${
          isPersonal ? "Её видит только приглашённый поставщик." : "Её видят поставщики из выбранной категории."
        }`,
        state: "done",
      }

  const selectDescription = (() => {
    if (rfq.status === "expired") return "Срок приёма предложений истёк."
    if (!isSelecting) return isDraft ? undefined : "Поставщик выбран."
    if (isPersonal) {
      return proposalsCount === 0
        ? "Заявка отправлена поставщику. Ждём, когда он подтвердит и пришлёт предложение."
        : "Поставщик прислал предложение. Проверьте цену и сроки и подтвердите выбор."
    }
    if (proposalsCount === 0) {
      return "Ждём первые предложения — мы сообщим, когда поставщики ответят."
    }
    return "Сравните цены и сроки, выберите подходящего поставщика."
  })()

  const select: ProcessStep = {
    title: awaitingSupplier
      ? "Ожидание подтверждения поставщика"
      : isPersonal
        ? "Подтвердите поставщика"
        : "Выберите поставщика",
    description: selectDescription,
    state: isDraft ? "todo" : isSelecting ? "now" : "done",
  }

  const workDone = phase != null && ["acceptance", "postpay", "release", "done"].includes(phase)
  const work: ProcessStep = {
    title: "Поставщик выполняет работу",
    description: postpay
      ? "Сделка создаётся сразу после выбора. Вы видите этап работы и можете писать поставщику."
      : "После выбора оплатите сделку на гарантию площадки — поставщик приступит к работе.",
    state: workDone ? "done" : phase === "work" || phase === "prepay" || phase === "disputed" ? "now" : "todo",
  }

  const acceptDone = phase === "done"
  const acceptNow = phase === "acceptance" || phase === "postpay" || phase === "release"
  const accept: ProcessStep = {
    title: postpay ? "Примите работу и оплатите" : "Примите работу",
    description: "Деньги уходят поставщику только после вашей приёмки.",
    state: acceptDone ? "done" : acceptNow ? "now" : "todo",
  }

  return [published, select, work, accept]
}
