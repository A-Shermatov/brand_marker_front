import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      maxLength={255}
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-faint h-10 w-full min-w-0 rounded-lg border border-line-strong bg-card px-3 text-[14.5px] shadow-[0_1px_1px_rgba(28,28,26,.03)] outline-none transition-[color,border-color,box-shadow] duration-150 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-faint disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-canvas disabled:opacity-70',
        'focus-visible:border-brand-600 focus-visible:ring-[3px] focus-visible:ring-brand-600/15',
        'aria-invalid:border-red-500 aria-invalid:ring-[3px] aria-invalid:ring-red-500/10',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
