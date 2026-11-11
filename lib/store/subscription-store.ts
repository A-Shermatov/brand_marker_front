import { create } from "zustand"
import { persist } from "zustand/middleware"

export type SubscriptionPlan = "none" | "start" | "pro" | "business"

interface SubscriptionState {
  plan: SubscriptionPlan
  activeUntil?: number
  activate: (plan: Exclude<SubscriptionPlan, "none">) => void
  cancel: () => void
  isActive: () => boolean
}

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

const createPlanStore = (name: string) =>
  create<SubscriptionState>()(
    persist(
      (set, get) => ({
        plan: "none",
        activeUntil: undefined,
        activate: (plan) => set({ plan, activeUntil: Date.now() + THIRTY_DAYS }),
        cancel: () => set({ plan: "none", activeUntil: undefined }),
        isActive: () => {
          const { plan, activeUntil } = get()
          return plan !== "none" && !!activeUntil && activeUntil > Date.now()
        },
      }),
      { name },
    ),
  )

/** The selling cabinet's plan (demo mode without the API). */
export const useSubscriptionStore = createPlanStore("bm-subscription")
/** The buying cabinet's plan: bought separately, kept separately. */
export const useBuyerSubscriptionStore = createPlanStore("bm-subscription-buyer")
