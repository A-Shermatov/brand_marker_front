import { cn } from "@/lib/utils"

const Bar = ({ className }: { className?: string }) => (
  <span className={cn("block rounded-md bm-shimmer", className)} />
)

/**
 * A list on its way: cards of the same shape as the real ones, so the page
 * does not jump when the data arrives. `label` is read out by screen readers.
 */
export function ListSkeleton({
  rows = 3,
  label = "Загружаем список",
  className,
}: {
  rows?: number
  label?: string
  className?: string
}) {
  return (
    <ul role="status" aria-label={label} className={cn("grid gap-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <li
          key={i}
          className="grid gap-4 rounded-2xl border border-line bg-card p-4 pl-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8"
          aria-hidden
        >
          <div className="grid gap-2.5">
            <Bar className="h-3.5 w-40" />
            <Bar className={cn("h-5", i % 2 ? "w-[52%]" : "w-[68%]")} />
            <Bar className="h-3.5 w-56 max-w-full" />
          </div>
          <div className="flex items-center gap-6">
            <Bar className="h-9 w-28" />
            <Bar className="hidden h-9 w-24 md:block" />
            <Bar className="h-8 w-28 rounded-full" />
          </div>
        </li>
      ))}
      <li className="sr-only">{label}</li>
    </ul>
  )
}
