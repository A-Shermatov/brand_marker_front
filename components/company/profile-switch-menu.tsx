"use client"

import { BuildingsIcon as Buildings, CheckIcon as Check, UserIcon as User } from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { companyRoleLabel } from "@/lib/company-team"
import { useAuthStore } from "@/lib/store/auth-store"
import type { ActorSummary } from "@/lib/api/auth"

type Side = "buyer" | "supplier"

/** "Личный профиль" or "Компания · менеджер": what a profile is, in two words. */
export const profileKindLabel = (actor: Pick<ActorSummary, "kind" | "company_role">): string => {
  if (actor.kind === "individual") return "Личный профиль"
  return actor.company_role
    ? `Компания · ${companyRoleLabel(actor.company_role).toLowerCase()}`
    : "Компания"
}

/** The profiles a person can work from on one side of the cabinet, the active one included. */
export const useSideProfiles = (side: Side) => {
  const user = useAuthStore((s) => s.user)
  const profiles = (user?.actors ?? []).filter((actor) => actor.side === side)
  const active = profiles.find((actor) => actor.id === user?.activeActorId) ?? null
  return { profiles, active }
}

/**
 * "On whose behalf I work" inside the account menu: the personal profile and
 * every company the person belongs to. Choosing another one reloads the
 * cabinet, so every list is read for that profile. Shown only when there is a
 * choice.
 */
export const ProfileSwitchMenu = ({ side }: { side: Side }) => {
  const switchActor = useAuthStore((s) => s.switchActor)
  const { profiles, active } = useSideProfiles(side)

  if (profiles.length < 2) return null
  const home = side === "supplier" ? "/supplier" : "/customer"

  return (
    <>
      <DropdownMenuLabel className="text-[12px] font-medium text-mute">
        От чьего имени работаю
      </DropdownMenuLabel>
      {profiles.map((profile) => {
        const Icon = profile.kind === "individual" ? User : Buildings
        const current = profile.id === active?.id
        return (
          <DropdownMenuItem
            key={profile.id}
            className="cursor-pointer"
            aria-current={current ? "true" : undefined}
            onClick={() => {
              if (current) return
              void switchActor(profile.id).then(() => window.location.assign(home))
            }}
          >
            <Icon size={15} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[14px]">{profile.display_name}</span>
              <span className="text-[11.5px] text-mute">{profileKindLabel(profile)}</span>
            </span>
            {current ? <Check size={14} className="ml-auto text-brand-700" aria-label="Выбрано" /> : null}
          </DropdownMenuItem>
        )
      })}
      <DropdownMenuSeparator />
    </>
  )
}

/** Second line under the name in the top bar: where the person is working now. */
export const ActiveProfileLine = ({ side }: { side: Side }) => {
  const { active } = useSideProfiles(side)
  if (!active) return null
  return (
    <span className="block max-w-[180px] truncate text-[11.5px] font-normal leading-tight text-mute" data-testid="active-profile">
      {active.kind === "individual" ? "Личный профиль" : active.display_name}
    </span>
  )
}
