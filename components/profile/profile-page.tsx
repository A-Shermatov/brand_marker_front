"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { BuildingsIcon, SignOutIcon } from "@phosphor-icons/react/dist/ssr"
import { ChangePasswordCard } from "@/components/auth/change-password-card"
import { TwoFactorSettings } from "@/components/auth/two-factor-settings"
import { CreateCompanyCard } from "@/components/company/create-company-card"
import { PageFrame, SegmentedControl } from "@/components/layout"
import { AvatarUploader } from "@/components/profile/avatar-uploader"
import { IndividualPageCard } from "@/components/profile/individual-page-card"
import { PendingReviewNotice, useMyPendingChanges } from "@/components/profile/pending-review-notice"
import { ProfileContactForm } from "@/components/profile/profile-contact-form"
import { ProfileHero } from "@/components/profile/profile-hero"
import { TelegramCard, useTelegramAccount } from "@/components/profile/telegram-card"
import { Button } from "@/components/ui/button"
import { IdentityVerificationCard } from "@/components/verification/identity-verification-card"
import { useBuyerMarks } from "@/hooks/use-buyer-marks"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"
import { useUrlTab } from "@/hooks/use-url-tab"
import { authApi } from "@/lib/api/auth"
import { isApiEnabled } from "@/lib/api/config"
import { PROFILE_TABS, profileSteps, type ProfileTab } from "@/lib/profile-completeness"
import { useAuthStore } from "@/lib/store/auth-store"

type Side = "buyer" | "supplier"

/** The marks of the cabinet the page is opened in; each hook reads its own side only. */
function useBuyerSide() {
  const marks = useBuyerMarks()
  return { verified: marks.verified, tier: marks.tier }
}
function useSupplierSide() {
  const marks = useSupplierMarks()
  return { verified: marks.verified, tier: marks.tier }
}

/**
 * "Мой профиль" of either cabinet. On top, the person as others see them and
 * what is left to fill in; under it, one thing per tab instead of one long
 * page: contacts and photo, the public page of a private seller, document
 * check, sign-in safety, Telegram. The tab is kept in the address, so a link
 * can open the right one.
 */
export function ProfilePage({ side }: { side: Side }) {
  return side === "supplier" ? <SupplierProfile /> : <BuyerProfile />
}

function BuyerProfile() {
  return <ProfileBody side="buyer" marks={useBuyerSide()} />
}

function SupplierProfile() {
  return <ProfileBody side="supplier" marks={useSupplierSide()} />
}

function ProfileBody({ side, marks }: { side: Side; marks: { verified: boolean; tier: string } }) {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const welcome = useSearchParams().get("welcome") === "1"

  const activeActor = user?.actors?.find((actor) => actor.id === user.activeActorId)
  const actsAsIndividual = activeActor?.kind === "individual"
  // A private seller's public page; a buyer has none.
  const hasPage = side === "supplier"

  const tabs = PROFILE_TABS.filter((tab) => tab.value !== "page" || hasPage)
  const [tab, setTab] = useUrlTab<ProfileTab>(
    "tab",
    tabs.map((item) => item.value),
    // Straight after registering as a private seller the page to fill in is the point.
    hasPage && welcome ? "page" : "main",
  )

  const pendingChanges = useMyPendingChanges().data
  const telegram = useTelegramAccount().data
  const { data: me } = useQuery({
    queryKey: ["auth", "me", "profile"],
    queryFn: () => authApi.me(),
    enabled: hydrated && useApi,
  })
  const { data: page } = useQuery({
    queryKey: ["my-page"],
    queryFn: () => authApi.getPage(),
    enabled: hydrated && useApi && hasPage,
  })

  if (!hydrated || !user) return null

  const steps = profileSteps({
    hasPhoto: Boolean(user.avatarUrl),
    hasPhone: Boolean(user.phone),
    verified: marks.verified,
    twoFactor: me ? Boolean(me.user.totp_enabled) : undefined,
    pageFilled: hasPage && page ? Boolean(page.headline?.trim() && page.about?.trim()) : undefined,
    telegramLinked: telegram?.available ? telegram.linked : undefined,
  })

  const subtitle =
    (hasPage && page?.headline?.trim()) ||
    (actsAsIndividual
      ? side === "supplier"
        ? "Частное лицо · поставщик"
        : "Частное лицо · покупатель"
      : activeActor?.display_name
        ? `${activeActor.display_name} · ${side === "supplier" ? "поставщик" : "покупатель"}`
        : side === "supplier"
          ? "Поставщик"
          : "Покупатель")
  const publicHref =
    hasPage && page?.supplier_actor_id && page.accepts_orders ? `/performers/${page.supplier_actor_id}` : null
  const companyHref = side === "supplier" ? "/supplier/company" : "/customer/company"

  return (
    <PageFrame>
      <div className="grid gap-5">
        <ProfileHero
          name={user.name || user.email}
          avatar={user.avatarUrl}
          subtitle={subtitle}
          email={user.email}
          phone={user.phone}
          city={(hasPage && page?.city) || user.city}
          verified={marks.verified}
          tier={marks.tier}
          publicHref={publicHref}
          steps={steps}
          onOpenTab={setTab}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl value={tab} options={tabs} onChange={setTab} ariaLabel="Разделы профиля" />
          <Button type="button" variant="ghost" size="sm" className="text-mute" onClick={() => void logout("/login")}>
            <SignOutIcon className="size-4" aria-hidden /> Выйти
          </Button>
        </div>

        <div className="grid gap-5 bm-rise" key={tab}>
          {tab === "main" ? (
            <>
              <PendingReviewNotice fields={pendingChanges ? Object.keys(pendingChanges.proposed) : null} />
              <AvatarUploader />
              <ProfileContactForm side={side} />
            </>
          ) : null}

          {tab === "page" && hasPage ? <IndividualPageCard welcome={welcome} /> : null}

          {tab === "verify" ? (
            <>
              {actsAsIndividual ? (
                <IdentityVerificationCard enabled={useApi} />
              ) : (
                <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:p-6">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden>
                    <BuildingsIcon weight="duotone" className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[15.5px] font-semibold text-ink">
                      Вы работаете от компании{activeActor?.display_name ? ` «${activeActor.display_name}»` : ""}
                    </h2>
                    <p className="mt-1 text-[14px] leading-relaxed text-mute">
                      Проверяются документы компании, а не ваши личные: регистрация и реквизиты. Их загружают на
                      странице компании.
                    </p>
                  </div>
                  <Button asChild variant="outline" className="shrink-0">
                    <Link href={companyHref}>Страница компании</Link>
                  </Button>
                </section>
              )}
              <CreateCompanyCard side={side} />
            </>
          ) : null}

          {tab === "security" ? (
            <>
              <ChangePasswordCard />
              <TwoFactorSettings />
            </>
          ) : null}

          {tab === "telegram" ? <TelegramCard /> : null}
        </div>
      </div>
    </PageFrame>
  )
}
