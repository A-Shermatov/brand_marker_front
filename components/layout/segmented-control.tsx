import { cn } from "@/lib/utils"

type SegmentedOption<T extends string> = {
  value: T
  label: string
  count?: number
}

type SegmentedControlProps<T extends string> = {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
}

export const SegmentedControl = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) => {
  const handleSelect = (nextValue: T) => {
    onChange(nextValue)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    nextValue: T,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onChange(nextValue)
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-muted p-1 no-scrollbar",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            className={cn(
              "h-8 shrink-0 whitespace-nowrap rounded-md px-3.5 text-[13.5px] font-medium transition-colors",
              isActive
                ? "bg-card text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                : "text-mute hover:text-ink",
            )}
            onClick={() => handleSelect(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "ml-1.5 text-[12px] tnum",
                  isActive ? "text-brand-700" : "text-faint",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
