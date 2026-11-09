import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { approvalsApi } from "@/lib/api/approvals"
import { isApiEnabled } from "@/lib/api/config"
import { navCountsKeys } from "@/hooks/api/use-nav-counts-query"
import { rfqKeys } from "@/hooks/api/use-rfqs-query"
import type { PageParams } from "@/lib/pagination"

export const approvalKeys = {
  all: ["buyer-approvals"] as const,
  list: (status: string, page = 1) =>
    [...approvalKeys.all, "list", status, page] as const,
}

export const useApprovalsQuery = (
  status: "wait" | "hist" | "all" = "all",
  enabled = true,
  params: PageParams = {},
) =>
  useQuery({
    queryKey: approvalKeys.list(status, params.page ?? 1),
    queryFn: () => approvalsApi.list({ ...params, status }),
    enabled: enabled && isApiEnabled(),
  })

export const useCartCheckoutMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof approvalsApi.checkout>[0]) =>
      approvalsApi.checkout(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: approvalKeys.all })
      void qc.invalidateQueries({ queryKey: navCountsKeys.role("buyer") })
      // The orders appear in the request list at once.
      void qc.invalidateQueries({ queryKey: rfqKeys.all })
    },
    meta: { errorMessage: "Не удалось оформить корзину" },
  })
}

export const useDecideApprovalMutation = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: number
      action: "approved" | "rejected"
    }) => approvalsApi.decide(id, action),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: approvalKeys.all })
      void qc.invalidateQueries({ queryKey: navCountsKeys.role("buyer") })
    },
    meta: {
      successMessage: "Решение сохранено",
      errorMessage: "Не удалось сохранить решение",
    },
  })
}
