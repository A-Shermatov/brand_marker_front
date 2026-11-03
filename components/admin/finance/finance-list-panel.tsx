"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, CurrencyCircleDollarIcon as CircleDollarSign, DownloadSimpleIcon as Download, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminFinanceQuery } from "@/hooks/api/use-admin-finance-query"
import type { AdminFinanceView } from "@/lib/api/admin"
import { adminApi } from "@/lib/api/admin"
import { getApiErrorMessage } from "@/lib/api/client"
import {
  adminFinanceGatewayLabels,
  adminFinanceStatusMeta,
  adminFinanceTypeLabels,
  adminLabel,
} from "@/lib/admin-display"
import { AdminBillingSummaryPanel } from "@/components/admin/finance/billing-summary-panel"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const viewFilters: Array<{ value: AdminFinanceView; label: string }> = [
  { value: "platform_revenue", label: "Выручка" },
  { value: "subscriptions", label: "Подписки" },
  { value: "commission", label: "Комиссия" },
  { value: "refunds", label: "Возвраты" },
  { value: "payouts", label: "Выплаты" },
]

const isViewFilter = (value: string | null): value is AdminFinanceView =>
  viewFilters.some((filter) => filter.value === value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))


const FinanceSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка финансов">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function AdminFinanceContent({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const rawView = searchParams.get("view")
  const isBilling = rawView === "billing"
  const view: AdminFinanceView = isBilling
    ? "subscriptions"
    : isViewFilter(rawView)
      ? rawView
      : "platform_revenue"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const [exporting, setExporting] = useState(false)
  const financeQuery = useAdminFinanceQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    view,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || (key === "view" && value === "platform_revenue")) {
          nextParams.delete(key)
        } else {
          nextParams.set(key, value)
        }
      })
      // Leaving the billing hub: drop the billing alias so ledger filters apply.
      if (updates.view && updates.view !== "billing" && updates.view !== "subscriptions") {
        if (nextParams.get("view") === "billing") nextParams.delete("view")
      }
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    if (searchInput === query) return
    const timeout = window.setTimeout(() => {
      replaceSearchParams({ query: searchInput.trim() || null, page: null })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [query, replaceSearchParams, searchInput])

  useEffect(() => {
    if (!financeQuery.data || page <= financeQuery.data.pages) return
    replaceSearchParams({ page: String(financeQuery.data.pages) })
  }, [page, replaceSearchParams, financeQuery.data])

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await adminApi.exportFinanceCsv({ view, query })
      downloadBlob(result.blob, result.filename)
      toast.success("Экспорт готов")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Не удалось экспортировать"))
    } finally {
      setExporting(false)
    }
  }

  if (financeQuery.isLoading) return <FinanceSkeleton />

  if (financeQuery.isError || !financeQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <CircleDollarSign className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить финансы</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => financeQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total, view_counts: viewCounts } = financeQuery.data
  const hasFilters = view !== "platform_revenue" || Boolean(query)
  const getPageHref = (targetPage: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    if (targetPage <= 1) nextParams.delete("page")
    else nextParams.set("page", String(targetPage))
    const nextQuery = nextParams.toString()
    return nextQuery ? `${pathname}?${nextQuery}` : pathname
  }

  return (
    <Frame>
      {!embedded && (
        <PageHeader
          title={isBilling ? "Подписки и доходы" : "Финансы"}
          description={
            isBilling
              ? "Тарифы поставщиков, услуги покупателям и комиссия площадки"
              : "Выручка, подписки, комиссии, возвраты и выплаты"
          }
          actions={
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Найдено <strong className="ml-1 text-foreground">{total}</strong>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download aria-hidden="true" />
                Экспорт
              </Button>
            </div>
          }
        />
      )}

      {isBilling ? <AdminBillingSummaryPanel /> : null}

      <PageSurface>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Название, ID или external id"
              className="pl-11"
              aria-label="Поиск по платежам"
            />
          </div>
        </div>
        {!isBilling ? (
          <div className="p-3">
            <SegmentedControl
              value={view}
              options={viewFilters.map((filter) => ({
                ...filter,
                count: viewCounts[filter.value],
              }))}
              onChange={(next) => replaceSearchParams({ view: next, page: null })}
              className="w-full max-w-full border-0 bg-transparent p-0"
            />
          </div>
        ) : (
          <div className="border-b border-border px-4 py-3 text-[14px] text-mute">
            Реестр платежей по подпискам поставщиков
          </div>
        )}
      </PageSurface>

      <PageSurface>
        {items.length === 0 ? (
          <PageEmptyState
            title="Платежи не найдены"
            description={hasFilters
                ? "Измените фильтр или поисковый запрос."
                : "Записей выручки пока нет."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Транзакция</TableHead>
                <TableHead>Шлюз</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Комиссия</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((payment) => {
                const statusMeta = adminFinanceStatusMeta[payment.status] || {
                  label: payment.status,
                  className: "bg-muted text-muted-foreground",
                }
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link
                        href={`/admin/finance/${payment.id}`}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {payment.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{payment.id} ·{" "}
                        {adminLabel(adminFinanceTypeLabels, payment.type)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {adminLabel(adminFinanceGatewayLabels, payment.gateway)}
                    </TableCell>
                    <TableCell>
                      {formatMoney(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      {formatMoney(payment.commission, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Страница {page} из {pages}
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link
                  href={getPageHref(page - 1)}
                  aria-label="Предыдущая страница"
                  tabIndex={page <= 1 ? -1 : 0}
                >
                  <ChevronLeft aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" disabled={page >= pages}>
                <Link
                  href={getPageHref(page + 1)}
                  aria-label="Следующая страница"
                  tabIndex={page >= pages ? -1 : 0}
                >
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </PageSurface>
    </Frame>
  )
}

