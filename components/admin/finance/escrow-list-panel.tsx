"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import { AdminLink } from "@/components/admin/admin-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, CardholderIcon as WalletCards } from "@phosphor-icons/react/dist/ssr"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminEscrowQuery } from "@/hooks/api/use-admin-escrow-query"
import type { AdminEscrowCurrencySummary, AdminEscrowView } from "@/lib/api/admin"
import { contractStatusMeta } from "@/lib/contract-display"
import { formatCurrency } from "@/lib/format"
import type { ContractStatus } from "@/types"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"


const viewOptions: Array<{ value: AdminEscrowView; label: string }> = [
  { value: "held", label: "Удерживается" },
  { value: "disputed", label: "В споре" },
  { value: "awaiting", label: "Ожидает оплаты" },
]

const summaryCards: Array<{
  key: keyof Pick<AdminEscrowCurrencySummary, "held" | "disputed" | "awaiting" | "expected_commission">
  label: string
  hint: string
}> = [
  { key: "held", label: "Удерживается", hint: "Оплачено покупателем, ждёт приёмки" },
  { key: "disputed", label: "Заморожено спором", hint: "Решение принимает администратор" },
  { key: "awaiting", label: "Ожидает оплаты", hint: "Этапы, выставленные к оплате" },
  { key: "expected_commission", label: "Ожидаемая комиссия", hint: "С удерживаемых и спорных средств" },
]

const isEscrowView = (value: string | null): value is AdminEscrowView =>
  viewOptions.some((option) => option.value === value)

const EscrowSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка денег на гарантии">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => (
        <div key={card.key} className="h-28 rounded-xl bg-muted" />
      ))}
    </div>
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const ContractStatusPill = ({ status }: { status: string }) => {
  const meta = contractStatusMeta[status as ContractStatus] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

const SummaryCards = ({ summary }: { summary: AdminEscrowCurrencySummary[] }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {summaryCards.map((card) => (
      <PageSurface key={card.key} className="p-5">
        <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
        {summary.length ? (
          <div className="mt-2 space-y-0.5">
            {summary.map((row) => (
              <p key={row.currency} className="text-xl font-bold tracking-tight text-foreground">
                {formatCurrency(row[card.key], row.currency)}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xl font-bold tracking-tight text-foreground">{formatCurrency(0)}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
      </PageSurface>
    ))}
  </div>
)

export function AdminEscrowContent({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const viewParam = searchParams.get("view")
  const view: AdminEscrowView = isEscrowView(viewParam) ? viewParam : "held"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const escrowQuery = useAdminEscrowQuery({ page, pageSize: DEFAULT_PAGE_SIZE, view, query })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || (key === "view" && value === "held")) nextParams.delete(key)
        else nextParams.set(key, value)
      })
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
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
    if (!escrowQuery.data || page <= escrowQuery.data.pages) return
    replaceSearchParams({ page: String(escrowQuery.data.pages) })
  }, [escrowQuery.data, page, replaceSearchParams])

  if (escrowQuery.isLoading) return <EscrowSkeleton />

  if (escrowQuery.isError || !escrowQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <WalletCards className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить деньги на гарантии</h1>
          <Button type="button" className="mt-5" onClick={() => escrowQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { summary, view_counts: viewCounts, items, pages, total } = escrowQuery.data

  return (
    <Frame>
      {!embedded && (
        <PageHeader
        title="На гарантии"
        description="Средства покупателей, удерживаемые платформой до приёмки работ"
      />
      )}

      <SummaryCards summary={summary} />

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
              placeholder="Название договора или #ID"
              className="pl-11"
              aria-label="Поиск сделок с деньгами на гарантии"
            />
          </div>
        </div>
        <div className="p-3">
          <SegmentedControl
            value={view}
            options={viewOptions.map((option) => ({ ...option, count: viewCounts[option.value] }))}
            onChange={(next) => replaceSearchParams({ view: next, page: null })}
            ariaLabel="Состояние денег на гарантии"
            className="w-full max-w-full border-0 bg-transparent p-0"
          />
        </div>
      </PageSurface>

      {items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title="Договоров нет"
            description={query ? "Измените поисковый запрос." : "В этом разделе сейчас нет средств."}
          />
        </PageSurface>
      ) : (
        <PageSurface className="relative">
          {escrowQuery.isFetching && (
            <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary" />
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Договор</TableHead>
                <TableHead>Стороны</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">В разделе</TableHead>
                <TableHead className="text-right">Комиссия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <AdminLink
                      href={`/admin/contracts/${contract.id}`}
                      className="block max-w-72 hover:opacity-75"
                      fallbackClassName="block max-w-72"
                    >
                      <p className="truncate font-bold text-foreground">{contract.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{contract.id} · {formatCurrency(contract.agreed_amount, contract.currency)}
                      </p>
                    </AdminLink>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{contract.buyer_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{contract.supplier_name || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <ContractStatusPill status={contract.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-bold">{formatCurrency(contract.amount, contract.currency)}</p>
                    <p className="text-xs text-muted-foreground">этапов: {contract.milestones_count}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(contract.commission, contract.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PageSurface>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Страницы списка">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => replaceSearchParams({ page: String(page - 1) })}
          >
            <ChevronLeft aria-hidden="true" />
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница <strong className="text-foreground">{page}</strong> из {pages} · всего {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => replaceSearchParams({ page: String(page + 1) })}
          >
            Вперёд
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      )}
    </Frame>
  )
}

