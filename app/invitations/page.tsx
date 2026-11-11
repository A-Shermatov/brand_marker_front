"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageShell } from "@/components/marketplace/page-shell"
import { PendingInvitations } from "@/components/company/pending-invitations"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { useAuthStore } from "@/lib/store/auth-store"

/** Invitations to company teams that wait for the signed-in person's answer. */
export default function InvitationsPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const isReady = useAuthStore((s) => s.isReady)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const role = useAuthStore((s) => s.user?.role)
  const ready = hydrated && isReady

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace("/login?next=/invitations")
  }, [ready, isAuthenticated, router])

  const home = role === "supplier" ? "/supplier" : role === "admin" ? "/admin" : "/customer"

  return (
    <PageShell>
      <div className="mx-auto min-h-[50vh] max-w-[760px] px-4 py-10 lg:px-8">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-ink">Приглашения в компании</h1>
        <p className="mt-1 text-[15px] text-mute">
          Примите приглашение, чтобы работать в кабинете компании, или откажитесь от него.
        </p>
        {ready && isAuthenticated ? (
          <>
            <PendingInvitations
              className="mt-6"
              emptyText="Сейчас нет приглашений, которые ждут вашего ответа."
            />
            <Button asChild variant="outline" className="mt-6">
              <Link href={home}>Вернуться в кабинет</Link>
            </Button>
          </>
        ) : (
          <div className="mt-6 h-24 animate-pulse rounded-2xl bg-surface-muted" />
        )}
      </div>
    </PageShell>
  )
}
