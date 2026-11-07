"use client"

import { useMemo } from "react"
import { usePublicBuyerQuery } from "@/hooks/api/use-public-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { getActorId } from "@/lib/auth-display"
import { useAuthStore } from "@/lib/store/auth-store"
import { profileMarks, type CompanyMarks } from "@/lib/supplier-marks"

export type BuyerMarks = CompanyMarks & { title: string | null }

const NO_MARKS: BuyerMarks = { title: null, verified: false, tier: "none", plan: null }

/**
 * Marks of the buyer's active profile, from the same public profile suppliers
 * see. The reliability mark and the plan are shared with the selling profile.
 */
export function useBuyerMarks(): BuyerMarks {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = usePublicBuyerQuery(getActorId(user), hydrated && isApiEnabled())

  return useMemo(
    () => (profile ? { title: profile.display_name, ...profileMarks(profile) } : NO_MARKS),
    [profile],
  )
}
