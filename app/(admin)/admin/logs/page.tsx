"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowsCounterClockwiseIcon as RefreshCcw, ScrollIcon as ScrollText, MagnifyingGlassIcon as Search, XIcon as X } from "@phosphor-icons/react/dist/ssr"
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
} from "@/lib/admin-log-labels"
import type {
  AdminLogAudience,
  AdminLogEventCategory,
  AdminLogEventItem,
  AdminLogItem,
  AdminLogKind,
  AdminLogPeriod,
  AdminLogSection,
  AdminLogSource,
  AdminLogStatus,
  AnyAdminLogItem,
} from "@/lib/api/admin"
import { cn } from "@/lib/utils"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const ALL_VALUE = "all"
const DEFAULT_PERIOD: AdminLogPeriod = "7d"
const SEARCH_DEBOUNCE_MS = 350

const AUDIENCES = Object.keys(LOG_AUDIENCE_LABELS) as AdminLogAudience[]
const KINDS = Object.keys(LOG_KIND_LABELS) as AdminLogKind[]
const SECTIONS = Object.keys(LOG_SECTION_LABELS) as AdminLogSection[]
const STATUSES = Object.keys(LOG_STATUS_META) as AdminLogStatus[]
const PERIODS = Object.keys(LOG_PERIOD_LABELS) as AdminLogPeriod[]
const SOURCES = Object.keys(LOG_SOURCE_LABELS) as AdminLogSource[]
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
const DEFAULT_SOURCE: AdminLogSource = "events"

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
          {log.source === "http" ? "Гость" : "Система"}
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

type RowProps<T> = { log: T; onSelect: (logId: number) => void }

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

const HttpLogRow = ({ log, onSelect }: RowProps<AdminLogItem>) => (
  <TableRow
    {...rowA11yProps(
      log.id,
      `${LOG_KIND_LABELS[log.kind]}, ${LOG_SECTION_LABELS[log.section]}`,
      onSelect,
    )}
  >
    <TableCell className="whitespace-nowrap px-5 py-3 text-muted-foreground">
      {formatLogDateTime(log.created_at)}
    </TableCell>
    <TableCell>
      <LogActor log={log} />
    </TableCell>
    <TableCell>
      <p className="font-medium text-foreground">{LOG_KIND_LABELS[log.kind]}</p>
      <p className="text-xs text-muted-foreground">{LOG_SECTION_LABELS[log.section]}</p>
    </TableCell>
    <TableCell className="text-muted-foreground">
      {log.object_id ? `№ ${log.object_id}` : "—"}
    </TableCell>
    <TableCell className="px-5">
      <LogStatusBadge status={log.status} />
    </TableCell>
  </TableRow>
)

const EventLogRow = ({ log, onSelect }: RowProps<AdminLogEventItem>) => {
  const label = getLogEventLabel(log.action)
  return (
    <TableRow {...rowA11yProps(log.id, label, onSelect)}>
      <TableCell className="whitespace-nowrap px-5 py-3 align-top text-muted-foreground">
        {formatLogDateTime(log.created_at)}
      </TableCell>
      <TableCell className="align-top">
        <LogActor log={log} />
      </TableCell>
      <TableCell className="align-top">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{getLogEventCategoryLabel(log.category)}</p>
      </TableCell>
      <TableCell className="align-top text-muted-foreground">
        <LogResourceLink resourceType={log.resource_type} resourceId={log.resource_id} />
      </TableCell>
      <TableCell className="px-5 align-top">
        <LogChangesSummary details={log.details} />
      </TableCell>
    </TableRow>
  )
}

const STATUS_LABELS = Object.fromEntries(
  STATUSES.map((status) => [status, LOG_STATUS_META[status].label]),
) as Record<AdminLogStatus, string>

const AdminLogsContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const source = pickOption(searchParams.get("view"), SOURCES) ?? DEFAULT_SOURCE
  const isEvents = source === "events"
  const audience = pickOption(searchParams.get("audience"), AUDIENCES) ?? "users"
  const category = pickOption(searchParams.get("category"), CATEGORIES)
  const resourceType = pickOption(searchParams.get("resource_type"), RESOURCE_TYPES)
  const resourceId = searchParams.get("resource_id") ?? ""
  const action = searchParams.get("action") ?? ""
  const userId = Number(searchParams.get("user_id")) || null
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
    if (!logsQuery.data || page <= logsQuery.data.pages) return
    replaceSearchParams({ page: String(logsQuery.data.pages) })
  }, [logsQuery.data, page, replaceSearchParams])

  const handleFilterChange = (key: string) => (value: string | null) => {
    replaceSearchParams({ [key]: value, page: null })
  }

  const handlePeriodChange = (value: AdminLogPeriod | null) => {
    replaceSearchParams({
      period: !value || value === DEFAULT_PERIOD ? null : value,
      page: null,
    })
  }

  const handleSourceChange = (value: AdminLogSource) => {
    replaceSearchParams({ view: value === DEFAULT_SOURCE ? null : value, page: null })
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
      period: null,
      query: null,
      page: null,
    })
  }

  const handlePageChange = (targetPage: number) => {
    replaceSearchParams({ page: targetPage <= 1 ? null : String(targetPage) })
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
  const hasFilters = Boolean(
    (isEvents ? category || action : kind || section || status) ||
      resourceType ||
      resourceId ||
      userId ||
      query ||
      period !== DEFAULT_PERIOD,
  )

  return (
    <PageFrame>
      <PageHeader
        title="Журнал действий"
        description={
          isEvents
            ? "Значимые события: кто и что изменил в компаниях, заявках, контрактах и платежах"
            : "Что делали пользователи и сотрудники на платформе и чем это закончилось"
        }
        actions={
          <p className="text-sm text-muted-foreground">
            Найдено <strong className="ml-1 text-foreground">{total}</strong>
          </p>
        }
      />

      <PageSurface aria-label="Фильтры журнала">
        <div className="flex flex-col gap-2 border-b border-border p-3 lg:flex-row lg:items-center">
          <SegmentedControl
            value={source}
            options={SOURCES.map((value) => ({ value, label: LOG_SOURCE_LABELS[value] }))}
            onChange={handleSourceChange}
            ariaLabel="Что показывать"
            className="w-full max-w-full border-0 bg-transparent p-0 lg:w-auto"
          />
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
        {isEvents ? (
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
        ) : (
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
        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={isEvents ? "Имя, email или код действия" : "Имя или email"}
              maxLength={255}
              className="pl-11"
              aria-label="Поиск по имени или email"
            />
          </div>
          {userId && (
            <Badge variant="secondary" className="h-9 gap-1.5 px-3">
              Пользователь № {userId}
              <button
                type="button"
                aria-label="Убрать фильтр по пользователю"
                onClick={() => replaceSearchParams({ user_id: null, page: null })}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </Badge>
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
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="px-5">Время</TableHead>
                  <TableHead>Кто</TableHead>
                  <TableHead>{isEvents ? "Событие" : "Действие"}</TableHead>
                  <TableHead>Объект</TableHead>
                  <TableHead className="px-5">{isEvents ? "Изменения" : "Результат"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((log) =>
                  log.source === "event" ? (
                    <EventLogRow key={log.id} log={log} onSelect={setSelectedLogId} />
                  ) : (
                    <HttpLogRow key={log.id} log={log} onSelect={setSelectedLogId} />
                  ),
                )}
              </TableBody>
            </Table>
          </div>
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

      <LogDetailsSheet logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
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
