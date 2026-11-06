import type { RfqStatus } from "@/types"
import { rfqStatusMeta } from "@/lib/rfq-display"

/** v5 bRfqs tabs */
export type BuyerRfqStatusFilter = "all" | "quotes" | "deal" | "draft" | "closed" | "active" | RfqStatus

const CLOSED_STATUSES: RfqStatus[] = [
  "completed",
  "cancelled",
  "expired",
  "disputed",
  "archived",
]

const DEAL_STATUSES: RfqStatus[] = [
  "supplier_selected",
  "contract_created",
  "in_progress",
]

const QUOTES_STATUSES: RfqStatus[] = ["published", "receiving_proposals"]

export const ACTIVE_RFQ_STATUSES: RfqStatus[] = [
  "published",
  "receiving_proposals",
  "in_progress",
  "disputed",
]

export const BUYER_RFQ_V5_TABS: {
  value: Extract<BuyerRfqStatusFilter, "all" | "quotes" | "deal" | "draft" | "closed">
  label: string
}[] = [
  { value: "all", label: "Все" },
  { value: "quotes", label: "Приём КП" },
  { value: "deal", label: "Сделка" },
  { value: "draft", label: "Черновики" },
  { value: "closed", label: "Архив" },
]

export const BUYER_RFQ_STATUS_FILTER_OPTIONS = BUYER_RFQ_V5_TABS

export const BUYER_RFQ_STATUS_FILTER_VALUES = BUYER_RFQ_V5_TABS.map(
  (option) => option.value,
)

export const getRfqStatusesForBuyerFilter = (
  filter: BuyerRfqStatusFilter,
): RfqStatus[] | null => {
  if (filter === "all") return null
  if (filter === "active") return ACTIVE_RFQ_STATUSES
  if (filter === "quotes") return QUOTES_STATUSES
  if (filter === "deal") return DEAL_STATUSES
  if (filter === "closed") return CLOSED_STATUSES
  return [filter as RfqStatus]
}

/** Badge key for StatusBadge (v5-style). */
export const buyerRfqBadgeStatus = (status: RfqStatus): string => {
  if (status === "draft") return "draft"
  if (status === "published" || status === "receiving_proposals") return "quotes"
  if (
    status === "supplier_selected" ||
    status === "contract_created" ||
    status === "in_progress"
  ) {
    return "deal"
  }
  if (status === "expired") return "expired"
  if (status === "cancelled" || status === "completed" || status === "archived") {
    return "closed"
  }
  if (status === "disputed") return "open"
  return status
}

export const buyerRfqBadgeLabel = (status: RfqStatus): string => {
  if (status === "published" || status === "receiving_proposals") return "Приём КП"
  if (
    status === "supplier_selected" ||
    status === "contract_created" ||
    status === "in_progress"
  ) {
    return "Сделка"
  }
  if (status === "cancelled" || status === "completed") return "Закрыта"
  if (status === "archived") return "В архиве"
  return rfqStatusMeta[status].label
}

/** A moderator took the RFQ off the board (hidden, closed or removed). */
export const isModeratedRfq = (rfq: { moderated_at?: string | null }): boolean =>
  Boolean(rfq.moderated_at)

export const isClosedRfqStatus = (status: RfqStatus): boolean =>
  CLOSED_STATUSES.includes(status)

/** @deprecated */
export type BuyerRfqListTab = "draft" | "published" | "collecting" | "closed"

/** @deprecated */
export const BUYER_RFQ_LIST_TABS: { value: BuyerRfqListTab; label: string }[] = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликован" },
  { value: "collecting", label: "Приём предложений" },
  { value: "closed", label: "Закрыт" },
]

/** @deprecated */
export const getRfqStatusesForBuyerTab = (tab: BuyerRfqListTab): RfqStatus[] => {
  if (tab === "draft") return ["draft"]
  if (tab === "published") return ["published"]
  if (tab === "collecting") return ["receiving_proposals"]
  return CLOSED_STATUSES
}
