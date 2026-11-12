"use client"

import { Suspense } from "react"
import { AdminRfqsContent } from "@/components/admin/rfqs/rfqs-list-panel"
import { PageFrame } from "@/components/layout"

const PageSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AdminRfqsContent embedded={false} />
    </Suspense>
  )
}
