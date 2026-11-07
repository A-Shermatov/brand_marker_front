import { pickReputationTier, type ReputationTier } from "@/lib/trust-levels"

export type CompanyMarks = {
  verified: boolean
  tier: ReputationTier
  plan: string | null
}

/** What a public profile (selling or buying) says about the marks. */
type ProfileMarkFields = {
  verification_status?: string | null
  reputation_tier?: string
  subscription_plan?: string | null
  completed_contracts?: number
  rating?: number
  success_rate?: number | null
}

/**
 * Marks shown next to a name: document check, reliability mark, paid plan.
 * The same for a company's selling and buying profiles.
 */
export const profileMarks = (profile: ProfileMarkFields): CompanyMarks => ({
  verified: profile.verification_status === "verified",
  tier: pickReputationTier(profile.reputation_tier, {
    verification_status: profile.verification_status,
    completed_contracts: profile.completed_contracts,
    rating: profile.rating,
    success_rate: profile.success_rate,
  }),
  plan: profile.subscription_plan ?? null,
})

export const supplierMarks = profileMarks
