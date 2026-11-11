import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  buyerCompaniesApi,
  type TeamMemberPayload,
  type TeamMemberUpdatePayload,
} from "@/lib/api/companies"
import { isApiEnabled } from "@/lib/api/config"
import type { PageParams } from "@/lib/pagination"
import type { CompanyWizardInput } from "@/types"

export const buyerCompanyKeys = {
  all: ["buyer-companies"] as const,
  mine: (page = 1) => [...buyerCompanyKeys.all, "mine", page] as const,
  detail: (companyId: number) =>
    [...buyerCompanyKeys.all, "detail", companyId] as const,
}

export const useBuyerCompaniesQuery = (enabled = true, params: PageParams = {}) =>
  useQuery({
    queryKey: buyerCompanyKeys.mine(params.page ?? 1),
    queryFn: () => buyerCompaniesApi.mine(params),
    enabled: enabled && isApiEnabled(),
  })

export const useBuyerCompanyQuery = (
  companyId: number | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: buyerCompanyKeys.detail(companyId ?? 0),
    queryFn: () => buyerCompaniesApi.get(companyId!),
    enabled: enabled && isApiEnabled() && Boolean(companyId),
  })

export const useCreateBuyerCompanyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CompanyWizardInput) => buyerCompaniesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: buyerCompanyKeys.all })
    },
    meta: {
      successMessage: "Компания создана",
      errorMessage: "Не удалось создать компанию",
    },
  })
}

export const useUpdateBuyerCompanyMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyId,
      data,
    }: {
      companyId: number
      data: CompanyWizardInput
    }) => buyerCompaniesApi.update(companyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: buyerCompanyKeys.all })
    },
    meta: {
      successMessage: "Компания обновлена",
      errorMessage: "Не удалось обновить компанию",
    },
  })
}

const invalidateBuyerCompanies = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: buyerCompanyKeys.all })
}

export const useAddBuyerTeamMemberMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyId,
      data,
    }: {
      companyId: number
      data: TeamMemberPayload
    }) => buyerCompaniesApi.addTeamMember(companyId, data),
    onSuccess: () => invalidateBuyerCompanies(qc),
    meta: {
      successMessage: "Приглашение отправлено",
      errorMessage: "Не удалось отправить приглашение",
    },
  })
}

export const useUpdateBuyerTeamMemberMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyId,
      targetUserId,
      data,
    }: {
      companyId: number
      targetUserId: number
      data: TeamMemberUpdatePayload
    }) => buyerCompaniesApi.updateTeamMember(companyId, targetUserId, data),
    onSuccess: () => invalidateBuyerCompanies(qc),
    meta: {
      successMessage: "Роль обновлена",
      errorMessage: "Не удалось изменить роль",
    },
  })
}

export const useRemoveBuyerTeamMemberMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      companyId,
      targetUserId,
    }: {
      companyId: number
      targetUserId: number
    }) => buyerCompaniesApi.removeTeamMember(companyId, targetUserId),
    onSuccess: () => invalidateBuyerCompanies(qc),
    meta: {
      successMessage: "Доступ к компании закрыт",
      errorMessage: "Не удалось убрать сотрудника",
    },
  })
}

/** Invitations of a company; only its director and admins may see them. */
export const useBuyerInvitationsQuery = (
  companyId: number | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: [...buyerCompanyKeys.all, "invitations", companyId ?? 0] as const,
    queryFn: () => buyerCompaniesApi.invitations(companyId!),
    enabled: enabled && isApiEnabled() && Boolean(companyId),
  })

export const useResendBuyerInvitationMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, invitationId }: { companyId: number; invitationId: number }) =>
      buyerCompaniesApi.resendInvitation(companyId, invitationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: buyerCompanyKeys.all }),
    meta: {
      successMessage: "Приглашение отправлено ещё раз",
      errorMessage: "Не удалось отправить приглашение",
    },
  })
}

export const useCancelBuyerInvitationMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, invitationId }: { companyId: number; invitationId: number }) =>
      buyerCompaniesApi.cancelInvitation(companyId, invitationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: buyerCompanyKeys.all }),
    meta: {
      successMessage: "Приглашение отменено",
      errorMessage: "Не удалось отменить приглашение",
    },
  })
}
