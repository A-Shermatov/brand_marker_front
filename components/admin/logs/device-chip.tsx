"use client"

import {
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  QuestionIcon,
  RobotIcon,
  TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr"
import { getCountryLabel, getDeviceKindLabel } from "@/lib/admin-log-labels"
import type { AdminLogDevice } from "@/lib/api/admin"
import { cn } from "@/lib/utils"

const ICONS = {
  desktop: DesktopIcon,
  mobile: DeviceMobileIcon,
  tablet: DeviceTabletIcon,
  messenger: TelegramLogoIcon,
  bot: RobotIcon,
} as const

export const DeviceIcon = ({ type, className }: { type: string; className?: string }) => {
  const Icon = ICONS[type as keyof typeof ICONS] ?? QuestionIcon
  return <Icon className={cn("size-4 shrink-0", className)} aria-label={getDeviceKindLabel(type)} />
}

/** What to call a device whose system is unknown. */
export const fallbackName = (device: { type: string; is_bot: boolean }) => {
  if (device.type === "messenger") return "Telegram"
  return device.is_bot ? "Программа" : "Система не определена"
}

type DeviceChipProps = {
  device: AdminLogDevice | null | undefined
  ip?: string | null
  country?: string | null
  /** Opens the device's card; without it the chip is plain text. */
  onOpen?: (deviceKey: string) => void
}

/**
 * The device and address of a journal row: «Windows 11 / Chrome 142» with the
 * IP under it. Two short lines, so a table column stays narrow.
 */
export const DeviceChip = ({ device, ip, country, onOpen }: DeviceChipProps) => {
  const place = [ip, getCountryLabel(country)].filter(Boolean).join(" · ")
  if (!device) {
    return <span className="text-xs text-muted-foreground">{place || "—"}</span>
  }
  const body = (
    <>
      <DeviceIcon
        type={device.type}
        className={cn("mt-0.5", device.is_bot ? "text-warning" : "text-muted-foreground")}
      />
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm text-foreground">
          {device.os ?? fallbackName(device)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {[device.os || device.type !== "messenger" ? device.browser : null, device.model]
            .filter(Boolean)
            .join(" · ") || (device.type === "messenger" ? "Бот платформы" : "Браузер не определён")}
        </span>
        {place && <span className="block truncate text-xs tabular-nums text-muted-foreground">{place}</span>}
      </span>
    </>
  )
  const deviceKey = device.key
  if (!onOpen || !deviceKey) {
    return <span className="flex max-w-52 items-start gap-2">{body}</span>
  }
  return (
    <button
      type="button"
      className="flex max-w-52 items-start gap-2 rounded-md text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={`Устройство: ${device.os ?? "не определено"}, ${device.browser ?? "браузер не определён"}`}
      onClick={(event) => {
        event.stopPropagation()
        onOpen(deviceKey)
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {body}
    </button>
  )
}
