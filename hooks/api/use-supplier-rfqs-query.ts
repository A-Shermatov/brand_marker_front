import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supplierRfqsApi, supplierProposalsApi } from "@/lib/api/supplier/proposals"
import { isApiEnabled } from "@/lib/api/config"
import { notificationKeys } from "@/hooks/api/use-notifications-query"
import { navCountsKeys } from "@/hooks/api/use-nav-counts-query"
import type { PageParams } from "@/lib/pagination"
import type { Currency, ProposalWithRelations } from "@/types"

type SupplierBoardParams = PageParams & {
  q?: string
  source?: string
  /** Comma-separated category ids; a parent also covers its subcategories. */
  category_ids?: string
}

export const supplierRfqKeys = {
  all: ["supplier-rfqs"] as const,
  board: (page = 1, q = "", source = "all", categories = "") =>
    [...supplierRfqKeys.all, "board", page, q, source, categories] as const,
  subscriptions: () => [...supplierRfqKeys.all, "subscriptions"] as const,
  detail: (id: string) => [...supplierRfqKeys.all, "detail", id] as const,
  proposals: (page = 1) => ["supplier-proposals", page] as const,
}

export const useSupplierRfqBoardQuery = (
  enabled = true,
  params: SupplierBoardParams = {},
) =>
  useQuery({
    queryKey: supplierRfqKeys.board(
      params.page ?? 1,
      params.q ?? "",
      params.source ?? "all",
      params.category_ids ?? "",
    ),
    queryFn: () => supplierRfqsApi.board(params),
    enabled: enabled && isApiEnabled(),
  })

export const useSupplierRfqQuery = (id: string, enabled = true) =>
  useQuery({
    queryKey: supplierRfqKeys.detail(id),
    queryFn: () => supplierRfqsApi.get(id),
    enabled: enabled && isApiEnabled() && Boolean(id),
  })

export const useSupplierProposalsQuery = (enabled = true, params: PageParams = {}) =>
  useQuery({
    queryKey: supplierRfqKeys.proposals(params.page ?? 1),
    queryFn: () => supplierProposalsApi.list(params),
    enabled: enabled && isApiEnabled(),
  })

export const useSubmitSupplierProposalMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      rfqId,
      data,
    }: {
      rfqId: string
      data: {
        price: number
        currency: string
        delivery_time?: string
        message?: string
      }
    }) => supplierRfqsApi.submitProposal(rfqId, data),
    onSuccess: (_data, { rfqId }) => {
      qc.invalidateQueries({ queryKey: supplierRfqKeys.all })
      qc.invalidateQueries({ queryKey: supplierRfqKeys.detail(rfqId) })
      qc.invalidateQueries({ queryKey: supplierRfqKeys.proposals() })
      qc.invalidateQueries({ queryKey: notificationKeys.all })
      void qc.invalidateQueries({ queryKey: navCountsKeys.role("supplier") })
    },
    meta: {
      successMessage: "Предложение отправлено",
      errorMessage: "Не удалось отправить предложение",
    },
  })
}

export const useWithdrawProposalMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => supplierProposalsApi.withdraw(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierRfqKeys.all })
      qc.invalidateQueries({ queryKey: supplierRfqKeys.proposals() })
      qc.invalidateQueries({ queryKey: notificationKeys.all })
      void qc.invalidateQueries({ queryKey: navCountsKeys.role("supplier") })
    },
    meta: {
      successMessage: "Предложение отозвано",
      errorMessage: "Не удалось отозвать предложение",
    },
  })
}

export const useUpdateSupplierProposalMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: {
        price?: number
        currency?: Currency
        delivery_time?: string
        message?: string
      }
    }) => supplierProposalsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierRfqKeys.all })
      qc.invalidateQueries({ queryKey: supplierRfqKeys.proposals() })
      void qc.invalidateQueries({ queryKey: navCountsKeys.role("supplier") })
    },
    meta: {
      successMessage: "Предложение обновлено",
      errorMessage: "Не удалось обновить предложение",
    },
  })
}

export const hasSupplierProposalForRfq = (
  proposals: ProposalWithRelations[] | undefined,
  rfqId: string,
): boolean => Boolean(proposals?.some((p) => p.rfq_id === rfqId))

export const useRfqCategorySubscriptionsQuery = (enabled = true) =>
  useQuery({
    queryKey: supplierRfqKeys.subscriptions(),
    queryFn: () => supplierRfqsApi.subscriptions(),
    enabled: enabled && isApiEnabled(),
  })

export const useSaveRfqCategorySubscriptionsMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categoryIds: number[]) => supplierRfqsApi.saveSubscriptions(categoryIds),
    onSuccess: (data) => qc.setQueryData(supplierRfqKeys.subscriptions(), data),
    meta: {
      successMessage: "Уведомления сохранены",
      errorMessage: "Не удалось сохранить уведомления",
    },
  })
}
