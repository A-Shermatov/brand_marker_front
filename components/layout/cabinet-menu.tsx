"use client"

import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { HouseIcon } from "@phosphor-icons/react/dist/ssr"
import { CabinetNavLink } from "@/components/layout/cabinet-nav-link"
import { groupHubs, type CabinetNavHub } from "@/lib/cabinet-nav"

type CabinetMenuProps = {
  hubs: CabinetNavHub[]
  activeId?: string
  icons: Record<string, PhosphorIcon>
  badgeFor: (keys?: string[]) => number
  /** Red for what waits for a decision (the admin's queues); blue for news. */
  badgeTone?: "brand" | "danger"
  onNavigate?: () => void
}

/**
 * The cabinet menu: every page in one list, in groups with a short heading —
 * what you buy or sell, the deals, the account. Nothing is tucked behind a
 * second level, so the page a person needs is always in sight.
 */
export function CabinetMenu({ hubs, activeId, icons, badgeFor, badgeTone, onNavigate }: CabinetMenuProps) {
  return (
    <div className="grid gap-0.5">
      {groupHubs(hubs).map((group) => (
        <div key={group.label ?? "top"} role="group" aria-label={group.label ?? undefined} className="grid gap-0.5">
          {group.label ? (
            <p className="px-3 pb-1 pt-4 text-[12px] font-medium text-faint" aria-hidden>
              {group.label}
            </p>
          ) : null}
          {group.hubs.map((hub) => (
            <CabinetNavLink
              key={hub.id}
              href={hub.href}
              label={hub.label}
              icon={icons[hub.id] ?? HouseIcon}
              active={activeId === hub.id}
              badge={badgeFor(hub.badgeKeys)}
              badgeTone={badgeTone}
              onClick={onNavigate}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
