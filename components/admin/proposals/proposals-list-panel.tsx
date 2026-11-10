"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, FileArrowUpIcon as FileInput, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
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
import { useAdminProposalsQuery } from "@/hooks/api/use-admin-proposals-query"
import type { AdminProposalView } from "@/lib/api/admin"
import { proposalStatusMeta } from "@/lib/proposal-display"
import type { ProposalStatus } from "@/types"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const viewFilters: Array<{ value: AdminProposalView; label: string }> = [
  { value: "all", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "accepted", label: "Принятые" },
  { value: "rejected", label: "Отклонённые" },
  { value: "reported", label: "Жалобы" },
]

const isViewFilter = (value: string | null): value is AdminProposalView =>
  viewFilters.some((filter) => filter.value === value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))


const ProposalsSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка предложений">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminProposalsContent({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = isViewFilter(searchParams.get("view"))
    ? (searchParams.get("view") as AdminProposalView)
    : "all"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const proposalsQuery = useAdminProposalsQuery({
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
    if (!proposalsQuery.data || page <= proposalsQuery.data.pages) return
    replaceSearchParams({ page: String(proposalsQuery.data.pages) })
  }, [page, proposalsQuery.data, replaceSearchParams])

  if (proposalsQuery.isLoading) return <ProposalsSkeleton />

  if (proposalsQuery.isError || !proposalsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <FileInput className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить предложения</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => proposalsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total, view_counts: viewCounts } = proposalsQuery.data
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
        title="Предложения"
        description="Модерация ответов поставщиков на RFQ"
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
              placeholder="ID предложения, RFQ или текст"
              className="pl-11"
              aria-label="Поиск по предложениям"
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
          />
        </div>
      </PageSurface>

      {items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title={hasFilters ? "Предложения не найдены" : "Предложений пока нет"}
            description={hasFilters
              ? "Измените поисковый запрос или выбранный фильтр."
              : "Новые предложения появятся после откликов поставщиков."}
          />
        </PageSurface>
      ) : (
        <PageSurface>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Предложение</TableHead>
                <TableHead>Поставщик</TableHead>
                <TableHead>Покупатель</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Создано</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const statusMeta = proposalStatusMeta[item.status as ProposalStatus] || {
                  label: item.status,
                  className: "bg-muted text-muted-foreground",
                }
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/admin/proposals/${item.id}`}
                        className="block min-w-0 hover:text-primary"
                      >
                        <p className="truncate font-bold">
                          #{item.id} · {item.rfq_title || item.rfq_id.slice(0, 8)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.has_contract ? "Есть контракт" : "Без контракта"}
                          {item.open_reports_count > 0
                            ? ` · жалоб: ${item.open_reports_count}`
                            : ""}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.supplier?.company_title || item.supplier?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.buyer?.company_title || item.buyer?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatMoney(item.price, item.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Страница {page} из {pages}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                  <Link
                    href={getPageHref(page - 1)}
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : 0}
                    className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                  >
                    <ChevronLeft aria-hidden="true" />
                    Назад
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" disabled={page >= pages}>
                  <Link
                    href={getPageHref(page + 1)}
                    aria-disabled={page >= pages}
                    tabIndex={page >= pages ? -1 : 0}
                    className={page >= pages ? "pointer-events-none opacity-50" : undefined}
                  >
                    Далее
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </PageSurface>
      )}
    </Frame>
  )
}

