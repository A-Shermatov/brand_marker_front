import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  navCountsApi,
  type AdminNavCounts,
  type BuyerNavCounts,
  type BuyerNavSection,
  type NavCountsRole,
  type SupplierNavCounts,
  type SupplierNavSection,
} from "@/lib/api/nav-counts"
import { isApiEnabled } from "@/lib/api/config"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/lib/store/auth-store"

export const navCountsKeys = {
  all: ["nav-counts"] as const,
  role: (role: NavCountsRole) => [...navCountsKeys.all, role] as const,
}

export const useNavCountsQuery = <R extends NavCountsRole>(
  role: R,
  enabled = true,
) => {
  const hydrated = useHydrated()
  return useQuery({
    queryKey: navCountsKeys.role(role),
    queryFn: () => navCountsApi.get(role),
    enabled: hydrated && enabled && isApiEnabled(),
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

export const useBuyerNavCounts = (enabled = true) =>
  useNavCountsQuery("buyer", enabled)

export const useSupplierNavCounts = (enabled = true) =>
  useNavCountsQuery("supplier", enabled)

export const useAdminNavCounts = (enabled = true) =>
  useNavCountsQuery("admin", enabled)

export const useInvalidateNavCounts = () => {
  const queryClient = useQueryClient()
  return (role?: NavCountsRole) => {
    if (role) {
      void queryClient.invalidateQueries({ queryKey: navCountsKeys.role(role) })
      return
    }
    void queryClient.invalidateQueries({ queryKey: navCountsKeys.all })
  }
}

const localSeenKey = (
  userId: number,
  role: "buyer" | "supplier",
  section: string,
) => `nav-seen:${userId}:${role}:${section}`

export const useMarkNavSectionSeen = (
  role: "buyer" | "supplier",
  section: BuyerNavSection | SupplierNavSection,
) => {
  const hydrated = useHydrated()
  const userId = useAuthStore((s) => s.user?.userId ?? 0)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!hydrated || userId <= 0) return
    if (!isApiEnabled()) {
      try {
        localStorage.setItem(
          localSeenKey(userId, role, section),
          new Date().toISOString(),
        )
      } catch {
        // ignore quota / private mode
      }
      return
    }
    void navCountsApi
      .markSeen(role, section)
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: navCountsKeys.role(role) })
      })
      .catch(() => {
        // page still usable if mark-seen fails
      })
  }, [hydrated, queryClient, role, section, userId])
}

export const emptyBuyerNavCounts = (): BuyerNavCounts => ({
  rfqs: 0,
  rfqs_new: 0,
  deals: 0,
  deals_new: 0,
  messages: 0,
  approvals: 0,
  approvals_new: 0,
})

export const emptySupplierNavCounts = (): SupplierNavCounts => ({
  rfqs: 0,
  rfqs_new: 0,
  deals: 0,
  deals_new: 0,
  messages: 0,
  catalog: 0,
  catalog_new: 0,
})

export const emptyAdminNavCounts = (): AdminNavCounts => ({
  companies: 0,
  moderation: 0,
  catalog: 0,
  reports: 0,
  support: 0,
  chats: 0,
  disputes: 0,
  finance: 0,
})
