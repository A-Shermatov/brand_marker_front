import { apiFetch } from "../client"

export type SubscriptionResponse = {
  plan: string
  active_until: string | null
  is_active: boolean
}

export type SubscriptionPaymentMethod = {
  id: "alif" | "dc" | "eskhata"
  label: string
  supported: boolean
  hint: string
}

export type SubscriptionPaymentConfig = {
  provider: "alif" | "mock"
  currency: string
  methods: SubscriptionPaymentMethod[]
}

export type SubscriptionCheckoutResponse = {
  plan: string
  active_until: string | null
  is_active: boolean
  payment_status: string
  order_id: string | null
  payment_url: string | null
  gateway: string
  message: string | null
}

export type SubscriptionOrderSyncResponse = {
  order_id: string
  payment_status: string
  plan: string | null
  is_active: boolean
  active_until: string | null
}

export type SubscriptionPaymentMethodId = "alif" | "dc" | "eskhata"

/** The plan of one cabinet: each side has its own, bought separately. */
export const subscriptionApi = (side: "supplier" | "buyer") => {
  const base = `/${side}/subscription`
  return {
    get: () => apiFetch<SubscriptionResponse>(base),

    paymentConfig: () => apiFetch<SubscriptionPaymentConfig>(`${base}/payments/config`),

    checkout: (plan: string, method: SubscriptionPaymentMethodId = "alif") =>
      apiFetch<SubscriptionCheckoutResponse>(`${base}/checkout`, {
        method: "POST",
        body: JSON.stringify({ plan, method }),
      }),

    syncAlifOrder: (orderId: string) =>
      apiFetch<SubscriptionOrderSyncResponse>(
        `${base}/alif/orders/${encodeURIComponent(orderId)}/sync`,
        { method: "POST" },
      ),

    cancel: () => apiFetch<SubscriptionCheckoutResponse>(`${base}/cancel`, { method: "POST" }),
  }
}

export const supplierSubscriptionApi = subscriptionApi("supplier")
