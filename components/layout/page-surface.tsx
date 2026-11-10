import { cn } from "@/lib/utils"

type PageSurfaceProps = React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode
  className?: string
}

export const PageSurface = ({ children, className, ...props }: PageSurfaceProps) => {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

type PageEmptyStateProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  /** Next step for the user, e.g. a button or link. */
  action?: React.ReactNode
  /** `card` renders a standalone dashed card; `plain` is meant for use inside `PageSurface`. */
  variant?: "plain" | "card"
  /** What the state means: nothing here yet (the default), it worked, it failed, wait. */
  tone?: "brand" | "success" | "danger" | "wait"
  className?: string
}

const TONE_TILE = {
  brand: "bg-brand-50 text-brand-600",
  success: "bg-safe-50 text-safe-700",
  danger: "bg-red-50 text-red-700",
  wait: "bg-amber-50 text-amber-700",
}

const TONE_OUTLINE = {
  brand: "border-brand-200",
  success: "border-safe-100",
  danger: "border-red-200",
  wait: "border-amber-200",
}

export const PageEmptyState = ({
  title,
  description,
  icon,
  action,
  variant = "plain",
  tone = "brand",
  className,
}: PageEmptyStateProps) => {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-2 px-6 py-14 text-center bm-rise",
        variant === "card" && "rounded-2xl border border-dashed border-line-strong bg-card py-12",
        className,
      )}
    >
      {icon ? (
        // The picture of the empty list: the section's own icon on a blue
        // tile, inside a dashed outline — "a place kept for what will come".
        <div className="relative mb-3 grid size-[72px] place-items-center" aria-hidden="true">
          <span className={cn("absolute inset-0 rounded-[22px] border border-dashed", TONE_OUTLINE[tone])} />
          <span className={cn("grid size-14 place-items-center rounded-2xl [&_svg]:size-7", TONE_TILE[tone])}>
            {icon}
          </span>
        </div>
      ) : null}
      <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="max-w-md text-[14.5px] leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  )
}
