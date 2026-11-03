"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckIcon as Check, PlusIcon as Plus, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import { parseBoundedInt } from "@/lib/bounded-number-input"
import { TermHint } from "@/components/ui/term-hint"
import {
  PAYMENT_TYPE_ORDER,
  milestoneTriggerLabel,
  paymentTypeMeta,
} from "@/lib/payment-display"
import {
  buildDefaultMilestones,
  isMilestonesValid,
  splitAmounts,
  sumPercentages,
} from "@/lib/payment-milestones"
import type {
  Currency,
  PaymentMilestoneInput,
  PaymentMilestoneTrigger,
  PaymentType,
  ProposalAcceptInput,
} from "@/types"

type PaymentTermsBuilderProps = {
  price: number
  currency: Currency
  onChange: (value: ProposalAcceptInput, isValid: boolean) => void
}

const TRIGGERS: PaymentMilestoneTrigger[] = ["contract_signed", "delivery_accepted"]

export const PaymentTermsBuilder = ({ price, currency, onChange }: PaymentTermsBuilderProps) => {
  const [paymentType, setPaymentType] = useState<PaymentType>("full_postpayment")
  const [milestones, setMilestones] = useState<PaymentMilestoneInput[]>(() =>
    buildDefaultMilestones("milestone"),
  )

  const isCustom = paymentType === "milestone"

  const effectiveMilestones = useMemo(
    () => (isCustom ? milestones : buildDefaultMilestones(paymentType)),
    [isCustom, milestones, paymentType],
  )

  const amounts = useMemo(
    () => splitAmounts(effectiveMilestones.map((m) => m.percentage), price),
    [effectiveMilestones, price],
  )

  const percentageTotal = useMemo(
    () => sumPercentages(effectiveMilestones),
    [effectiveMilestones],
  )

  const isValid = isCustom ? isMilestonesValid(milestones) : true

  useEffect(() => {
    onChange(
      {
        payment_type: paymentType,
        milestones: effectiveMilestones,
      },
      isValid,
    )
  }, [paymentType, effectiveMilestones, isValid, onChange])

  const updateMilestone = (index: number, patch: Partial<PaymentMilestoneInput>) => {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    )
  }

  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { title: `Этап ${prev.length + 1}`, percentage: 0, trigger: "delivery_accepted" },
    ])
  }

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-foreground mb-2 inline-flex items-center gap-1.5">
          Тип оплаты
          <TermHint term="escrow" iconOnly />
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {PAYMENT_TYPE_ORDER.map((type) => {
            const meta = paymentTypeMeta[type]
            const active = paymentType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setPaymentType(type)}
                className={cn(
                  "relative text-left rounded-xl border-2 p-3.5 transition-all",
                  active ? "border-primary bg-secondary" : "border-border hover:border-primary/40",
                )}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </span>
                )}
                <span className="block text-sm font-bold text-foreground pr-6">{meta.label}</span>
                <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {meta.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {isCustom ? (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Этапы оплаты</p>
            <span
              className={cn(
                "text-xs font-bold",
                Math.abs(percentageTotal - 100) <= 0.5 ? "text-primary" : "text-destructive",
              )}
            >
              Итого: {percentageTotal}%
            </span>
          </div>

          {milestones.map((milestone, index) => (
            <div
              key={index}
              className="rounded-xl border border-border p-3 space-y-2.5 bg-card"
            >
              <div className="flex items-center gap-2">
                <input
                  maxLength={50}
                  type="text"
                  value={milestone.title}
                  onChange={(e) => updateMilestone(index, { title: e.target.value })}
                  placeholder="Название этапа"
                  aria-label={`Название этапа ${index + 1}`}
                  className="flex-1 h-9 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(index)}
                  disabled={milestones.length <= 1}
                  aria-label="Удалить этап"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 w-24">
                  <input
                    maxLength={3}
                    type="text"
                    inputMode="numeric"
                    value={
                      Number.isFinite(milestone.percentage) ? milestone.percentage : 0
                    }
                    onChange={(e) => {
                      const next = parseBoundedInt(e.currentTarget.value, {
                        min: 0,
                        max: 100,
                        emptyAs: 0,
                      })
                      if (next === null) return
                      updateMilestone(index, { percentage: next })
                    }}
                    aria-label={`Процент этапа ${index + 1}`}
                    className="w-16 h-9 px-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <select
                  value={milestone.trigger}
                  onChange={(e) =>
                    updateMilestone(index, { trigger: e.target.value as PaymentMilestoneTrigger })
                  }
                  aria-label={`Условие оплаты этапа ${index + 1}`}
                  className="flex-1 h-9 px-2 rounded-lg border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TRIGGERS.map((trigger) => (
                    <option key={trigger} value={trigger}>
                      {milestoneTriggerLabel[trigger]}
                    </option>
                  ))}
                </select>
                <span className="text-sm font-semibold text-primary w-28 text-right">
                  {formatCurrency(amounts[index] ?? 0, currency)}
                </span>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddMilestone}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-dashed border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <Plus size={16} /> Добавить этап
          </button>

          {!isValid && (
            <p className="text-xs text-destructive">
              Заполните названия этапов, а сумма процентов должна равняться 100%.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-secondary p-3.5 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Этапы оплаты</p>
          {effectiveMilestones.map((milestone, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-foreground">
                {milestone.title}
                <span className="text-muted-foreground">
                  {" "}· {milestoneTriggerLabel[milestone.trigger]}
                </span>
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(amounts[index] ?? 0, currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
