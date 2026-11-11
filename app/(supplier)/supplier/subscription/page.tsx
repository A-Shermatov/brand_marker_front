"use client"

import { PlansPage } from "@/components/subscription/plans-page"

// The selling cabinet's plan: it lifts goods, services and offers. The buying
// cabinet has a plan of its own on /customer/plan.
export default function SubscriptionPage() {
  return <PlansPage side="supplier" />
}
