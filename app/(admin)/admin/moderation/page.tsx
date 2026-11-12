"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminReportsContent } from "@/components/admin/moderation/reports-list-panel"
import { PageFrame } from "@/components/layout"

/** Where the tabs this page used to keep have moved. */
const MOVED: Record<string, string> = {
  catalog: "/admin/catalog?status=pending_review",
  rfqs: "/admin/rfqs",
  proposals: "/admin/proposals",
}

const PageSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const Reports = () => {
  const router = useRouter()
  const moved = MOVED[useSearchParams().get("tab") ?? ""]

  useEffect(() => {
    if (moved) router.replace(moved)
  }, [moved, router])

  if (moved) return <PageSkeleton />
  return <AdminReportsContent embedded={false} />
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Reports />
    </Suspense>
  )
}
