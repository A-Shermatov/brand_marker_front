"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { AdminRolesPanel } from "@/components/admin/roles/roles-panel"
import { AdminStaffPanel } from "@/components/admin/staff/staff-panel"
import { PageFrame } from "@/components/layout"
import { allowedAdminTabs } from "@/lib/admin-permissions"
import { useAuthStore } from "@/lib/store/auth-store"

const PageSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка">
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

/** Who works in the panel, and what each role may do. */
const Access = () => {
  const user = useAuthStore((state) => state.user)
  const wanted = useSearchParams().get("tab") === "roles" ? "roles" : "staff"
  // Somebody who may see only one of the two gets that one, whatever the address says.
  const allowed = allowedAdminTabs(user, "staff").map((tab) => tab.id)
  const tab = allowed.includes(wanted) ? wanted : (allowed[0] ?? wanted)
  return tab === "roles" ? <AdminRolesPanel embedded={false} /> : <AdminStaffPanel embedded={false} />
}

export default function AdminStaffPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Access />
    </Suspense>
  )
}
