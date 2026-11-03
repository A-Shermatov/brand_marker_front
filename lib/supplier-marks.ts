import type { PublicSupplier } from "@/types"
import { pickReputationTier, type ReputationTier } from "@/lib/trust-levels"

export type CompanyMarks = {
  verified: boolean
  tier: ReputationTier
  plan: string | null
}

/** Marks shown next to a supplier's name: document check, reliability tier, paid plan. */
export const supplierMarks = (
  supplier: Pick<
    PublicSupplier,
    | "verification_status"
    | "reputation_tier"
    | "completed_contracts"
    | "rating"
    | "success_rate"
    | "subscription_plan"
  >,
): CompanyMarks => ({
  verified: supplier.verification_status === "verified",
  tier: pickReputationTier(supplier.reputation_tier, {
    verification_status: supplier.verification_status,
    completed_contracts: supplier.completed_contracts,
    rating: supplier.rating,
    success_rate: supplier.success_rate,
  }),
  plan: supplier.subscription_plan ?? null,
})
