import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { subscriptionApi, type SubscriptionPaymentMethodId } from "@/lib/api/supplier/subscription"
import { isApiEnabled } from "@/lib/api/config"
import type { PlanSide } from "@/lib/subscription"

/** Cache keys of one cabinet's plan; the selling cabinet keeps the old key. */
export const subscriptionKeys = (side: PlanSide) => {
  const root = side === "supplier" ? "supplier-subscription" : "buyer-subscription"
  return { all: [root] as const, config: [root, "payment-config"] as const }
}

export const supplierSubscriptionKeys = subscriptionKeys("supplier")

export const useSubscriptionQuery = (side: PlanSide, enabled = true) =>
  useQuery({
    queryKey: subscriptionKeys(side).all,
    queryFn: () => subscriptionApi(side).get(),
    enabled: enabled && isApiEnabled(),
  })

export const useSupplierSubscriptionQuery = (enabled = true) => useSubscriptionQuery("supplier", enabled)

export const useSubscriptionPaymentConfigQuery = (enabled = true, side: PlanSide = "supplier") =>
  useQuery({
    queryKey: subscriptionKeys(side).config,
    queryFn: () => subscriptionApi(side).paymentConfig(),
    enabled: enabled && isApiEnabled(),
  })

export const useActivateSubscriptionMutation = (side: PlanSide = "supplier") => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      plan,
      method = "alif",
    }: {
      plan: string
      method?: SubscriptionPaymentMethodId
    }) => subscriptionApi(side).checkout(plan, method),
    onSuccess: (data) => {
      if (data.is_active || data.payment_status === "paid") {
        qc.invalidateQueries({ queryKey: subscriptionKeys(side).all })
      }
    },
    meta: {
      errorMessage: "Не удалось оформить подписку",
    },
  })
}

export const useSyncSubscriptionOrderMutation = (side: PlanSide = "supplier") => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => subscriptionApi(side).syncAlifOrder(orderId),
    onSuccess: (data) => {
      if (data.is_active || data.payment_status === "ok") {
        qc.invalidateQueries({ queryKey: subscriptionKeys(side).all })
      }
    },
  })
}

export const useCancelSubscriptionMutation = (side: PlanSide = "supplier") => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => subscriptionApi(side).cancel(),
    onSuccess: () => qc.invalidateQueries({ queryKey: subscriptionKeys(side).all }),
    meta: {
      successMessage: "Подписка отменена",
      errorMessage: "Не удалось отменить подписку",
    },
  })
}
