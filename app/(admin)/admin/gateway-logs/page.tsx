"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PlugIcon as Cable, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, DownloadSimpleIcon as Download, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import {
  formatGatewayDateTime,
  formatGatewayMoney,
  GATEWAY_DIRECTION_LABELS,
  GATEWAY_OPERATION_LABELS,
  GatewayLogDetailsSheet,
  GatewayStatusBadge,
  getGatewayOperationLabel,
} from "@/components/admin/gateway-logs/gateway-log-details-sheet"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
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
import { useAdminGatewayLogsQuery } from "@/hooks/api/use-admin-gateway-logs-query"
import { LOG_PERIOD_LABELS } from "@/lib/admin-log-labels"
import { adminApi, type AdminGatewayLogDirection, type AdminLogPeriod } from "@/lib/api/admin"
import { cn } from "@/lib/utils"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const ALL_VALUE = "all"
const DEFAULT_PERIOD: AdminLogPeriod = "7d"
const SEARCH_DEBOUNCE_MS = 350

const GATEWAY_LABELS: Record<string, string> = { alif: "Alif" }

const GATEWAYS = Object.keys(GATEWAY_LABELS)
const OPERATIONS = Object.keys(GATEWAY_OPERATION_LABELS)
const DIRECTIONS = Object.keys(GATEWAY_DIRECTION_LABELS) as AdminGatewayLogDirection[]
const PERIODS = Object.keys(LOG_PERIOD_LABELS) as AdminLogPeriod[]

const pickOption = <T extends string>(value: string | null, options: readonly T[]): T | null =>
  value && (options as readonly string[]).includes(value) ? (value as T) : null

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const GatewayLogsSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка логов банка">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

type FilterSelectProps<T extends string> = {
  id: string
  label: string
  value: T | null
  options: readonly T[]
  labels: Record<string, string>
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
            {labels[option] ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

const AdminGatewayLogsContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const gateway = pickOption(searchParams.get("gateway"), GATEWAYS)
  const operation = pickOption(searchParams.get("operation"), OPERATIONS)
  const direction = pickOption(searchParams.get("direction"), DIRECTIONS)
  const period = pickOption(searchParams.get("period"), PERIODS) ?? DEFAULT_PERIOD
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("q") ?? searchParams.get("order_id") ?? ""

  const [searchInput, setSearchInput] = useState(query)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  const filterParams = {
    orderId: "",
    gateway,
    operation,
    direction,
    period,
    query,
  }

  const logsQuery = useAdminGatewayLogsQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    ...filterParams,
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
      replaceSearchParams({ q: searchInput.trim() || null, page: null })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [query, replaceSearchParams, searchInput])

  useEffect(() => {
    setSearchInput(query)
  }, [query])

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

  const handleReset = () => {
    setSearchInput("")
    replaceSearchParams({
      gateway: null,
      operation: null,
      direction: null,
      period: null,
      q: null,
      order_id: null,
      page: null,
    })
  }

  const handlePageChange = (targetPage: number) => {
    replaceSearchParams({ page: targetPage <= 1 ? null : String(targetPage) })
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const payload = await adminApi.exportGatewayLogs(filterParams)
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
      downloadJson(`bank-logs-${stamp}.json`, payload)
      toast.success(
        payload.total > payload.items.length
          ? `Экспорт: ${payload.items.length} из ${payload.total} записей`
          : `Экспорт: ${payload.items.length} записей`,
      )
    } catch {
      toast.error("Не удалось выгрузить логи")
    } finally {
      setExporting(false)
    }
  }

  if (logsQuery.isLoading) return <GatewayLogsSkeleton />

  if (logsQuery.isError || !logsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Cable className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить логи банка</h1>
          <Button type="button" className="mt-5" onClick={() => logsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, total, pages } = logsQuery.data
  const hasFilters = Boolean(
    gateway || operation || direction || query || period !== DEFAULT_PERIOD,
  )

  return (
    <PageFrame>
      <PageHeader
        title="Логи банка"
        description="HTTP-обмен с платёжным шлюзом — для сверки с разработчиками банка"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Найдено <strong className="ml-1 text-foreground">{total}</strong>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting || total === 0}
              onClick={handleExport}
            >
              <Download aria-hidden="true" />
              {exporting ? "Выгрузка…" : "JSON для банка"}
            </Button>
          </div>
        }
      />

      <PageSurface aria-label="Фильтры логов банка">
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            id="gateway-log-gateway"
            label="Шлюз"
            value={gateway}
            options={GATEWAYS}
            labels={GATEWAY_LABELS}
            allLabel="Все шлюзы"
            onChange={handleFilterChange("gateway")}
          />
          <FilterSelect
            id="gateway-log-operation"
            label="Операция"
            value={operation}
            options={OPERATIONS}
            labels={GATEWAY_OPERATION_LABELS}
            allLabel="Все операции"
            onChange={handleFilterChange("operation")}
          />
          <FilterSelect
            id="gateway-log-direction"
            label="Направление"
            value={direction}
            options={DIRECTIONS}
            labels={GATEWAY_DIRECTION_LABELS}
            allLabel="Любое направление"
            onChange={handleFilterChange("direction")}
          />
          <FilterSelect
            id="gateway-log-period"
            label="Период"
            value={period}
            options={PERIODS}
            labels={LOG_PERIOD_LABELS}
            onChange={handlePeriodChange}
          />
        </div>
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
              placeholder="Заказ, ID банка, URL или ошибка…"
              maxLength={255}
              className="pl-11"
              aria-label="Поиск по заказу или ID банка"
            />
          </div>
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
            icon={<Cable aria-hidden="true" />}
            title="Записей не найдено"
            description={
              hasFilters
                ? "Измените фильтры или выберите больший период."
                : "Здесь появятся обращения к платёжному шлюзу."
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
                  <TableHead>Шлюз</TableHead>
                  <TableHead>Направление</TableHead>
                  <TableHead>Операция</TableHead>
                  <TableHead>Заказ</TableHead>
                  <TableHead>ID в банке</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="px-5">Ошибка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((log) => (
                  <TableRow
                    key={log.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`Подробности: ${getGatewayOperationLabel(log.operation)}, ${log.order_id ?? "без заказа"}`}
                    className="cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                    onClick={() => setSelectedLogId(log.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedLogId(log.id)
                      }
                    }}
                  >
                    <TableCell className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {formatGatewayDateTime(log.created_at)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {GATEWAY_LABELS[log.gateway] ?? log.gateway}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {GATEWAY_DIRECTION_LABELS[log.direction]}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {getGatewayOperationLabel(log.operation)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.order_id ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.external_transaction_id ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatGatewayMoney(log.amount, log.currency)}
                    </TableCell>
                    <TableCell>
                      <GatewayStatusBadge status={log.response_status} />
                    </TableCell>
                    <TableCell
                      className="max-w-64 truncate px-5 text-destructive"
                      title={log.error ?? undefined}
                    >
                      {log.error ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </PageSurface>
      )}

      {items.length > 0 && pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Страницы логов банка">
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

      <GatewayLogDetailsSheet logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
    </PageFrame>
  )
}

export default function AdminGatewayLogsPage() {
  return (
    <Suspense fallback={<GatewayLogsSkeleton />}>
      <AdminGatewayLogsContent />
    </Suspense>
  )
}
