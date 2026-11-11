import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminDashboardKeys } from "@/hooks/api/use-admin-dashboard-query"
import {
  adminApi,
  type AdminCompaniesParams,
  type AdminCompanyAction,
  type AdminCompanyChangeRequestsParams,
  type AdminCompanyDetail,
  type AdminCompanyVerificationStatus,
  type AdminPendingVerificationParams,
} from "@/lib/api/admin"
import {
  adminCompaniesApi,
  type AdminCompanyDocumentInput,
  type AdminCompanyMemberRole,
  type AdminCompanyUpdateInput,
} from "@/lib/api/admin-companies"

export const adminCompaniesKeys = {
  all: ["admin-companies"] as const,
  lists: () => [...adminCompaniesKeys.all, "list"] as const,
  list: (params: AdminCompaniesParams) =>
    [...adminCompaniesKeys.lists(), params] as const,
  pendingVerification: (params: AdminPendingVerificationParams) =>
    [...adminCompaniesKeys.all, "pending-verification", params] as const,
  changeRequests: (params: AdminCompanyChangeRequestsParams) =>
    [...adminCompaniesKeys.all, "change-requests", params] as const,
  changeRequest: (requestId: number) =>
    [...adminCompaniesKeys.all, "change-request", requestId] as const,
  details: () => [...adminCompaniesKeys.all, "detail"] as const,
  detail: (companyId: number) =>
    [...adminCompaniesKeys.details(), companyId] as const,
}

export const useAdminCompaniesQuery = (params: AdminCompaniesParams) =>
  useQuery({
    queryKey: adminCompaniesKeys.list(params),
    queryFn: () => adminApi.getCompanies(params),
    placeholderData: keepPreviousData,
  })

export const useAdminPendingVerificationQuery = (
  params: AdminPendingVerificationParams,
) =>
  useQuery({
    queryKey: adminCompaniesKeys.pendingVerification(params),
    queryFn: () => adminApi.getPendingVerificationCompanies(params),
    placeholderData: keepPreviousData,
  })

export const useAdminCompanyQuery = (companyId: number) =>
  useQuery({
    queryKey: adminCompaniesKeys.detail(companyId),
    queryFn: () => adminApi.getCompany(companyId),
    enabled: Number.isInteger(companyId) && companyId > 0,
  })

export const useAdminCompanyChangeRequestsQuery = (
  params: AdminCompanyChangeRequestsParams,
) =>
  useQuery({
    queryKey: adminCompaniesKeys.changeRequests(params),
    queryFn: () => adminApi.getCompanyChangeRequests(params),
    placeholderData: keepPreviousData,
  })

export const useAdminCompanyChangeRequestQuery = (requestId: number) =>
  useQuery({
    queryKey: adminCompaniesKeys.changeRequest(requestId),
    queryFn: () => adminApi.getCompanyChangeRequest(requestId),
    enabled: Number.isInteger(requestId) && requestId > 0,
  })

const invalidateCompanyQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  companyId?: number,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: [...adminCompaniesKeys.all, "pending-verification"],
    }),
    queryClient.invalidateQueries({
      queryKey: [...adminCompaniesKeys.all, "change-requests"],
    }),
    companyId != null
      ? queryClient.invalidateQueries({
          queryKey: adminCompaniesKeys.detail(companyId),
        })
      : queryClient.invalidateQueries({ queryKey: adminCompaniesKeys.details() }),
    queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all }),
  ])
}

export const useAdminCompanyChangeRequestActionMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      action,
      reason,
    }: {
      requestId: number
      action: "approve" | "reject"
      reason?: string
    }) => adminApi.applyCompanyChangeRequestAction(requestId, action, reason),
    onSuccess: async (data) => {
      await invalidateCompanyQueries(queryClient, data.company_id ?? undefined)
      await queryClient.invalidateQueries({
        queryKey: adminCompaniesKeys.changeRequest(data.id),
      })
    },
    meta: {
      errorMessage: "Не удалось обработать заявку",
    },
  })
}

export const useAdminCompanyActionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      companyId,
      action,
      reason,
    }: {
      companyId: number
      action: AdminCompanyAction
      reason?: string
    }) => adminApi.applyCompanyAction(companyId, action, reason),
    onSuccess: async (_, variables) => {
      await invalidateCompanyQueries(queryClient, variables.companyId)
    },
    meta: {
      errorMessage: "Не удалось изменить статус компании",
    },
  })
}

export const useAdminCompanyVipMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      companyId,
      vip,
      months,
      reason,
    }: {
      companyId: number
      vip: boolean
      months?: number | null
      reason?: string | null
    }) => adminApi.setCompanyVip(companyId, { vip, months, reason }),
    onSuccess: async (_, variables) => {
      await invalidateCompanyQueries(queryClient, variables.companyId)
    },
    meta: {
      errorMessage: "Не удалось изменить VIP",
    },
  })
}

const useCompanyDetailMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<AdminCompanyDetail>,
  errorMessage: string,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async (detail) => {
      queryClient.setQueryData(adminCompaniesKeys.detail(detail.id), detail)
      await invalidateCompanyQueries(queryClient, detail.id)
    },
    meta: { errorMessage },
  })
}

export const useAdminCompanyUpdateMutation = () =>
  useCompanyDetailMutation(
    ({ companyId, data }: { companyId: number; data: AdminCompanyUpdateInput }) =>
      adminCompaniesApi.update(companyId, data),
    "Не удалось сохранить данные компании",
  )

export const useAdminCompanyLogoMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: number; file: File }) =>
      adminCompaniesApi.uploadLogo(companyId, file),
    onSuccess: async (_, variables) => {
      await invalidateCompanyQueries(queryClient, variables.companyId)
    },
    meta: { errorMessage: "Не удалось загрузить логотип" },
  })
}

export const useAdminCompanyAddMemberMutation = () =>
  useCompanyDetailMutation(
    ({
      companyId,
      email,
      role,
    }: {
      companyId: number
      email: string
      role: AdminCompanyMemberRole
    }) => adminCompaniesApi.addMember(companyId, email, role),
    "Не удалось добавить участника",
  )

export const useAdminCompanyUpdateMemberMutation = () =>
  useCompanyDetailMutation(
    ({
      companyId,
      userId,
      role,
    }: {
      companyId: number
      userId: number
      role: AdminCompanyMemberRole
    }) => adminCompaniesApi.updateMember(companyId, userId, role),
    "Не удалось изменить роль участника",
  )

export const useAdminCompanyRemoveMemberMutation = () =>
  useCompanyDetailMutation(
    ({ companyId, userId }: { companyId: number; userId: number }) =>
      adminCompaniesApi.removeMember(companyId, userId),
    "Не удалось удалить участника",
  )

export const useAdminCompanyChangeOwnerMutation = () =>
  useCompanyDetailMutation(
    ({
      companyId,
      userId,
      email,
      reason,
    }: {
      companyId: number
      userId?: number
      email?: string
      reason?: string
    }) => adminCompaniesApi.changeOwner(companyId, { userId, email, reason }),
    "Не удалось сменить владельца",
  )

export const useAdminCompanyCategoriesMutation = () =>
  useCompanyDetailMutation(
    ({ companyId, categoryIds }: { companyId: number; categoryIds: number[] }) =>
      adminCompaniesApi.setCategories(companyId, categoryIds),
    "Не удалось сохранить категории",
  )

export const useAdminCompanyAddDocumentMutation = () =>
  useCompanyDetailMutation(
    ({ companyId, input }: { companyId: number; input: AdminCompanyDocumentInput }) =>
      adminCompaniesApi.addDocument(companyId, input),
    "Не удалось загрузить документ",
  )

export const useAdminCompanyDeleteDocumentMutation = () =>
  useCompanyDetailMutation(
    ({ companyId, documentId }: { companyId: number; documentId: number }) =>
      adminCompaniesApi.deleteDocument(companyId, documentId),
    "Не удалось удалить документ",
  )

export const useAdminCompanyVerificationStatusMutation = () =>
  useCompanyDetailMutation(
    ({
      companyId,
      status,
      reason,
    }: {
      companyId: number
      status: AdminCompanyVerificationStatus
      reason?: string
    }) => adminCompaniesApi.setVerificationStatus(companyId, status, reason),
    "Не удалось изменить статус проверки",
  )

/** Hide / unhide a company's catalog item via the shared catalog moderation action. */
export const useAdminCompanyCatalogItemMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      action,
      reason,
    }: {
      companyId: number
      itemId: number
      action: "hide" | "approve"
      reason?: string
    }) => adminApi.applyCatalogAction(itemId, action, reason),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminCompaniesKeys.detail(variables.companyId),
        }),
        queryClient.invalidateQueries({ queryKey: ["admin-catalog"] }),
      ])
    },
    meta: { errorMessage: "Не удалось изменить статус позиции" },
  })
}

/** Legacy approve/reject via /verify; UI should prefer useAdminCompanyActionMutation. */
export const useAdminVerifyCompanyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      companyId,
      approved,
    }: {
      companyId: number
      approved: boolean
    }) => adminApi.verifyCompany(companyId, approved),
    onSuccess: async (_, variables) => {
      await invalidateCompanyQueries(queryClient, variables.companyId)
    },
    meta: {
      successMessage: "Статус проверки обновлён",
      errorMessage: "Не удалось обновить проверку компании",
    },
  })
}
