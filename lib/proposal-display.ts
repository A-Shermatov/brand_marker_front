import type { ProposalStatus } from "@/types"

/** Map proposal status → BM StatusBadge key + optional label. */
export const proposalBadgeStatus = (
  status: ProposalStatus,
): { status: string; label: string } => {
  if (status === "submitted" || status === "viewed") {
    return { status: "sent", label: "Отправлено" }
  }
  if (status === "shortlisted") return { status: "wait", label: "В избранном" }
  if (status === "pending_supplier") {
    return { status: "pending", label: "Ожидает поставщика" }
  }
  if (status === "accepted") return { status: "won", label: "Принято" }
  if (status === "rejected") return { status: "rejected", label: "Отклонено" }
  if (status === "withdrawn") return { status: "withdrawn", label: "Отозвано" }
  if (status === "archived") return { status: "archived", label: "В архиве" }
  return { status, label: status }
}

export const MY_PROPOSAL_FILTER_STATUSES = [
  "submitted",
  "shortlisted",
  "rejected",
  "withdrawn",
] as const

export type MyProposalFilterStatus = (typeof MY_PROPOSAL_FILTER_STATUSES)[number]

export const PROPOSAL_CHAT_OPEN_STATUSES: ProposalStatus[] = [
  "submitted",
  "viewed",
  "shortlisted",
  "pending_supplier",
]

export const myProposalTabLabels: Record<MyProposalFilterStatus, string> = {
  submitted: "Отправлено",
  shortlisted: "В избранном",
  rejected: "Отклонено",
  withdrawn: "Отозвано",
}

export const proposalStatusMeta: Record<
  ProposalStatus,
  { label: string; className: string }
> = {
  submitted: {
    label: "Отправлено",
    className: "bg-info/10 text-info",
  },
  viewed: {
    label: "Просмотрено",
    className: "bg-muted text-muted-foreground",
  },
  shortlisted: {
    label: "В избранном",
    className: "bg-warning/10 text-warning",
  },
  pending_supplier: {
    label: "Ожидает поставщика",
    className: "bg-warning/10 text-warning",
  },
  accepted: {
    label: "Принято",
    className: "bg-success/10 text-success",
  },
  rejected: {
    label: "Отклонено",
    className: "bg-destructive/10 text-destructive",
  },
  withdrawn: {
    label: "Отозвано",
    className: "bg-muted text-muted-foreground",
  },
  archived: {
    label: "В архиве",
    className: "bg-muted text-muted-foreground",
  },
}
