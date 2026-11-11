"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  MapPinIcon,
  PhoneIcon,
} from "@phosphor-icons/react/dist/ssr"
import { CompanyName } from "@/components/bm"
import { UserAvatar } from "@/components/bm/user-avatar"
import { Button } from "@/components/ui/button"
import { profileProgress, type ProfileStep, type ProfileTab } from "@/lib/profile-completeness"
import { cn } from "@/lib/utils"

type ProfileHeroProps = {
  name: string
  avatar?: string | null
  /** One line under the name: what the person does, or who they work as. */
  subtitle: string
  email: string
  phone?: string
  city?: string
  verified: boolean
  tier?: string | null
  /** The public page, when the person has one. */
  publicHref?: string | null
  steps: ProfileStep[]
  onOpenTab: (tab: ProfileTab) => void
}

function Chip({ icon: Icon, children, muted = false }: { icon: typeof PhoneIcon; children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-line bg-canvas px-3 text-[13.5px]",
        muted ? "text-mute" : "text-ink-soft",
      )}
    >
      <Icon className="size-4 shrink-0 text-mute" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  )
}

/**
 * The top of "Мой профиль": the person as others see them — photo, name with
 * its marks, what they do — and how complete the profile is, with the next
 * one or two things worth doing. The page under it is where they are done.
 */
export function ProfileHero({
  name,
  avatar,
  subtitle,
  email,
  phone,
  city,
  verified,
  tier,
  publicHref,
  steps,
  onOpenTab,
}: ProfileHeroProps) {
  const progress = profileProgress(steps)
  const complete = progress.done === progress.total

  return (
    <section
      aria-label="Ваш профиль"
      className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(14_22_48/0.04)]"
    >
      <div
        className="relative h-24 bg-[linear-gradient(110deg,#0041A3_0%,#1F6BEB_55%,#5B9BFF_100%)] sm:h-28"
        aria-hidden
      >
        {/* The logo's two tiles, faint: the cover is the platform's, the photo is the person's. */}
        <svg viewBox="0 0 200 100" className="absolute right-6 top-1/2 h-[130%] -translate-y-1/2 opacity-[0.16]" fill="#fff">
          <rect x="-34" y="-34" width="68" height="68" rx="15" transform="translate(70 50) rotate(45)" />
          <rect x="-34" y="-34" width="68" height="68" rx="15" transform="translate(130 50) rotate(45)" opacity="0.6" />
        </svg>
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {/* Only the photo climbs onto the cover; the name stays on the card, where it reads. */}
          <div className="relative z-10 -mt-12 rounded-full bg-card p-1">
            <UserAvatar src={avatar} name={name || "?"} size={92} className="text-[32px]" />
          </div>
          <div className="min-w-0 flex-1 pb-1 pt-3">
            <CompanyName as="h2" name={name} verified={verified} tier={tier} size="xl" />
            <p className="mt-0.5 truncate text-[14.5px] text-mute">{subtitle}</p>
          </div>
          {publicHref ? (
            <Button asChild variant="outline" size="sm" className="mb-1 shrink-0">
              <Link href={publicHref} target="_blank">
                <EyeIcon className="size-4" aria-hidden />
                Как видят меня другие
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon={EnvelopeSimpleIcon}>{email}</Chip>
          <Chip icon={PhoneIcon} muted={!phone}>
            {phone || "Телефон не указан"}
          </Chip>
          {city ? <Chip icon={MapPinIcon}>{city}</Chip> : null}
        </div>

        <div className="mt-5 rounded-xl border border-line bg-canvas/70 p-4" data-testid="profile-progress">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
              {complete ? <CheckCircleIcon weight="fill" className="size-5 text-safe-500" aria-hidden /> : null}
              {complete ? "Профиль заполнен полностью" : `Профиль заполнен на ${progress.percent}%`}
            </p>
            <p className="text-[13px] text-mute tnum">
              {progress.done} из {progress.total}
            </p>
          </div>
          <div
            className="mt-2.5 h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            aria-label="Заполненность профиля"
          >
            <div
              className={cn("h-full rounded-full bm-grow-x", complete ? "bg-safe-500" : "bg-brand-600")}
              style={{ width: `${Math.max(progress.percent, 4)}%` }}
            />
          </div>
          {progress.next.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {progress.next.map((step) => (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTab(step.tab)}
                    className="group flex w-full items-center gap-3 rounded-lg border border-line bg-card px-3 py-2.5 text-left transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-ink group-hover:text-brand-700">
                        {step.label}
                      </span>
                      <span className="block text-[12.5px] leading-snug text-mute">{step.hint}</span>
                    </span>
                    <ArrowRightIcon
                      weight="bold"
                      className="size-4 shrink-0 text-mute transition-transform group-hover:translate-x-0.5 group-hover:text-brand-700"
                      aria-hidden
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
