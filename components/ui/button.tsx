import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[14.5px] font-semibold transition-[color,background-color,border-color,box-shadow] duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-brand-600/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white border border-brand-700/40 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_1px_2px_rgba(10,40,28,.18)] hover:bg-brand-700 dark:border-white/10 dark:hover:bg-brand-500',
        dark:
          'bg-contrast text-white border border-contrast hover:bg-contrast/90',
        outline:
          'bg-card text-ink border border-line-strong shadow-[0_1px_1px_rgba(28,28,26,.04)] hover:bg-canvas',
        secondary:
          'bg-surface-muted text-ink border border-transparent hover:bg-line',
        ghost:
          'text-ink-soft border border-transparent hover:text-ink hover:bg-surface-muted',
        safe:
          'bg-safe-500 text-white border border-safe-500 hover:bg-safe-700 dark:bg-[#1F9E73] dark:border-[#1F9E73] dark:hover:bg-[#1A8862]',
        destructive:
          'bg-red-600 text-white border border-red-600 hover:bg-red-700 dark:bg-[#C93B3B] dark:border-[#C93B3B] dark:hover:bg-[#B23131]',
        'destructive-outline':
          'bg-card text-red-700 border border-red-200 hover:bg-red-50',
        link: 'text-brand-700 underline-offset-4 hover:underline h-auto px-0',
      },
      size: {
        default: 'h-10 px-4 has-[>svg]:px-3.5',
        sm: "h-8 gap-1.5 rounded-md px-3 text-[13.5px] has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-4",
        lg: 'h-11 px-5 text-[15px] has-[>svg]:px-4',
        icon: 'size-10',
        'icon-sm': 'size-8 rounded-md',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
