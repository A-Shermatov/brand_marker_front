import type { Proposal, ProposalStatus } from "@/types"
import type { ProposalSortMode } from "@/components/cabinet/rfq/proposals-review-toolbar"

const STATUS_PRIORITY: Record<ProposalStatus, number> = {
  shortlisted: 0,
  submitted: 1,
  viewed: 2,
  pending_supplier: 3,
  accepted: 4,
  rejected: 5,
  withdrawn: 6,
  archived: 7,
}

export const sortProposalsForReview = (
  proposals: Proposal[],
  sortMode: ProposalSortMode,
): Proposal[] => {
  const sorted = [...proposals]

  if (sortMode === "price_asc") {
    return sorted.sort((a, b) => a.price - b.price)
  }
  if (sortMode === "price_desc") {
    return sorted.sort((a, b) => b.price - a.price)
  }
  if (sortMode === "date_desc") {
    return sorted.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }

  return sorted.sort((a, b) => {
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (priorityDiff !== 0) return priorityDiff
    return a.price - b.price
  })
}

const COMPARABLE_STATUSES: ProposalStatus[] = ["submitted", "viewed", "shortlisted"]

const parseDays = (value: string | null): number | null => {
  const match = value?.match(/(\d+)/)
  if (!match) return null
  const days = Number(match[1])
  const isWeeks = /нед|week/i.test(value ?? "")
  const isMonths = /мес|month/i.test(value ?? "")
  if (!Number.isFinite(days) || days <= 0) return null
  if (isMonths) return days * 30
  if (isWeeks) return days * 7
  return days
}

/** Helpful badges for comparing proposals: cheapest and fastest among active ones. */
export const getProposalMarks = (proposals: Proposal[]): Map<number, string[]> => {
  const marks = new Map<number, string[]>()
  const active = proposals.filter((p) => COMPARABLE_STATUSES.includes(p.status))
  if (active.length < 2) return marks

  const add = (id: number, label: string) => marks.set(id, [...(marks.get(id) ?? []), label])

  const currency = active[0]!.currency
  if (active.every((p) => p.currency === currency)) {
    const minPrice = Math.min(...active.map((p) => p.price))
    const cheapest = active.filter((p) => p.price === minPrice)
    if (cheapest.length === 1) add(cheapest[0]!.id, "Самая низкая цена")
  }

  const withDays = active
    .map((p) => ({ id: p.id, days: parseDays(p.delivery_time) }))
    .filter((p): p is { id: number; days: number } => p.days != null)
  if (withDays.length >= 2) {
    const minDays = Math.min(...withDays.map((p) => p.days))
    const fastest = withDays.filter((p) => p.days === minDays)
    if (fastest.length === 1) add(fastest[0]!.id, "Быстрее всех")
  }

  return marks
}

export const filterProposalsByStatus = (
  proposals: Proposal[],
  status: ProposalStatus | "all",
): Proposal[] => {
  if (status === "all") return proposals
  return proposals.filter((p) => p.status === status)
}
