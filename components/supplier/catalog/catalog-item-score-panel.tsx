"use client"

import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { CatalogFormScore } from "@/components/supplier/catalog/catalog-item-score"

type CatalogItemScorePanelProps = {
  score: CatalogFormScore
  onJump: (sectionId: string) => void
  className?: string
}

export const CatalogItemScorePanel = ({
  score,
  onJump,
  className,
}: CatalogItemScorePanelProps) => {
  return (
    <div className={cn("rounded-2xl border border-line bg-card p-5", className)}>
      <div className="flex items-end justify-between gap-3">
        <span className="text-[14px] font-semibold text-ink">Качество карточки</span>
        <b className={cn("text-[28px] font-bold leading-none tabular-nums", score.levelClass)}>
          {score.total}
          <span className="text-[15px] font-semibold text-mute">/100</span>
        </b>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn("h-full rounded-full transition-all", score.barClass)}
          style={{ width: `${score.total}%` }}
        />
      </div>
      <p className={cn("mt-2 text-[13.5px] font-semibold", score.levelClass)}>{score.level}</p>
      <ul className="mt-3 grid gap-0.5">
        {score.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onJump(item.sectionId)}
              className="-mx-1 flex w-full items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-[13.5px] hover:bg-canvas"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full",
                  item.ok ? "bg-brand-600 text-white" : "border-2 border-line",
                )}
              >
                {item.ok ? <Check className="size-3" aria-hidden /> : null}
              </span>
              <span
                className={cn(
                  "flex-1",
                  item.ok && "text-mute line-through decoration-line",
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  "text-[12px] font-semibold",
                  item.ok ? "text-brand-700" : "text-mute",
                )}
              >
                +{item.points}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-mute">
        Чем выше оценка, тем чаще карточку показывают в каталоге.
      </p>
    </div>
  )
}
