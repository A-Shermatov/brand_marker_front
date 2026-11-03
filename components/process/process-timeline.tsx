import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { ProcessStep } from "@/lib/process/rfq-timeline"

type ProcessTimelineProps = {
  steps: ProcessStep[]
  label?: string
  className?: string
}

export const ProcessTimeline = ({ steps, label = "Как идёт процесс", className }: ProcessTimelineProps) => (
  <ol className={cn("grid", className)} aria-label={label}>
    {steps.map((step, index) => {
      const isLast = index === steps.length - 1
      return (
        <li
          key={step.title}
          className={cn("relative grid grid-cols-[28px_1fr] gap-3", !isLast && "pb-5")}
          aria-current={step.state === "now" ? "step" : undefined}
        >
          {!isLast ? (
            <span
              className={cn(
                "absolute left-3.25 top-7 bottom-0 w-0.5",
                step.state === "done" ? "bg-primary" : "bg-border",
              )}
              aria-hidden="true"
            />
          ) : null}
          <span
            className={cn(
              "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold",
              step.state === "done" && "bg-primary text-primary-foreground",
              step.state === "now" && "border-2 border-primary bg-card text-brand-700 ring-4 ring-brand-50",
              step.state === "todo" && "border-2 border-border bg-card text-muted-foreground",
            )}
            aria-hidden="true"
          >
            {step.state === "done" ? <Check size={16} /> : index + 1}
          </span>
          <div>
            <p className={cn("font-bold", step.state === "todo" && "text-muted-foreground")}>
              {step.title}
              <span className="sr-only">
                {step.state === "done" ? " — выполнено" : step.state === "now" ? " — текущий шаг" : ""}
              </span>
            </p>
            {step.description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
            ) : null}
          </div>
        </li>
      )
    })}
  </ol>
)
