"use client"

import { TrustPage } from "@/components/trust/trust-page"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"

export default function SupplierTrustPage() {
  const { stats, tier, title } = useSupplierMarks()
  return <TrustPage side="supplier" title={title} tier={tier} stats={stats} />
}
