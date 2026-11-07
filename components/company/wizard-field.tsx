"use client"

import { cn } from "@/lib/utils"

type WizardFieldProps = {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export const WizardField = ({
  label,
  error,
  required,
  children,
  className,
}: WizardFieldProps) => (
  <div className={cn("space-y-1.5", className)}>
    <label className="text-sm font-semibold text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

export const wizardInputClass =
  "w-full h-11 px-4 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"

export const wizardTextareaClass =
  "w-full min-h-[100px] px-4 py-3 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
