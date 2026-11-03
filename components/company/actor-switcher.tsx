"use client"

import Link from "next/link"
import { BuildingsIcon as Building2, CaretDownIcon as ChevronDown, PlusIcon as Plus, UserIcon as User } from "@phosphor-icons/react/dist/ssr"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import type { ActorType } from "@/types"

type ActorSwitcherProps = {
  actorType: ActorType
  basePath: string
}

const trustLabel = (level: string) => {
  if (level === "verified") return "Верифицирован"
  if (level === "standard") return "Компания"
  return "Личный"
}

export const ActorSwitcher = ({ actorType, basePath }: ActorSwitcherProps) => {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const switchActor = useAuthStore((s) => s.switchActor)

  if (!hydrated || !user) return null

  const myActors = user.actors.filter((a) => a.side === actorType)

  const activeActor =
    myActors.find((a) => a.id === user.activeActorId) ?? myActors[0]

  if (myActors.length === 0) {
    return (
      <Link
        href={`${basePath}/new`}
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-dashed border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition-colors"
      >
        <Plus size={14} />
        Создать компанию
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-input bg-background hover:bg-secondary transition-colors max-w-[220px]"
          aria-label="Выбрать профиль"
        >
          {activeActor?.kind === "individual" ? (
            <User size={14} className="text-primary shrink-0" />
          ) : (
            <Building2 size={14} className="text-primary shrink-0" />
          )}
          <span className="text-xs font-semibold truncate">
            {activeActor?.display_name ?? "Профиль"}
          </span>
          <ChevronDown size={12} className="text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Активный профиль</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {myActors.map((actor) => (
          <DropdownMenuItem
            key={actor.id}
            onClick={() => switchActor(actor.id)}
            className="cursor-pointer"
          >
            {actor.kind === "individual" ? (
              <User size={14} />
            ) : (
              <Building2 size={14} />
            )}
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm">{actor.display_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {actor.kind === "individual" ? "Личный профиль" : "Компания"} ·{" "}
                {trustLabel(actor.trust_level)}
              </span>
            </div>
            {actor.id === user.activeActorId && (
              <span className="ml-auto text-[10px] text-primary font-bold">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={basePath} className="cursor-pointer">
            Все компании
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${basePath}/new`} className="cursor-pointer">
            <Plus size={14} />
            Создать компанию
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const CompanySwitcher = ActorSwitcher
