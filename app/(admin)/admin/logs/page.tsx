"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowsCounterClockwiseIcon as RefreshCcw, ScrollIcon as ScrollText, MagnifyingGlassIcon as Search, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { DeviceChip } from "@/components/admin/logs/device-chip"
import { DeviceSheet } from "@/components/admin/logs/device-sheet"
import { DevicesPanel } from "@/components/admin/logs/devices-panel"
import { formatLogDateTime, LogDetailsSheet } from "@/components/admin/logs/log-details-sheet"
import { LogChangesSummary, LogResourceLink } from "@/components/admin/logs/log-event-details"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
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
import { useAdminLogsQuery } from "@/hooks/api/use-admin-logs-query"
import {
  getLogEventCategoryLabel,
  getLogEventLabel,
  getLogResourceTypeLabel,
  getLogUserRoleLabel,
  LOG_AUDIENCE_LABELS,
  LOG_EVENT_CATEGORY_LABELS,
  LOG_KIND_LABELS,
  LOG_PERIOD_LABELS,
  LOG_SECTION_LABELS,
  LOG_SOURCE_LABELS,
  LOG_STATUS_META,
  LOG_VIEW_HINTS,
} from "@/lib/admin-log-labels"
import type {
  AdminLogAudience,
  AdminLogEventCategory,
  AdminLogEventItem,
  AdminLogItem,
  AdminLogKind,
  AdminLogPageItem,
  AdminLogPeriod,
  AdminLogSection,
  AdminLogSource,
  AdminLogStatus,
  AnyAdminLogItem,
} from "@/lib/api/admin"
import { cn } from "@/lib/utils"
import { describePage, formatStay } from "@/lib/page-labels"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const ALL_VALUE = "all"
const DEFAULT_PERIOD: AdminLogPeriod = "7d"
const SEARCH_DEBOUNCE_MS = 350

/** The journal's tabs: three kinds of rows, and the registry of devices. */
type LogView = AdminLogSource | "devices"

const AUDIENCES = Object.keys(LOG_AUDIENCE_LABELS) as AdminLogAudience[]
const KINDS = Object.keys(LOG_KIND_LABELS) as AdminLogKind[]
const SECTIONS = Object.keys(LOG_SECTION_LABELS) as AdminLogSection[]
const STATUSES = Object.keys(LOG_STATUS_META) as AdminLogStatus[]
const PERIODS = Object.keys(LOG_PERIOD_LABELS) as AdminLogPeriod[]
const SOURCES = Object.keys(LOG_SOURCE_LABELS) as AdminLogSource[]
const VIEWS: LogView[] = [...SOURCES, "devices"]
const VIEW_LABELS: Record<LogView, string> = { ...LOG_SOURCE_LABELS, devices: "Устройства" }
const CATEGORIES = Object.keys(LOG_EVENT_CATEGORY_LABELS) as AdminLogEventCategory[]
const RESOURCE_TYPES = [
  "company",
  "user",
  "catalog_item",
  "rfq",
  "proposal",
  "contract",
  "milestone",
  "payment",
  "platform_payment",
  "withdrawal",
  "review",
  "dispute",
  "report",
  "role",
  "category",
] as const
type ResourceTypeOption = (typeof RESOURCE_TYPES)[number]
const RESOURCE_TYPE_LABELS = Object.fromEntries(
  RESOURCE_TYPES.map((value) => [value, getLogResourceTypeLabel(value)]),
) as Record<ResourceTypeOption, string>
const DEFAULT_VIEW: LogView = "events"

const pickOption = <T extends string>(value: string | null, options: readonly T[]): T | null =>
  value && (options as readonly string[]).includes(value) ? (value as T) : null

const LogsSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка журнала">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const LogStatusBadge = ({ status }: { status: AdminLogStatus }) => (
  <Badge
    variant="outline"
    className={LOG_STATUS_META[status].className}
    title={LOG_STATUS_META[status].hint}
  >
    {LOG_STATUS_META[status].label}
  </Badge>
)

const LogActor = ({ log }: { log: AnyAdminLogItem }) => {
  if (!log.user) {
    const guestEmail = log.source === "http" ? log.guest_email : null
    return (
      <div className="min-w-0">
        <p className="font-semibold text-foreground">
          {log.source === "event" ? "Система" : "Гость"}
        </p>
        {log.source === "event" && log.actor_id && (
          <p className="text-xs text-muted-foreground">Профиль № {log.actor_id}</p>
        )}
        {guestEmail && (
          <p className="max-w-56 truncate text-xs text-muted-foreground">{guestEmail}</p>
        )}
      </div>
    )
  }
  return (
    <div className="min-w-0">
      <p className="max-w-56 truncate font-semibold text-foreground">{log.user.name}</p>
      <p className="max-w-56 truncate text-xs text-muted-foreground">
        {log.user.email} · {getLogUserRoleLabel(log.user.role)}
      </p>
    </div>
  )
}

type FilterSelectProps<T extends string> = {
  id: string
  label: string
  value: T | null
  options: readonly T[]
  labels: Record<T, string>
  allLabel?: string
  onChange: (value: T | null) => void
}

const FilterSelect = <T extends string>({
  id,
  label,
  value,
  options,
  labels,
  allLabel,
  onChange,
}: FilterSelectProps<T>) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
      {label}
    </label>
    <Select
      value={value ?? ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? null : (next as T))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {labels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

type RowProps<T> = {
  log: T
  onSelect: (logId: number) => void
  onOpenDevice: (deviceKey: string) => void
}

const rowA11yProps = (logId: number, label: string, onSelect: (logId: number) => void) => ({
  tabIndex: 0,
  role: "button" as const,
  "aria-label": `Подробности: ${label}`,
  className:
    "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
  onClick: () => onSelect(logId),
  onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect(logId)
    }
  },
})

const DAY_FORMAT = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" })
const CLOCK_FORMAT = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

/** The day over the time to the second: a narrow column that still sorts by eye. */
const TimeCell = ({ value }: { value: string }) => {
  const moment = new Date(value)
  return (
    <TableCell className="whitespace-nowrap px-5 py-3 align-top" title={formatLogDateTime(value)}>
      <p className="tabular-nums text-foreground">{CLOCK_FORMAT.format(moment)}</p>
      <p className="text-xs text-muted-foreground">{DAY_FORMAT.format(moment)}</p>
    </TableCell>
  )
}

/** A long object id is shown by its beginning; the row's details have it whole. */
const shortId = (id: string) => (id.length > 12 ? `${id.slice(0, 8)}…` : id)

/** Who it came from, by machine and address: the last column of every view. */
const DeviceCell = ({ log, onOpenDevice }: Pick<RowProps<AnyAdminLogItem>, "log" | "onOpenDevice">) => (
  <TableCell className="px-5 align-top">
    <DeviceChip device={log.device} ip={log.ip_address} country={log.country} onOpen={onOpenDevice} />
  </TableCell>
)

const HttpLogRow = ({ log, onSelect, onOpenDevice }: RowProps<AdminLogItem>) => (
  <TableRow
    {...rowA11yProps(
      log.id,
      `${LOG_KIND_LABELS[log.kind]}, ${LOG_SECTION_LABELS[log.section]}`,
      onSelect,
    )}
  >
    <TimeCell value={log.created_at} />
    <TableCell className="align-top">
      <LogActor log={log} />
    </TableCell>
    <TableCell className="align-top">
      <p className="font-medium text-foreground">
        {LOG_KIND_LABELS[log.kind]}
        {log.repeats > 0 && (
          <span
            className="ml-1.5 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground"
            title="Столько раз подряд пришло одно и то же обращение"
          >
            ×{log.repeats + 1}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {LOG_SECTION_LABELS[log.section]}
        {log.object_id && ` · № ${shortId(log.object_id)}`}
      </p>
      {log.path && (
        <p className="max-w-72 truncate text-xs text-muted-foreground/80" title={log.path}>
          {log.path.replace(/^\/api\/v1/, "")}
        </p>
      )}
    </TableCell>
    <TableCell className="align-top">
      <LogStatusBadge status={log.status} />
    </TableCell>
    <DeviceCell log={log} onOpenDevice={onOpenDevice} />
  </TableRow>
)

const EventLogRow = ({ log, onSelect, onOpenDevice }: RowProps<AdminLogEventItem>) => {
  const label = getLogEventLabel(log.action)
  return (
    <TableRow {...rowA11yProps(log.id, label, onSelect)}>
      <TimeCell value={log.created_at} />
      <TableCell className="align-top">
        <LogActor log={log} />
      </TableCell>
      <TableCell className="max-w-80 align-top whitespace-normal">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {getLogEventCategoryLabel(log.category)} ·{" "}
          <LogResourceLink resourceType={log.resource_type} resourceId={log.resource_id} />
        </p>
        {log.details.new_device === true && (
          <Badge variant="outline" className="mt-1 border-warning/30 bg-warning/10 text-warning">
            Новое устройство
          </Badge>
        )}
      </TableCell>
      <TableCell className="max-w-72 align-top whitespace-normal">
        <LogChangesSummary details={log.details} />
      </TableCell>
      <DeviceCell log={log} onOpenDevice={onOpenDevice} />
    </TableRow>
  )
}

const PageLogRow = ({ log, onSelect, onOpenDevice }: RowProps<AdminLogPageItem>) => {
  const page = describePage(log.path)
  const name = [page.name, page.detail].filter(Boolean).join(" · ")
  return (
    <TableRow {...rowA11yProps(log.id, `${page.area}, ${name}`, onSelect)}>
      <TimeCell value={log.created_at} />
      <TableCell className="align-top">
        <LogActor log={log} />
      </TableCell>
      <TableCell className="align-top">
        <p className="font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{page.area}</p>
        <p className="max-w-72 truncate text-xs text-muted-foreground/80">{log.path}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap align-top tabular-nums text-muted-foreground">
        {formatStay(log.seconds)}
      </TableCell>
      <DeviceCell log={log} onOpenDevice={onOpenDevice} />
    </TableRow>
  )
}

const STATUS_LABELS = Object.fromEntries(
  STATUSES.map((status) => [status, LOG_STATUS_META[status].label]),
) as Record<AdminLogStatus, string>

const COLUMNS: Record<AdminLogSource, string[]> = {
  events: ["Время", "Кто", "Событие", "Изменения", "Устройство и адрес"],
  http: ["Время", "Кто", "Действие", "Результат", "Устройство и адрес"],
  pages: ["Время", "Кто", "Страница", "Пробыл", "Устройство и адрес"],
}

/** A filter that came from a link (a device, an address, a person): shown as a chip that removes it. */
const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <Badge variant="secondary" className="h-9 max-w-full gap-1.5 px-3">
    <span className="truncate">{label}</span>
    <button type="button" aria-label={`Убрать фильтр: ${label}`} onClick={onRemove}>
      <X className="size-3.5" aria-hidden="true" />
    </button>
  </Badge>
)

const AdminLogsContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const view = pickOption(searchParams.get("view"), VIEWS) ?? DEFAULT_VIEW
  const source: AdminLogSource = view === "devices" ? "events" : view
  const isDevices = view === "devices"
  const isEvents = view === "events"
  const isHttp = view === "http"
  const audience = pickOption(searchParams.get("audience"), AUDIENCES) ?? "users"
  const category = pickOption(searchParams.get("category"), CATEGORIES)
  const resourceType = pickOption(searchParams.get("resource_type"), RESOURCE_TYPES)
  const resourceId = searchParams.get("resource_id") ?? ""
  const action = searchParams.get("action") ?? ""
  const userId = Number(searchParams.get("user_id")) || null
  const ip = searchParams.get("ip") ?? ""
  const device = searchParams.get("device") ?? ""
  const visit = searchParams.get("visit") ?? ""
  const kind = pickOption(searchParams.get("kind"), KINDS)
  const section = pickOption(searchParams.get("section"), SECTIONS)
  const status = pickOption(searchParams.get("status"), STATUSES)
  const period = pickOption(searchParams.get("period"), PERIODS) ?? DEFAULT_PERIOD
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""

  const [searchInput, setSearchInput] = useState(query)
  const [resourceIdInput, setResourceIdInput] = useState(resourceId)
  const [actionInput, setActionInput] = useState(action)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)

  const logsQuery = useAdminLogsQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    audience,
    source,
    kind,
    section,
    status,
    category,
    action: isEvents ? action : null,
    resourceType: isEvents ? resourceType : null,
    resourceId: isEvents ? resourceId : null,
    userId,
    ip,
    device,
    visit,
    period,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value)
          return
        }
        nextParams.delete(key)
      })
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (searchInput === query) return
    const timeout = window.setTimeout(() => {
      replaceSearchParams({ query: searchInput.trim() || null, page: null })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [query, replaceSearchParams, searchInput])

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    if (resourceIdInput === resourceId && actionInput === action) return
    const timeout = window.setTimeout(() => {
      replaceSearchParams({
        resource_id: resourceIdInput.trim() || null,
        action: actionInput.trim() || null,
        page: null,
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [action, actionInput, replaceSearchParams, resourceId, resourceIdInput])

  useEffect(() => {
    setResourceIdInput(resourceId)
  }, [resourceId])

  useEffect(() => {
    setActionInput(action)
  }, [action])

  useEffect(() => {
    if (isDevices || !logsQuery.data || page <= logsQuery.data.pages) return
    replaceSearchParams({ page: String(logsQuery.data.pages) })
  }, [isDevices, logsQuery.data, page, replaceSearchParams])

  const handleFilterChange = (key: string) => (value: string | null) => {
    replaceSearchParams({ [key]: value, page: null })
  }

  const handlePeriodChange = (value: AdminLogPeriod | null) => {
    replaceSearchParams({
      period: !value || value === DEFAULT_PERIOD ? null : value,
      page: null,
    })
  }

  const handleViewChange = (value: LogView) => {
    replaceSearchParams({ view: value === DEFAULT_VIEW ? null : value, page: null })
  }

  const handleAudienceChange = (value: AdminLogAudience) => {
    replaceSearchParams({ audience: value === "users" ? null : value, page: null })
  }

  const handleReset = () => {
    setSearchInput("")
    setResourceIdInput("")
    setActionInput("")
    replaceSearchParams({
      kind: null,
      section: null,
      status: null,
      category: null,
      action: null,
      resource_type: null,
      resource_id: null,
      user_id: null,
      ip: null,
      device: null,
      visit: null,
      period: null,
      query: null,
      page: null,
    })
  }

  const handlePageChange = (targetPage: number) => {
    replaceSearchParams({ page: targetPage <= 1 ? null : String(targetPage) })
  }

  // One sheet at a time: a row's device opens in place of the row.
  const handleOpenDevice = (deviceKey: string) => {
    setSelectedLogId(null)
    setSelectedDevice(deviceKey)
  }

  const header = (total: number | null) => (
    <PageHeader
      title="Журнал действий"
      description={LOG_VIEW_HINTS[view]}
      actions={
        total === null ? undefined : (
          <p className="text-sm text-muted-foreground">
            Найдено <strong className="ml-1 text-foreground">{total.toLocaleString("ru-RU")}</strong>
          </p>
        )
      }
    />
  )

  const viewSwitch = (
    <SegmentedControl
      value={view}
      options={VIEWS.map((value) => ({ value, label: VIEW_LABELS[value] }))}
      onChange={handleViewChange}
      ariaLabel="Что показывать"
      className="w-full max-w-full border-0 bg-transparent p-0 2xl:w-auto"
    />
  )

  if (isDevices) {
    return (
      <PageFrame>
        {header(null)}
        <PageSurface aria-label="Разделы журнала">
          <div className="p-3">{viewSwitch}</div>
        </PageSurface>
        <DevicesPanel onOpen={setSelectedDevice} />
        <DeviceSheet
          deviceKey={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onOpenDevice={setSelectedDevice}
        />
      </PageFrame>
    )
  }

  if (logsQuery.isLoading) return <LogsSkeleton />

  if (logsQuery.isError || !logsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <ScrollText className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить журнал</h1>
          <Button type="button" className="mt-5" onClick={() => logsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, total, pages, audience_counts: audienceCounts } = logsQuery.data
  const hasLinkedFilter = Boolean(userId || ip || device || visit)
  const hasFilters = Boolean(
    (isEvents ? category || action || resourceType || resourceId : isHttp && (kind || section || status)) ||
      hasLinkedFilter ||
      query ||
      period !== DEFAULT_PERIOD,
  )

  return (
    <PageFrame>
      {header(total)}

      <PageSurface aria-label="Фильтры журнала">
        {/* Four tabs and the audience switch do not fit one row beside the menu: they stack until the screen is wide. */}
        <div className="flex flex-col gap-2 border-b border-border p-3 2xl:flex-row 2xl:items-center">
          {viewSwitch}
          <SegmentedControl
            value={audience}
            options={AUDIENCES.map((value) => ({
              value,
              label: LOG_AUDIENCE_LABELS[value],
              count: audienceCounts[value],
            }))}
            onChange={handleAudienceChange}
            ariaLabel="Чьи действия показывать"
            className="w-full max-w-full border-0 bg-transparent p-0"
          />
        </div>
        {isEvents && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect
              id="log-category"
              label="Категория"
              value={category}
              options={CATEGORIES}
              labels={LOG_EVENT_CATEGORY_LABELS}
              allLabel="Все категории"
              onChange={handleFilterChange("category")}
            />
            <FilterSelect
              id="log-resource-type"
              label="Тип объекта"
              value={resourceType}
              options={RESOURCE_TYPES}
              labels={RESOURCE_TYPE_LABELS}
              allLabel="Любой объект"
              onChange={handleFilterChange("resource_type")}
            />
            <div className="space-y-1.5">
              <label htmlFor="log-resource-id" className="text-xs font-medium text-muted-foreground">
                Номер объекта
              </label>
              <Input
                id="log-resource-id"
                value={resourceIdInput}
                onChange={(event) => setResourceIdInput(event.target.value)}
                placeholder="Например, 42"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="log-action" className="text-xs font-medium text-muted-foreground">
                Код действия
              </label>
              <Input
                id="log-action"
                value={actionInput}
                onChange={(event) => setActionInput(event.target.value)}
                placeholder="rfq.create"
                maxLength={100}
              />
            </div>
            <FilterSelect
              id="log-period-events"
              label="Период"
              value={period}
              options={PERIODS}
              labels={LOG_PERIOD_LABELS}
              onChange={handlePeriodChange}
            />
          </div>
        )}
        {isHttp && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              id="log-kind"
              label="Действие"
              value={kind}
              options={KINDS}
              labels={LOG_KIND_LABELS}
              allLabel="Все действия"
              onChange={handleFilterChange("kind")}
            />
            <FilterSelect
              id="log-section"
              label="Раздел"
              value={section}
              options={SECTIONS}
              labels={LOG_SECTION_LABELS}
              allLabel="Все разделы"
              onChange={handleFilterChange("section")}
            />
            <FilterSelect
              id="log-status"
              label="Результат"
              value={status}
              options={STATUSES}
              labels={STATUS_LABELS}
              allLabel="Любой результат"
              onChange={handleFilterChange("status")}
            />
            <FilterSelect
              id="log-period"
              label="Период"
              value={period}
              options={PERIODS}
              labels={LOG_PERIOD_LABELS}
              onChange={handlePeriodChange}
            />
          </div>
        )}
        {view === "pages" && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              id="log-period-pages"
              label="Период"
              value={period}
              options={PERIODS}
              labels={LOG_PERIOD_LABELS}
              onChange={handlePeriodChange}
            />
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-60 flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={
                isEvents ? "Имя, email, IP или код действия" : "Имя, email, IP или адрес страницы"
              }
              maxLength={255}
              className="pl-11"
              aria-label="Поиск по журналу"
            />
          </div>
          {userId && (
            <FilterChip
              label={`Пользователь № ${userId}`}
              onRemove={() => replaceSearchParams({ user_id: null, page: null })}
            />
          )}
          {ip && (
            <FilterChip label={`IP ${ip}`} onRemove={() => replaceSearchParams({ ip: null, page: null })} />
          )}
          {device && (
            <FilterChip
              label={`Устройство ${device.slice(0, 8)}…`}
              onRemove={() => replaceSearchParams({ device: null, page: null })}
            />
          )}
          {visit && (
            <FilterChip
              label={`Посещение ${visit.slice(0, 8)}…`}
              onRemove={() => replaceSearchParams({ visit: null, page: null })}
            />
          )}
          {hasFilters && (
            <Button type="button" variant="outline" onClick={handleReset}>
              Сбросить фильтры
            </Button>
          )}
        </div>
      </PageSurface>

      {items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<ScrollText aria-hidden="true" />}
            title="Записей не найдено"
            description={
              hasFilters
                ? "Измените фильтры или выберите больший период."
                : "Здесь появятся действия, как только они будут совершены."
            }
          />
        </PageSurface>
      ) : (
        <PageSurface
          className={cn(logsQuery.isFetching && "opacity-70")}
          aria-busy={logsQuery.isFetching}
          aria-label="Записи журнала"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  {COLUMNS[source].map((column, index, all) => (
                    <TableHead
                      key={column}
                      className={cn((index === 0 || index === all.length - 1) && "px-5")}
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((log) => {
                  const rowProps = { onSelect: setSelectedLogId, onOpenDevice: handleOpenDevice }
                  if (log.source === "event") return <EventLogRow key={log.id} log={log} {...rowProps} />
                  if (log.source === "page") return <PageLogRow key={log.id} log={log} {...rowProps} />
                  return <HttpLogRow key={log.id} log={log} {...rowProps} />
                })}
              </TableBody>
            </Table>
          </div>
          {isHttp && (
            <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
              Одинаковые просмотры подряд (страница, которая обновляется сама) записываются одной строкой
              со счётчиком ×N.
            </p>
          )}
        </PageSurface>
      )}

      {items.length > 0 && pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Страницы журнала">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => handlePageChange(page + 1)}
          >
            Далее
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      )}

      <LogDetailsSheet
        logId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
        onOpenDevice={handleOpenDevice}
        onOpenLog={setSelectedLogId}
      />
      <DeviceSheet
        deviceKey={selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onOpenDevice={setSelectedDevice}
      />
    </PageFrame>
  )
}

export default function AdminLogsPage() {
  return (
    <Suspense fallback={<LogsSkeleton />}>
      <AdminLogsContent />
    </Suspense>
  )
}
