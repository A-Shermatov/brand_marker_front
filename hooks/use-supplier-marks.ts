"use client"

import { useMemo } from "react"
import { usePublicSupplierQuery } from "@/hooks/api/use-public-query"
import { useSupplierCompaniesQuery } from "@/hooks/api/use-supplier-companies-query"
import { useSupplierSubscriptionQuery } from "@/hooks/api/use-supplier-subscription-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { getActorId } from "@/lib/auth-display"
import { useAuthStore } from "@/lib/store/auth-store"
import { supplierMarks } from "@/lib/supplier-marks"
import { pickReputationTier, type ReputationTier } from "@/lib/trust-levels"

export type SupplierMarks = {
  title: string | null
  verified: boolean
  tier: ReputationTier
  plan: string | null
  stats: {
    verified: boolean
    completed: number
    rating: number
    /** Share of finished deals without a dispute, % */
    onTime: number | null
  }
}

/**
 * Marks of the supplier's active company, taken from the same public profile
 * buyers see, so the cabinet never shows a mark the catalog does not.
 */
export function useSupplierMarks(): SupplierMarks {
  const hydrated = useHydrated()
  const enabled = hydrated && isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = usePublicSupplierQuery(getActorId(user), enabled)
  const { data: companies } = useSupplierCompaniesQuery(enabled)
  const { data: subscription } = useSupplierSubscriptionQuery(enabled)
  const company =
    companies?.items?.find((c) => c.id === user?.activeCompanyId) ??
    companies?.items?.[0]

  return useMemo(() => {
    const plan = subscription?.is_active ? subscription.plan : null
    if (profile) {
      const marks = supplierMarks(profile)
      return {
        title: profile.display_name,
        ...marks,
        plan: marks.plan ?? plan,
        stats: {
          verified: marks.verified,
          completed: profile.completed_contracts ?? 0,
          rating: profile.rating,
          onTime: profile.success_rate ?? null,
        },
      }
    }
    const verified = company?.verification_status === "verified"
    const completed = Number(company?.stats?.completed_contracts ?? 0)
    const disputes = Number(company?.stats?.disputes_count ?? 0)
    const rating = Number(company?.stats?.average_rating ?? company?.rating ?? 0)
    const denom = completed + disputes
    const onTime = denom > 0 ? (completed / denom) * 100 : null
    return {
      title: company?.title ?? null,
      verified,
      tier: pickReputationTier(undefined, {
        verification_status: company?.verification_status,
        completed_contracts: completed,
        rating,
        success_rate: onTime,
      }),
      plan,
      stats: { verified, completed, rating, onTime },
    }
  }, [profile, company, subscription])
}
