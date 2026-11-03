import { cn } from "@/lib/utils"

type SurfaceCardProps = React.ComponentProps<"div"> & {
  padded?: boolean
}

export function SurfaceCard({
  className,
  padded = true,
  children,
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(28,28,26,.04)]",
        padded && "p-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
