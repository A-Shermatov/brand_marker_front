"use client"

import { MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr"
import { useTheme } from "next-themes"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

/**
 * Day or night in one click: the moon turns the page dark at once, the sun
 * turns it light again. The choice is remembered on this device.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  // The stored choice is known only in the browser; draw the moon until then.
  const hydrated = useHydrated()
  const night = hydrated && resolvedTheme === "dark"
  const Icon = night ? SunIcon : MoonIcon

  return (
    <button
      type="button"
      aria-label={night ? "Включить светлую тему" : "Включить тёмную тему"}
      title={night ? "Светлая тема" : "Тёмная тема"}
      onClick={() => setTheme(night ? "light" : "dark")}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink",
        className,
      )}
    >
      <Icon weight={night ? "fill" : "regular"} className="size-5" aria-hidden />
    </button>
  )
}
