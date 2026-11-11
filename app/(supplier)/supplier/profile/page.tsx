"use client"

import { Suspense } from "react"
import { ProfilePage } from "@/components/profile/profile-page"

export default function SupplierProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePage side="supplier" />
    </Suspense>
  )
}
