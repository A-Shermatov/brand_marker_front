"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BookOpenIcon as BookOpen, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
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
import { useAdminContractsQuery } from "@/hooks/api/use-admin-contracts-query"
import type { AdminContractView } from "@/lib/api/admin"
import { contractStatusMeta } from "@/lib/contract-display"
import type { ContractStatus } from "@/types"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const viewFilters: Array<{ value: AdminContractView; label: string }> = [
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
  { value: "disputed", label: "Споры" },
]

const isViewFilter = (value: string | null): value is AdminContractView =>
  viewFilters.some((filter) => filter.value === value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))


const ContractsSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка контрактов">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminContractsContent({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = isViewFilter(searchParams.get("view"))
    ? (searchParams.get("view") as AdminContractView)
    : "active"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const contractsQuery = useAdminContractsQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    view,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || (key === "view" && value === "active")) {
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
    if (!contractsQuery.data || page <= contractsQuery.data.pages) return
    replaceSearchParams({ page: String(contractsQuery.data.pages) })
  }, [page, replaceSearchParams, contractsQuery.data])

  if (contractsQuery.isLoading) return <ContractsSkeleton />

  if (contractsQuery.isError || !contractsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <BookOpen className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить контракты</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => contractsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total, view_counts: viewCounts } = contractsQuery.data
  const hasFilters = view !== "active" || Boolean(query)
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
        title="Контракты"
        description="Управление контрактами, escrow и спорами"
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
              placeholder="Название, RFQ или ID"
              className="pl-11"
              aria-label="Поиск по контрактам"
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
            ariaLabel="Состояние сделок"
          />
        </div>
      </PageSurface>

      <PageSurface>
        {items.length === 0 ? (
          <PageEmptyState
            title="Контракты не найдены"
            description={hasFilters
                ? "Измените фильтр или поисковый запрос."
                : "Активных контрактов пока нет."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Контракт</TableHead>
                <TableHead>Стороны</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>На гарантии</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((contract) => {
                const statusMeta = contractStatusMeta[contract.status as ContractStatus] || {
                  label: contract.status,
                  className: "bg-muted text-muted-foreground",
                }
                const buyerName =
                  contract.buyer?.company_title ||
                  contract.buyer?.name ||
                  contract.buyer?.display_name ||
                  "—"
                const supplierName =
                  contract.supplier?.company_title ||
                  contract.supplier?.name ||
                  contract.supplier?.display_name ||
                  "—"
                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Link
                        href={`/admin/contracts/${contract.id}`}
                        className="font-semibold text-foreground hover:text-primary"
                      >
                        {contract.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        #{contract.id} · RFQ {contract.rfq_id.slice(0, 8)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{buyerName}</p>
                      <p className="text-xs text-muted-foreground">{supplierName}</p>
                    </TableCell>
                    <TableCell>
                      {formatMoney(contract.agreed_amount, contract.currency)}
                    </TableCell>
                    <TableCell>
                      {formatMoney(contract.escrow_held, contract.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusMeta.className}>
                        {statusMeta.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(contract.created_at)}
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

