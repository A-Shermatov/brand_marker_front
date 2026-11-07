"use client"

import { CheckIcon, DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Светлая", Icon: SunIcon },
  { value: "dark", label: "Тёмная", Icon: MoonIcon },
  { value: "system", label: "Как на устройстве", Icon: DesktopIcon },
] as const

/**
 * Day or night look: a sun or a moon in the bar opens the choice. "Как на
 * устройстве" follows the phone or computer, switching at dusk by itself.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  // The stored choice is known only in the browser; draw the sun until then.
  const hydrated = useHydrated()
  const night = hydrated && resolvedTheme === "dark"
  const Icon = night ? MoonIcon : SunIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={night ? "Тема: тёмная. Изменить" : "Тема: светлая. Изменить"}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink",
            className,
          )}
        >
          <Icon weight={night ? "fill" : "regular"} className="size-5" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Оформление</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ value, label, Icon: OptionIcon }) => (
          <DropdownMenuItem key={value} className="cursor-pointer" onClick={() => setTheme(value)}>
            <OptionIcon size={16} aria-hidden />
            {label}
            {hydrated && theme === value ? <CheckIcon className="ml-auto size-4 text-brand-600" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
