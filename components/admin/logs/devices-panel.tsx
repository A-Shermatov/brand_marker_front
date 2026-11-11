"use client"

import { useEffect, useState } from "react"
import {
  CaretLeftIcon as ChevronLeft,
  CaretRightIcon as ChevronRight,
  DevicesIcon,
  MagnifyingGlassIcon as Search,
  ArrowsCounterClockwiseIcon as RefreshCcw,
} from "@phosphor-icons/react/dist/ssr"
import { DeviceIcon, fallbackName } from "@/components/admin/logs/device-chip"
import { PageEmptyState, PageSurface } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminDevicesQuery } from "@/hooks/api/use-admin-logs-query"
import {
  describeDevice,
  DEVICE_FLAG_LABELS,
  DEVICE_KIND_LABELS,
  getCountryLabel,
  LOG_PERIOD_LABELS,
} from "@/lib/admin-log-labels"
import type {
  AdminDeviceFlag,
  AdminDeviceItem,
  AdminDeviceKind,
  AdminLogPeriod,
} from "@/lib/api/admin"
import { formatCount } from "@/lib/format"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import { cn } from "@/lib/utils"

const ALL = "all"
const SEARCH_DEBOUNCE_MS = 350
const FLAGS = Object.keys(DEVICE_FLAG_LABELS) as AdminDeviceFlag[]
const KINDS = Object.keys(DEVICE_KIND_LABELS) as AdminDeviceKind[]
const PERIODS = Object.keys(LOG_PERIOD_LABELS) as AdminLogPeriod[]

const formatSeen = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

export const DeviceMarks = ({ device }: { device: AdminDeviceItem }) => (
  <>
    {device.identified && device.users_count > 1 && (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
        {formatCount(device.users_count, "аккаунт", "аккаунта", "аккаунтов")}
      </Badge>
    )}
    {device.automated && (
      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
        Автоматизация
      </Badge>
    )}
    {!device.identified && <Badge variant="outline">Без идентификатора</Badge>}
  </>
)

const DeviceUsers = ({ device }: { device: AdminDeviceItem }) => {
  if (device.users_count === 0) return <span className="text-muted-foreground">Гость</span>
  const more = device.users_count - device.users.length
  return (
    <div className="min-w-0">
      {device.users.map((user) => (
        <p key={user.id} className="max-w-56 truncate text-sm text-foreground">
          {user.name}
        </p>
      ))}
      {more > 0 && <p className="text-xs text-muted-foreground">и ещё {more}</p>}
    </div>
  )
}

type DevicesPanelProps = {
  onOpen: (deviceKey: string) => void
  /** Only the devices of one person (their page shows this list without its filters). */
  userId?: number | null
  compact?: boolean
}

/** The registry of devices: what each one is, who used it and from where. */
export const DevicesPanel = ({ onOpen, userId = null, compact = false }: DevicesPanelProps) => {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [flag, setFlag] = useState<AdminDeviceFlag | null>(null)
  const [kind, setKind] = useState<AdminDeviceKind | null>(null)
  const [period, setPeriod] = useState<AdminLogPeriod>("all")

  useEffect(() => {
    if (searchInput.trim() === query) return
    const timeout = window.setTimeout(() => {
      setQuery(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [query, searchInput])

  const devicesQuery = useAdminDevicesQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    query,
    userId,
    flag,
    type: kind,
    period,
  })
  const hasFilters = Boolean(query || flag || kind || period !== "all")

  const resetFilters = () => {
    setSearchInput("")
    setQuery("")
    setFlag(null)
    setKind(null)
    setPeriod("all")
    setPage(1)
  }

  const data = devicesQuery.data

  return (
    <div className="space-y-4">
      {!compact && (
        <PageSurface aria-label="Фильтры устройств">
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label htmlFor="device-search" className="text-xs font-medium text-muted-foreground">
                Поиск
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="device-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Имя, email, IP или система"
                  maxLength={255}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="device-flag" className="text-xs font-medium text-muted-foreground">
                Признак
              </label>
              <Select
                value={flag ?? ALL}
                onValueChange={(next) => {
                  setFlag(next === ALL ? null : (next as AdminDeviceFlag))
                  setPage(1)
                }}
              >
                <SelectTrigger id="device-flag" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Все устройства</SelectItem>
                  {FLAGS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {DEVICE_FLAG_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="device-kind" className="text-xs font-medium text-muted-foreground">
                Вид
              </label>
              <Select
                value={kind ?? ALL}
                onValueChange={(next) => {
                  setKind(next === ALL ? null : (next as AdminDeviceKind))
                  setPage(1)
                }}
              >
                <SelectTrigger id="device-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Любой</SelectItem>
                  {KINDS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {DEVICE_KIND_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="device-period" className="text-xs font-medium text-muted-foreground">
                Были активны
              </label>
              <Select
                value={period}
                onValueChange={(next) => {
                  setPeriod(next as AdminLogPeriod)
                  setPage(1)
                }}
              >
                <SelectTrigger id="device-period" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {LOG_PERIOD_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <div className="border-t border-border p-4">
              <Button type="button" variant="outline" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </PageSurface>
      )}

      {devicesQuery.isLoading && (
        <div className="h-64 animate-pulse rounded-xl bg-muted" aria-label="Загрузка устройств" />
      )}

      {devicesQuery.isError && (
        <PageSurface>
          <PageEmptyState
            tone="danger"
            title="Не удалось загрузить устройства"
            action={
              <Button type="button" variant="outline" onClick={() => devicesQuery.refetch()}>
                <RefreshCcw aria-hidden="true" />
                Повторить
              </Button>
            }
          />
        </PageSurface>
      )}

      {data && data.items.length === 0 && (
        <PageSurface>
          <PageEmptyState
            icon={<DevicesIcon aria-hidden="true" />}
            title={userId ? "Устройств пока нет" : "Устройств не найдено"}
            description={
              userId
                ? "Они появятся после первого входа пользователя."
                : hasFilters
                  ? "Измените фильтры или выберите больший период."
                  : "Здесь появятся устройства, с которых заходят на платформу."
            }
          />
        </PageSurface>
      )}

      {data && data.items.length > 0 && (
        <PageSurface
          className={cn(devicesQuery.isFetching && "opacity-70")}
          aria-busy={devicesQuery.isFetching}
          aria-label="Устройства"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="px-5">Устройство</TableHead>
                  <TableHead>Кто пользовался</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Последняя активность</TableHead>
                  <TableHead className="px-5 text-right">Обращений</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((device) => (
                  <TableRow
                    key={device.key}
                    tabIndex={0}
                    role="button"
                    aria-label={`Устройство: ${describeDevice(device)}`}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                    onClick={() => onOpen(device.key)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onOpen(device.key)
                      }
                    }}
                  >
                    <TableCell className="px-5 py-3">
                      <div className="flex items-start gap-2.5">
                        <DeviceIcon
                          type={device.type}
                          className={cn("mt-0.5", device.is_bot ? "text-warning" : "text-muted-foreground")}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {device.os ?? fallbackName(device)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[device.browser, device.model, device.screen].filter(Boolean).join(" · ") ||
                              "Браузер не определён"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <DeviceMarks device={device} />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DeviceUsers device={device} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="tabular-nums text-foreground">{device.last_ip ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          getCountryLabel(device.country),
                          device.ips_count > 1 ? `адресов: ${device.ips_count}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatSeen(device.last_seen_at)}
                    </TableCell>
                    <TableCell className="px-5 text-right tabular-nums text-muted-foreground">
                      {device.requests_count.toLocaleString("ru-RU")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PageSurface>
      )}

      {data && data.items.length > 0 && data.pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Страницы устройств">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft aria-hidden="true" />
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {data.pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
          >
            Далее
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}
