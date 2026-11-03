"use client"

import { TRUST_LEVELS, type ReputationTier, type TrustLevelMeta } from "@/lib/trust-levels"
import { TrustLevelCard } from "@/components/bm/trust-level-card"
import { cn } from "@/lib/utils"

type TrustLevelsGridProps = {
  currentTier?: ReputationTier | null
  className?: string
  onSelect?: (id: TrustLevelMeta["id"]) => void
}

export function TrustLevelsGrid({
  currentTier = null,
  className,
  onSelect,
}: TrustLevelsGridProps) {
  const currentIndex = TRUST_LEVELS.findIndex((l) => l.id === currentTier)
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 md:grid-cols-3",
        className,
      )}
      role="list"
      aria-label="Уровни знака надёжности"
    >
      {TRUST_LEVELS.map((level, index) => (
        <div key={level.id} role="listitem">
          <TrustLevelCard
            level={level}
            current={currentTier === level.id}
            reached={currentIndex > index}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  )
}
