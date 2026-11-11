"use client"

import { useMemo } from "react"
import { usePublicBuyerQuery } from "@/hooks/api/use-public-query"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { getActorId } from "@/lib/auth-display"
import { useAuthStore } from "@/lib/store/auth-store"
import { profileMarks, type CompanyMarks } from "@/lib/supplier-marks"

export type BuyerMarks = CompanyMarks & {
  title: string | null
  /** The numbers the reliability mark is counted from. */
  stats: { verified: boolean; completed: number; rating: number; onTime: number | null }
}

const NO_MARKS: BuyerMarks = {
  title: null,
  verified: false,
  tier: "none",
  plan: null,
  stats: { verified: false, completed: 0, rating: 0, onTime: null },
}

/**
 * Marks of the buyer's active profile, from the same public profile suppliers
 * see. The reliability mark is shared with the selling profile; the plan is the
 * buying cabinet's own.
 */
export function useBuyerMarks(): BuyerMarks {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = usePublicBuyerQuery(getActorId(user), hydrated && isApiEnabled())

  return useMemo(
    () => {
      if (!profile) return NO_MARKS
      const marks = profileMarks(profile)
      return {
        title: profile.display_name,
        ...marks,
        stats: {
          verified: marks.verified,
          completed: profile.completed_contracts ?? 0,
          rating: profile.rating ?? 0,
          onTime: profile.success_rate ?? null,
        },
      }
    },
    [profile],
  )
}
