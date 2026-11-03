"use client"

import { InfoIcon as Info } from "@phosphor-icons/react/dist/ssr"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"
import { glossary, type GlossaryKey } from "@/lib/glossary"

interface TermHintProps {
  term: GlossaryKey
  children?: React.ReactNode
  className?: string
  iconOnly?: boolean
}

/**
 * Показывает термин с поясняющей подсказкой при наведении или фокусе.
 * Текст пояснения берётся из единого словаря lib/glossary.ts.
 */
export function TermHint({ term, children, className, iconOnly = false }: TermHintProps) {
  const entry = glossary[term]
  const label = children ?? entry.label

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          tabIndex={0}
          role="note"
          aria-label={`${entry.label}: ${entry.hint}`}
          className={cn(
            "inline-flex items-center gap-1 outline-none",
            !iconOnly && "underline decoration-dotted decoration-muted-foreground/50 underline-offset-4 cursor-help",
            "focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
            className,
          )}
        >
          {!iconOnly && label}
          <Info size={13} className="text-muted-foreground shrink-0" aria-hidden="true" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 text-sm">
        <p className="font-semibold text-foreground mb-1">{entry.label}</p>
        <p className="text-muted-foreground leading-snug">{entry.hint}</p>
      </HoverCardContent>
    </HoverCard>
  )
}
