"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store/auth-store"
import { isApiEnabled } from "@/lib/api/config"

type ActivateRoleBannerProps = {
  targetSide: "buyer" | "supplier"
  redirectTo: string
  label: string
}

export const ActivateRoleBanner = ({
  targetSide,
  redirectTo,
  label,
}: ActivateRoleBannerProps) => {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const activateRole = useAuthStore((s) => s.activateRole)
  const [busy, setBusy] = useState(false)

  if (!user || !isApiEnabled()) return null

  const hasCapability =
    targetSide === "buyer" ? user.capabilities.buyer : user.capabilities.supplier

  if (hasCapability) return null

  const handleActivate = async () => {
    if (busy) return
    setBusy(true)
    try {
      await activateRole(targetSide)
      router.push(redirectTo)
    } finally {
      setBusy(false)
    }
  }

  // An offer, not a task: it sits quietly below the person's own work.
  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-line bg-card p-4 sm:flex-row sm:items-center md:px-5">
      <p className="text-[14px] text-ink-soft">{label}</p>
      <Button type="button" variant="outline" onClick={handleActivate} disabled={busy} className="shrink-0">
        {busy ? "Активируем…" : "Активировать"}
      </Button>
    </div>
  )
}
