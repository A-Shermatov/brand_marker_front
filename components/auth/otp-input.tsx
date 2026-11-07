"use client"

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { cn } from "@/lib/utils"

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  length?: number
  className?: string
  "aria-invalid"?: boolean
}

export function OtpInput({
  value,
  onChange,
  disabled,
  autoFocus,
  length = 6,
  className,
  "aria-invalid": ariaInvalid,
}: Props) {
  return (
    <InputOTP
      maxLength={length}
      value={value}
      onChange={(next) => onChange(next.replace(/\D/g, "").slice(0, length))}
      disabled={disabled}
      autoFocus={autoFocus}
      inputMode="numeric"
      pattern="[0-9]*"
      containerClassName={cn("justify-center gap-0", className)}
      aria-invalid={ariaInvalid}
    >
      <InputOTPGroup className="gap-2 sm:gap-2.5">
        {Array.from({ length }).map((_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className={cn(
              "size-11 sm:size-12 rounded-xl border border-line bg-card text-[18px] font-semibold text-ink shadow-none",
              "first:rounded-xl first:border-l last:rounded-xl",
              "data-[active=true]:border-ink data-[active=true]:ring-2 data-[active=true]:ring-ink/15",
              "aria-invalid:border-destructive",
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}
