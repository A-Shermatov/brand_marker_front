import type { Review, ReviewParty } from "@/types"
import { companyRoleLabel } from "@/lib/company-team"

export const formatReviewParty = (
  party: ReviewParty | null | undefined,
  fallback: string,
): { primary: string; secondary: string | null } => {
  if (!party) return { primary: fallback, secondary: null }

  const company = party.company_title?.trim() || null
  const user = party.user_name?.trim() || null
  const display = party.display_name?.trim() || null

  // Always prefer: user name + company (both), as shown in reviews.
  if (user && company && user !== company) {
    return { primary: user, secondary: company }
  }
  if (company && user) {
    return { primary: company, secondary: null }
  }
  if (company) {
    return {
      primary: company,
      secondary: user && user !== company ? user : null,
    }
  }
  if (user) {
    return {
      primary: user,
      secondary: company && company !== user ? company : null,
    }
  }
  return { primary: display || fallback, secondary: null }
}

/**
 * Who wrote the review: the employee's name, then "Руководитель, ООО «…»".
 * Older reviews have no author and fall back to the reviewing company.
 */
export const formatReviewAuthor = (
  review: Review,
  fallback: string,
): { primary: string; secondary: string | null } => {
  const author = review.author
  const name = author?.name?.trim()
  if (author && name) {
    const company = author.company_title?.trim() || review.reviewer?.company_title?.trim() || null
    const role = author.role ? companyRoleLabel(author.role) : null
    const secondary = [role, company].filter(Boolean).join(", ")
    return { primary: name, secondary: secondary || null }
  }
  return formatReviewParty(review.reviewer, fallback)
}

export const reviewAuthorLabel = (
  review: Review,
  fallback = "Покупатель",
): string => {
  const { primary, secondary } = formatReviewAuthor(review, fallback)
  return secondary ? `${primary} · ${secondary}` : primary
}

export const reviewTargetLabel = (
  review: Review,
  fallback = "Участник",
): string => {
  const { primary, secondary } = formatReviewParty(review.target, fallback)
  return secondary ? `${primary} · ${secondary}` : primary
}

/** Build a party object from a public buyer/supplier-like payload. */
export const partyFromPublicActor = (actor: {
  actor_id: number
  kind: string
  display_name: string
  company_id?: number | null
}): ReviewParty => {
  const isCompany = actor.kind === "company"
  return {
    actor_id: actor.actor_id,
    kind: actor.kind,
    display_name: actor.display_name,
    company_title: isCompany ? actor.display_name : null,
    user_name: isCompany ? null : actor.display_name,
  }
}
