import { cn } from "@/lib/utils"

type PageFrameProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
}

export const PageFrame = ({ children, className, ...props }: PageFrameProps) => {
  return (
    <div
      // The cabinet column already limits the width; centring again here
      // shifted page content away from the section header above it.
      className={cn("w-full space-y-6", className)}
      {...props}
    >
      {children}
    </div>
  )
}
