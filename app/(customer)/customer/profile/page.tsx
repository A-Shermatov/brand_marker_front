"use client"

import { Suspense } from "react"
import { ProfilePage } from "@/components/profile/profile-page"

export default function CustomerProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePage side="buyer" />
    </Suspense>
  )
}
