"use client"

import { TrustPage } from "@/components/trust/trust-page"
import { useBuyerMarks } from "@/hooks/use-buyer-marks"

// The same mark as in the selling cabinet: it is counted from all deals and
// reviews of the owner, so a buyer earns it by buying too.
export default function CustomerTrustPage() {
  const { stats, tier, title } = useBuyerMarks()
  return <TrustPage side="buyer" title={title} tier={tier} stats={stats} />
}
