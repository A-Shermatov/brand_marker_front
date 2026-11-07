"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  // Toasts follow the site theme.
  const { resolvedTheme } = useTheme()
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--safe-50)",
          "--success-border": "var(--safe-100)",
          "--success-text": "var(--safe-700)",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans! gap-3!",
          title: "whitespace-normal break-words font-semibold!",
          description: "whitespace-normal break-words",
          actionButton:
            "bg-primary! text-primary-foreground! rounded-lg! font-bold! h-8! px-3!",
          cancelButton: "bg-secondary! text-secondary-foreground! rounded-lg! h-8! px-3!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
