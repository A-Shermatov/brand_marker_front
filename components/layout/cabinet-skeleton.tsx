import { cn } from "@/lib/utils"

const Bar = ({ className, width }: { className?: string; width?: string }) => (
  <span className={cn("block rounded-md bm-shimmer", className)} style={width ? { width } : undefined} />
)

/**
 * The outline of a cabinet while the session is being checked: the menu on
 * the left, the page on the right. The person sees where things will be, and
 * the real screen replaces it without a jump.
 */
export function CabinetSkeleton({ label = "Открываем кабинет" }: { label?: string }) {
  return (
    <div className="min-h-dvh bg-canvas lg:flex" role="status" aria-label={label}>
      <aside className="hidden h-screen w-[256px] shrink-0 border-r border-line bg-card p-3 lg:block">
        <Bar className="mx-1 mt-2 h-8 w-36" />
        <Bar className="mt-5 h-14 rounded-xl" />
        <Bar className="mt-3 h-10 rounded-lg" />
        <div className="mt-5 grid gap-2.5 px-1">
          {[74, 58, 88, 66, 70, 82].map((width, i) => (
            <span key={i} className="flex h-8 items-center gap-3">
              <Bar className="size-5 shrink-0" />
              <Bar className="h-3.5" width={`${width}%`} />
            </span>
          ))}
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[60px] items-center gap-3 border-b border-line bg-card px-4 lg:px-8">
          <Bar className="h-9 w-full max-w-[360px] rounded-lg" />
          <span className="flex-1" />
          <Bar className="size-9 rounded-full" />
          <Bar className="size-9 rounded-full" />
        </div>
        <div className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-5 lg:px-8 lg:py-7">
          <Bar className="h-4 w-40" />
          <Bar className="mt-2 h-8 w-72 max-w-full" />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Bar key={i} className="h-[112px] rounded-2xl" />
            ))}
          </div>
          <Bar className="mt-5 h-[260px] rounded-2xl" />
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
