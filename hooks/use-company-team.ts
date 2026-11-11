"use client"

import { useMemo } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import {
  useAddBuyerTeamMemberMutation,
  useBuyerCompaniesQuery,
  useRemoveBuyerTeamMemberMutation,
  useUpdateBuyerTeamMemberMutation,
} from "@/hooks/api/use-buyer-companies-query"
import {
  useAddSupplierTeamMemberMutation,
  useRemoveSupplierTeamMemberMutation,
  useSupplierCompaniesQuery,
  useUpdateSupplierTeamMemberMutation,
} from "@/hooks/api/use-supplier-companies-query"
import {
  canManageTeam,
  mapCompanyUsersToEmployees,
  myCompanyRole,
  type TeamSideKey,
} from "@/lib/company-team"
import type { CompanyRole, CompanyWithRelations, SideRole } from "@/types"

export type TeamSide = "buyer" | "supplier"

/**
 * The active company's team for one side of the cabinet, with the actions a
 * director or admin may take. Everyone sees the team; only they can change it.
 * The server checks the same rule, this only hides controls that would fail.
 */
export const useCompanyTeam = (side: TeamSide) => {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const refreshSession = useAuthStore((s) => s.refreshSession)

  const buyer = useBuyerCompaniesQuery(hydrated && useApi && side === "buyer")
  const supplier = useSupplierCompaniesQuery(hydrated && useApi && side === "supplier")
  const query = side === "buyer" ? buyer : supplier

  const addBuyer = useAddBuyerTeamMemberMutation()
  const updateBuyer = useUpdateBuyerTeamMemberMutation()
  const removeBuyer = useRemoveBuyerTeamMemberMutation()
  const addSupplier = useAddSupplierTeamMemberMutation()
  const updateSupplier = useUpdateSupplierTeamMemberMutation()
  const removeSupplier = useRemoveSupplierTeamMemberMutation()
  const add = side === "buyer" ? addBuyer : addSupplier
  const update = side === "buyer" ? updateBuyer : updateSupplier
  const remove = side === "buyer" ? removeBuyer : removeSupplier

  const company = useMemo((): CompanyWithRelations | null => {
    const items = query.data?.items ?? []
    const activeId = user?.activeCompanyId ?? user?.companyId
    return items.find((c) => c.id === activeId) ?? items[0] ?? null
  }, [query.data, user?.activeCompanyId, user?.companyId])

  const members = company?.company_users ?? []
  const employees = useMemo(
    () => mapCompanyUsersToEmployees(members, user?.userId),
    [members, user?.userId],
  )
  const myRole = myCompanyRole(members, user?.userId)
  // Both sides only matter when the company buys and sells.
  const sides = (["buyer", "supplier"] as const).filter((side) =>
    (company?.actor_types ?? []).includes(side),
  ) as TeamSideKey[]

  return {
    useApi,
    isLoading: !hydrated || (useApi && query.isLoading),
    company,
    employees,
    myRole,
    canManage: canManageTeam(myRole),
    busy: add.isPending || update.isPending || remove.isPending,
    sides,
    changeSideRole: (targetUserId: number, side: TeamSideKey, role: SideRole | null) =>
      company
        ? update.mutateAsync({
            companyId: company.id,
            targetUserId,
            data: side === "buyer" ? { buyer_role: role } : { supplier_role: role },
          })
        : Promise.resolve(undefined),
    changeRole: (targetUserId: number, role: CompanyRole) =>
      company
        ? update.mutateAsync({ companyId: company.id, targetUserId, data: { role } })
        : Promise.resolve(undefined),
    removeMember: (targetUserId: number) =>
      company
        ? remove.mutateAsync({ companyId: company.id, targetUserId })
        : Promise.resolve(undefined),
    /** Sends an invitation; resolves with it (and its link). */
    invite: (data: { email: string; role: CompanyRole }) =>
      company
        ? add.mutateAsync({ companyId: company.id, data })
        : Promise.resolve(undefined),
    /** Leave the company yourself, then drop back to the personal profile. */
    leave: async () => {
      if (!company || !user?.userId) return
      await remove.mutateAsync({ companyId: company.id, targetUserId: user.userId })
      await refreshSession()
    },
  }
}
