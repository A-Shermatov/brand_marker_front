"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
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
import { useAdminReportsQuery } from "@/hooks/api/use-admin-reports-query"
import type { AdminReportView } from "@/lib/api/admin"
import {
  adminLabel,
  adminReportReasonLabels,
  adminReportTargetLabels,
} from "@/lib/admin-display"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const viewFilters: Array<{ value: AdminReportView; label: string }> = [
  { value: "all", label: "Все" },
  { value: "spam", label: "Спам" },
  { value: "fraud", label: "Мошенничество" },
  { value: "counterfeit", label: "Подделка" },
  { value: "abuse", label: "Оскорбления" },
  { value: "other", label: "Другое" },
]

const isViewFilter = (value: string | null): value is AdminReportView =>
  viewFilters.some((filter) => filter.value === value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const ReportsSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка жалоб">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminReportsContent({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = isViewFilter(searchParams.get("view"))
    ? (searchParams.get("view") as AdminReportView)
    : "all"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const reportsQuery = useAdminReportsQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    view,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || (key === "view" && value === "all")) {
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
    if (!reportsQuery.data || page <= reportsQuery.data.pages) return
    replaceSearchParams({ page: String(reportsQuery.data.pages) })
  }, [page, replaceSearchParams, reportsQuery.data])

  if (reportsQuery.isLoading) return <ReportsSkeleton />

  if (reportsQuery.isError || !reportsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <ShieldCheck className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить жалобы</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => reportsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total, view_counts: viewCounts } = reportsQuery.data
  const hasFilters = view !== "all" || Boolean(query)
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
        title="Жалобы"
        description="Единый список жалоб на каталог, заявки и предложения"
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
              placeholder="Объект, email, детали жалобы"
              className="pl-11"
              aria-label="Поиск по жалобам"
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

        ariaLabel="Типы жалоб"
            className="w-full max-w-full border-0 bg-transparent p-0"
          />
        </div>
      </PageSurface>

      <PageSurface>
        {items.length === 0 ? (
          <PageEmptyState
            title="Жалобы не найдены"
            description={hasFilters
                ? "Измените тип или поисковый запрос."
                : "Открытых жалоб пока нет."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Объект</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Заявитель</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((report) => (
                <TableRow key={`${report.target_type}-${report.id}`}>
                  <TableCell>
                    <Link
                      href={`/admin/moderation/${report.target_type}/${report.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {report.reported_object.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {adminLabel(adminReportTargetLabels, report.target_type)} · #
                      {report.id}
                    </p>
                    {report.details_preview && (
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {report.details_preview}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {adminLabel(adminReportTargetLabels, report.target_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{report.reporter.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.reporter.email}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {adminLabel(adminReportReasonLabels, report.reason)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(report.created_at)}
                  </TableCell>
                </TableRow>
              ))}
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

