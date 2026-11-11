"use client"

import { PlansPage } from "@/components/subscription/plans-page"

// The buying cabinet has a plan of its own: it lifts the buyer's requests in
// the suppliers' feed. It is bought apart from the selling cabinet's plan.
export default function CustomerPlanPage() {
  return <PlansPage side="buyer" />
}
