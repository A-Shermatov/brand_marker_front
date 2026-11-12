"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminDisputesContent } from "@/components/admin/disputes/disputes-list-panel"
import { PageFrame } from "@/components/layout"

const PageSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const Disputes = () => {
  const router = useRouter()
  // Deals used to be a tab here; they have a page of their own now.
  const moved = useSearchParams().get("tab") === "contracts"

  useEffect(() => {
    if (moved) router.replace("/admin/contracts")
  }, [moved, router])

  if (moved) return <PageSkeleton />
  return <AdminDisputesContent embedded={false} />
}

export default function AdminDisputesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Disputes />
    </Suspense>
  )
}
