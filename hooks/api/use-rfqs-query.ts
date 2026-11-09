import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { BuyerRfqStatusFilter } from "@/lib/buyer-rfq-display"
import { rfqsApi } from "@/lib/api/rfqs"
import { isApiEnabled } from "@/lib/api/config"
import type { PageParams } from "@/lib/pagination"
import type { RfqCreate, RfqUpdate } from "@/types"

type RfqListParams = PageParams & { q?: string; type?: string }

export const rfqKeys = {
  all: ["rfqs"] as const,
  list: (tab?: string, page = 1, q = "", type = "all") =>
    [...rfqKeys.all, "list", tab ?? "all", page, q, type] as const,
  detail: (id: string) => [...rfqKeys.all, "detail", id] as const,
}

export const useRfqsQuery = (
  filter: BuyerRfqStatusFilter,
  enabled = true,
  params: RfqListParams = {},
) =>
  useQuery({
    queryKey: rfqKeys.list(
      filter,
      params.page ?? 1,
      params.q ?? "",
      params.type ?? "all",
    ),
    queryFn: () => rfqsApi.list(filter, params),
    enabled: enabled && isApiEnabled(),
  })

export const useActiveRfqsQuery = (enabled = true, params: PageParams = {}) =>
  useQuery({
    queryKey: rfqKeys.list("active", params.page ?? 1),
    queryFn: () => rfqsApi.list("active", params),
    enabled: enabled && isApiEnabled(),
  })

export const useRfqQuery = (id: string, enabled = true) =>
  useQuery({
    queryKey: rfqKeys.detail(id),
    queryFn: () => rfqsApi.get(id),
    enabled: enabled && isApiEnabled() && Boolean(id),
  })

const invalidateRfqs = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: rfqKeys.all })

export const useCreateRfqMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RfqCreate) => rfqsApi.create(data),
    onSuccess: () => invalidateRfqs(qc),
    meta: {
      errorMessage: "Не удалось создать заявку",
    },
  })
}

export const useUpdateRfqMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RfqUpdate }) => rfqsApi.update(id, data),
    onSuccess: (_d, { id }) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      errorMessage: "Не удалось обновить заявку",
    },
  })
}

export const usePublishRfqMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rfqsApi.publish(id),
    onSuccess: (_d, id) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      successMessage: "Заявка опубликована",
      errorMessage: "Не удалось опубликовать заявку",
    },
  })
}

export const useCloseRfqMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rfqsApi.close(id, reason),
    onSuccess: (_d, { id }) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      successMessage: "Заявка отменена",
      errorMessage: "Не удалось отменить заявку",
    },
  })
}

export const useArchiveRfqMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      rfqsApi.archive(id, archived),
    onSuccess: (_d, { id }) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      errorMessage: "Не удалось изменить архив",
    },
  })
}

export const useInviteSuppliersMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, supplierIds }: { id: string; supplierIds: number[] }) =>
      rfqsApi.invite(id, supplierIds),
    onSuccess: (_d, { id }) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      errorMessage: "Не удалось пригласить поставщика",
    },
  })
}

export const useUploadRfqAttachmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      rfqsApi.uploadAttachment(id, file),
    onSuccess: (_d, { id }) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      errorMessage: "Не удалось загрузить файл",
    },
  })
}

export const useDeleteRfqAttachmentMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      rfqsApi.deleteAttachment(id, attachmentId),
    onSuccess: (_d, { id }) => {
      invalidateRfqs(qc)
      qc.invalidateQueries({ queryKey: rfqKeys.detail(id) })
    },
    meta: {
      successMessage: "Вложение удалено",
      errorMessage: "Не удалось удалить вложение",
    },
  })
}
