"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, GavelIcon as Gavel, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
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
import { useAdminDisputesQuery } from "@/hooks/api/use-admin-disputes-query"
import type { AdminDisputeView } from "@/lib/api/admin"
import { adminDisputeStatusMeta } from "@/lib/admin-display"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const viewFilters: Array<{ value: AdminDisputeView; label: string }> = [
  { value: "open", label: "Открытые" },
  { value: "under_review", label: "На рассмотрении" },
  { value: "resolved", label: "Решённые" },
  { value: "appealed", label: "Апелляция" },
]

const isViewFilter = (value: string | null): value is AdminDisputeView =>
  viewFilters.some((filter) => filter.value === value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))


const DisputesSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка споров">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminDisputesContent({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = isViewFilter(searchParams.get("view"))
    ? (searchParams.get("view") as AdminDisputeView)
    : "open"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const disputesQuery = useAdminDisputesQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    view,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || (key === "view" && value === "open")) {
          nextParams.delete(key)
        } else {
          nextParams.set(key, value)
        }
      })
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
    if (!disputesQuery.data || page <= disputesQuery.data.pages) return
    replaceSearchParams({ page: String(disputesQuery.data.pages) })
  }, [page, replaceSearchParams, disputesQuery.data])

  if (disputesQuery.isLoading) return <DisputesSkeleton />

  if (disputesQuery.isError || !disputesQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Gavel className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить споры</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => disputesQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total, view_counts: viewCounts } = disputesQuery.data
  const hasFilters = view !== "open" || Boolean(query)
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
        title="Споры"
        description="Разрешение споров по контрактам и escrow"
        actions={<p className="text-sm text-muted-foreground">
          Найдено <strong className="ml-1 text-foreground">{total}</strong>
        </p>}
      />
      )}

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
              placeholder="Контракт, ID спора"
              className="pl-11"
              aria-label="Поиск по спорам"
            />
          </div>
        </div>
        <div className="p-3">
          <SegmentedControl
            value={view}
            options={viewFilters.map((filter) => ({
              ...filter,
              count: viewCounts[filter.value],
            }))}
            onChange={(next) => replaceSearchParams({ view: next, page: null })}
            className="w-full max-w-full border-0 bg-transparent p-0"
            ariaLabel="Состояние споров"
          />
        </div>
      </PageSurface>

      <PageSurface>
        {items.length === 0 ? (
          <PageEmptyState
            title="Споры не найдены"
            description={hasFilters
                ? "Измените фильтр или поисковый запрос."
                : "Открытых споров пока нет."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Спор</TableHead>
                <TableHead>Стороны</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((dispute) => {
                const statusMeta = adminDisputeStatusMeta[dispute.status] || {
                  label: dispute.status,
                  className: "bg-muted text-muted-foreground",
                }
                const buyerName =
                  dispute.buyer?.company_title ||
                  dispute.buyer?.name ||
                  dispute.buyer?.display_name ||
                  "—"
                const supplierName =
                  dispute.supplier?.company_title ||
                  dispute.supplier?.name ||
                  dispute.supplier?.display_name ||
                  "—"
                return (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <Link
                        href={`/admin/disputes/${dispute.id}`}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {dispute.contract_title || `Спор #${dispute.id}`}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Спор #{dispute.id} · контракт #{dispute.contract_id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{buyerName}</p>
                      <p className="text-xs text-muted-foreground">{supplierName}</p>
                    </TableCell>
                    <TableCell>
                      {formatMoney(dispute.contract_amount, dispute.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(dispute.created_at)}
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

