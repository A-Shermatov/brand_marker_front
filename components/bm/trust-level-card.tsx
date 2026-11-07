"use client"

import { cn } from "@/lib/utils"
import { type TrustLevelMeta } from "@/lib/trust-levels"
import { TrustMark } from "@/components/bm/trust-mark"

type TrustLevelCardProps = {
  level: TrustLevelMeta
  /** Highlight as the actor's current tier */
  current?: boolean
  /** Already passed on the way to a higher tier */
  reached?: boolean
  className?: string
  onSelect?: (id: TrustLevelMeta["id"]) => void
}

export function TrustLevelCard({
  level,
  current = false,
  reached = false,
  className,
  onSelect,
}: TrustLevelCardProps) {
  const interactive = Boolean(onSelect)
  const Comp = interactive ? "button" : "div"
  const premium = level.id === "diamond"

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={interactive ? () => onSelect?.(level.id) : undefined}
      aria-pressed={interactive ? current : undefined}
      className={cn(
        "relative flex h-full w-full flex-col items-start gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-colors",
        premium
          ? "border-[#5A1890] bg-[radial-gradient(120%_90%_at_85%_0%,#B0309F_0%,#5B1AAE_45%,#250A52_100%)] text-white"
          : "border-line bg-card",
        current && !premium && "ring-2 ring-inset",
        interactive && "cursor-pointer",
        className,
      )}
      style={current && !premium ? { ["--tw-ring-color" as string]: level.accent } : undefined}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <TrustMark tier={level.id} size={premium ? 64 : 52} still={!premium} />
        {current ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
              premium ? "bg-card text-[#5B1AAE] dark:text-[#C9A7FF]" : "bg-surface-muted text-ink",
            )}
          >
            Ваш уровень
          </span>
        ) : reached ? (
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11.5px] font-medium text-mute">
            Пройден
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-[17px] font-semibold leading-tight",
            premium ? "text-white" : "text-ink",
          )}
        >
          {level.name}
        </p>
        <p className={cn("mt-1 text-[13.5px]", premium ? "text-white/75" : "text-mute")}>
          {level.description}
        </p>
      </div>
      <p
        className={cn(
          "mt-auto w-full border-t pt-3 text-[12.5px] tnum",
          premium ? "border-white/15 text-white/80" : "border-line text-ink-soft",
        )}
      >
        {level.condition}
      </p>
    </Comp>
  )
}
