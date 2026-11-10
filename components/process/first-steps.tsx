"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CaretDownIcon, CaretUpIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FirstStepAction = {
  label: string
  href: string
  icon?: PhosphorIcon
}

export type FirstStep = {
  id: string
  title: string
  /** One or two plain sentences: what happens at this step and why. */
  text: string
  done: boolean
  /** Shown only while this is the step the person is on; the first is the main one. */
  actions?: FirstStepAction[]
}

type FirstStepsProps = {
  /** Remembered per browser and per account, so the guide can be folded away. */
  storageKey: string
  title: string
  description?: React.ReactNode
  steps: FirstStep[]
  loading?: boolean
  className?: string
}

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Private mode: the guide simply is not remembered.
  }
}

/**
 * The path to a first deal, with the step the person is on right now.
 *
 * A newcomer's cabinet is empty, and an empty cabinet explains nothing. This
 * block says what happens on the platform and in what order, marks what is
 * already done from real data, and puts the one next action under the
 * current step. It leaves for good once every step is done.
 */
export function FirstSteps({ storageKey, title, description, steps, loading = false, className }: FirstStepsProps) {
  // "open" | "folded" | "finished"; unknown until the browser storage is read.
  const [saved, setSaved] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    setSaved(read(storageKey))
  }, [storageKey])

  const total = steps.length
  const doneCount = steps.filter((step) => step.done).length
  const allDone = total > 0 && doneCount === total
  const current = steps.findIndex((step) => !step.done)

  useEffect(() => {
    if (!loading && allDone) write(storageKey, "finished")
  }, [allDone, loading, storageKey])

  if (saved === undefined || saved === "finished") return null
  if (loading) {
    return <div className={cn("h-[212px] rounded-2xl border border-line bm-shimmer", className)} aria-hidden />
  }
  if (allDone || total === 0) return null

  const folded = saved === "folded"
  const toggle = () => {
    const next = folded ? "open" : "folded"
    write(storageKey, next)
    setSaved(next)
  }
  const now = steps[current]!

  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl border border-brand-200 bg-card shadow-[0_14px_34px_-24px_rgb(0_80_200/0.55)] bm-rise",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-5 md:px-6 md:pt-6",
          folded ? "md:pb-6" : "pb-0 md:pb-0",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
          {folded ? (
            <p className="mt-0.5 text-[14px] text-mute">
              Сейчас шаг {current + 1} из {total}: <span className="font-medium text-ink">{now.title}</span>
            </p>
          ) : description ? (
            <p className="mt-0.5 max-w-[68ch] text-[14px] leading-relaxed text-mute">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-[13px] font-medium text-ink-soft tnum">
            Сделано {doneCount} из {total}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!folded}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13.5px] font-medium text-mute transition-colors hover:bg-surface-muted hover:text-ink"
          >
            {folded ? "Показать шаги" : "Свернуть"}
            {folded ? <CaretDownIcon className="size-4" aria-hidden /> : <CaretUpIcon className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {folded ? null : (
        <ol className="grid gap-0 p-5 md:grid-cols-4 md:gap-5 md:px-6 md:pb-6">
          {steps.map((step, index) => {
            const isNow = index === current
            const isLast = index === total - 1
            return (
              <li
                key={step.id}
                aria-current={isNow ? "step" : undefined}
                className={cn(
                  "relative grid content-start grid-cols-[32px_minmax(0,1fr)] gap-x-3 md:grid-cols-1 md:gap-x-0",
                  !isLast && "pb-5 md:pb-0",
                )}
              >
                {/* The track: a dot per step and a line to the next one. */}
                <div className="relative flex justify-center md:justify-start">
                  <span
                    className={cn(
                      "relative z-10 grid size-8 shrink-0 place-items-center rounded-full text-[13.5px] font-semibold tnum",
                      step.done
                        ? "bg-brand-600 text-white"
                        : isNow
                          ? "border-2 border-brand-600 bg-card text-brand-700 bm-here"
                          : "bg-surface-muted text-mute",
                    )}
                    aria-hidden
                  >
                    {step.done ? <CheckIcon weight="bold" className="size-4" /> : index + 1}
                  </span>
                  {!isLast ? (
                    <>
                      {/* Phones: the line runs down. */}
                      <span className="absolute left-1/2 top-8 -bottom-5 w-0.5 -translate-x-1/2 bg-line md:hidden" aria-hidden>
                        {step.done ? <span className="block size-full bg-brand-600" /> : null}
                      </span>
                      {/* Wide screens: the line runs to the right. */}
                      <span
                        className="absolute left-10 right-[-12px] top-[15px] hidden h-0.5 overflow-hidden rounded-full bg-line md:block"
                        aria-hidden
                      >
                        {step.done ? (
                          <span
                            className="block size-full bg-brand-600 bm-grow-x"
                            style={{ animationDelay: `${0.15 + index * 0.18}s` }}
                          />
                        ) : null}
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="min-w-0 md:mt-3 md:pr-2">
                  <h3
                    className={cn(
                      "text-[15px] leading-snug",
                      isNow ? "font-semibold text-ink" : step.done ? "font-medium text-ink" : "font-medium text-mute",
                    )}
                  >
                    {step.title}
                    <span className="sr-only">
                      {step.done ? " — сделано" : isNow ? " — ваш следующий шаг" : " — позже"}
                    </span>
                  </h3>
                  <p className={cn("mt-1 text-[13.5px] leading-relaxed", isNow ? "text-ink-soft" : "text-mute")}>
                    {step.text}
                  </p>
                  {isNow && step.actions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.actions.map((action, i) => (
                        <Button key={action.href} asChild size="sm" variant={i === 0 ? "default" : "outline"}>
                          <Link href={action.href}>
                            {action.icon ? <action.icon weight="bold" className="size-4" aria-hidden /> : null}
                            {action.label}
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
