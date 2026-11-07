import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { ContractWithRelations } from "@/types"
import { getDealPhase, getDealStepIndex, getDealSteps } from "@/lib/process/deal-stages"

type DealContract = Pick<ContractWithRelations, "status" | "payment_type" | "payment_plan" | "dispute">

export const DealStepper = ({ contract, className }: { contract: DealContract; className?: string }) => {
  const steps = getDealSteps(contract)
  const current = getDealStepIndex(contract)
  const phase = getDealPhase(contract)
  const finished = phase === "done"
  const currentLabel = current >= 0 ? steps[current]?.label : "Отменена"

  return (
    <ol
      className={cn("grid grid-cols-5 gap-2", className)}
      aria-label={`Этапы сделки. Сейчас: ${currentLabel}`}
    >
      {steps.map((step, index) => {
        const done = finished || index < current || (finished && index <= current)
        const now = !finished && index === current
        return (
          <li
            key={step.key}
            className="grid justify-items-start gap-2"
            aria-current={now ? "step" : undefined}
          >
            <span className="flex w-full items-center">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold",
                  done
                    ? "bg-brand-600 text-white"
                    : now
                      ? "border-2 border-brand-600 bg-card text-brand-700"
                      : "bg-surface-muted text-mute",
                )}
              >
                {done ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "ml-1.5 h-0.5 flex-1",
                    done || finished ? "bg-brand-600" : "bg-line",
                  )}
                />
              ) : null}
            </span>
            <span
              className={cn(
                "text-[12.5px] leading-tight sm:text-[13.5px]",
                now ? "font-bold text-ink" : done ? "text-ink" : "text-mute",
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export const DealStageBar = ({ contract, className }: { contract: DealContract; className?: string }) => {
  const steps = getDealSteps(contract)
  const current = getDealStepIndex(contract)
  const finished = getDealPhase(contract) === "done"
  const currentLabel = finished ? "Завершено" : current >= 0 ? steps[current]?.label : "Отменена"

  return (
    <div
      className={cn("flex w-full gap-1", className)}
      role="img"
      aria-label={`Этап сделки: ${currentLabel}`}
    >
      {steps.map((step, index) => {
        const done = finished || index < current
        const now = !finished && index === current
        return (
          <span
            key={step.key}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              done || finished ? "bg-brand-600" : now ? "bg-brand-200" : "bg-line",
            )}
          />
        )
      })}
    </div>
  )
}
