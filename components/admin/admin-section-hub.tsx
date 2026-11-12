"use client"

import { usePathname } from "next/navigation"
import { SectionHub } from "@/components/layout/section-hub"
import { useAdminVerificationCountsQuery } from "@/hooks/api/use-client-verification-query"
import { hasAnyPermission } from "@/lib/admin-permissions"
import { useAuthStore } from "@/lib/store/auth-store"

/**
 * The header of an admin section: its name, one line on what it is for, and
 * its tabs. A member of staff sees only the tabs their role opens; in the
 * verification section each tab says how many are waiting.
 */
export function AdminSectionHub() {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const inVerification = pathname === "/admin/verification"
  const counts = useAdminVerificationCountsQuery(inVerification).data

  return (
    <SectionHub
      role="admin"
      allow={(tab) => !tab.permissions?.length || hasAnyPermission(user, tab.permissions)}
      badges={
        inVerification && counts
          ? {
              suppliers: counts.supplier_companies,
              buyers: counts.buyer_companies,
              individuals: counts.individuals,
              changes: counts.changes,
            }
          : undefined
      }
    />
  )
}
