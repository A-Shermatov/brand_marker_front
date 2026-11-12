import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminDashboardKeys } from "@/hooks/api/use-admin-dashboard-query"
import { adminUsersKeys } from "@/hooks/api/use-admin-users-query"
import { navCountsKeys } from "@/hooks/api/use-nav-counts-query"
import { isApiEnabled } from "@/lib/api/config"
import {
  adminClientsApi,
  myVerificationApi,
  type AdminIndividualAction,
  type AdminIndividualDetail,
  type AdminIndividualsParams,
  type IndividualDocumentType,
  type IndividualVerificationStatus,
  type MyIndividualVerification,
} from "@/lib/api/client-verification"

export const myVerificationKeys = {
  all: ["my-verification"] as const,
}

export const adminClientsKeys = {
  all: ["admin-clients"] as const,
  counts: () => [...adminClientsKeys.all, "counts"] as const,
  individuals: () => [...adminClientsKeys.all, "individuals"] as const,
  individualList: (params: AdminIndividualsParams) =>
    [...adminClientsKeys.individuals(), "list", params] as const,
  individual: (userId: number) =>
    [...adminClientsKeys.individuals(), "detail", userId] as const,
  dossier: (userId: number) => [...adminClientsKeys.all, "dossier", userId] as const,
}

export const useMyVerificationQuery = (enabled = true) =>
  useQuery({
    queryKey: myVerificationKeys.all,
    queryFn: () => myVerificationApi.get(),
    enabled: enabled && isApiEnabled(),
  })

const useMyVerificationMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<MyIndividualVerification>,
  errorMessage: string,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(myVerificationKeys.all, data)
    },
    meta: { errorMessage },
  })
}

export const useUploadMyVerificationDocumentMutation = () =>
  useMyVerificationMutation(
    ({ file, docType }: { file: File; docType: IndividualDocumentType }) =>
      myVerificationApi.uploadDocument(file, docType),
    "Не удалось загрузить документ",
  )

export const useDeleteMyVerificationDocumentMutation = () =>
  useMyVerificationMutation(
    (documentId: number) => myVerificationApi.deleteDocument(documentId),
    "Не удалось удалить документ",
  )

export const useSubmitMyVerificationMutation = () =>
  useMyVerificationMutation(() => myVerificationApi.submit(), "Не удалось отправить на проверку")

export const useAdminVerificationCountsQuery = (enabled = true) =>
  useQuery({
    queryKey: adminClientsKeys.counts(),
    queryFn: () => adminClientsApi.getCounts(),
    staleTime: 15_000,
    refetchInterval: 60_000,
    enabled,
  })

export const useAdminIndividualsQuery = (params: AdminIndividualsParams) =>
  useQuery({
    queryKey: adminClientsKeys.individualList(params),
    queryFn: () => adminClientsApi.getIndividuals(params),
    placeholderData: keepPreviousData,
  })

export const useAdminIndividualQuery = (userId: number | null) =>
  useQuery({
    queryKey: adminClientsKeys.individual(userId ?? 0),
    queryFn: () => adminClientsApi.getIndividual(userId as number),
    enabled: userId != null && Number.isInteger(userId) && userId > 0,
  })

export const useAdminUserDossierQuery = (userId: number, enabled = true) =>
  useQuery({
    queryKey: adminClientsKeys.dossier(userId),
    queryFn: () => adminClientsApi.getDossier(userId),
    enabled: enabled && Number.isInteger(userId) && userId > 0,
  })

const useIndividualAdminMutation = <TVariables extends { userId: number }>(
  mutationFn: (variables: TVariables) => Promise<AdminIndividualDetail>,
  errorMessage: string,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      queryClient.setQueryData(adminClientsKeys.individual(variables.userId), data)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminClientsKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminUsersKeys.detail(variables.userId) }),
        queryClient.invalidateQueries({ queryKey: navCountsKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all }),
      ])
    },
    meta: { errorMessage },
  })
}

export const useAdminIndividualVerificationMutation = () =>
  useIndividualAdminMutation(
    ({
      userId,
      action,
      status,
      reason,
    }: {
      userId: number
      action: AdminIndividualAction
      status?: IndividualVerificationStatus
      reason?: string
    }) => adminClientsApi.setVerification(userId, { action, status, reason }),
    "Не удалось изменить статус проверки",
  )

export const useAdminAddIndividualDocumentMutation = () =>
  useIndividualAdminMutation(
    ({ userId, file, docType }: { userId: number; file: File; docType: IndividualDocumentType }) =>
      adminClientsApi.addDocument(userId, file, docType),
    "Не удалось загрузить документ",
  )

export const useAdminDeleteIndividualDocumentMutation = () =>
  useIndividualAdminMutation(
    ({ userId, documentId }: { userId: number; documentId: number }) =>
      adminClientsApi.deleteDocument(userId, documentId),
    "Не удалось удалить документ",
  )
