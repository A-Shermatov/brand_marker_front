"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BuildingsIcon as Building2, BankIcon as Landmark, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, WalletIcon as Wallet } from "@phosphor-icons/react/dist/ssr"
import { AdminLink } from "@/components/admin/admin-link"
import { ListPagination } from "@/components/list-pagination"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
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
import { useAdminMerchantBalancesQuery } from "@/hooks/api/use-admin-merchant-balances-query"
import type { AdminMerchantCard, AdminMerchantTotals } from "@/lib/api/admin"
import { formatCurrency, formatCurrencyExact } from "@/lib/format"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const MerchantSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка балансов">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="h-40 rounded-xl bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
      <div className="h-40 rounded-xl bg-muted" />
    </div>
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const Money = ({ value, currency }: { value: number; currency: string }) => (
  <span title={formatCurrencyExact(value, currency)}>{formatCurrency(value, currency)}</span>
)

const sourceLabel = (source: AdminMerchantCard["source"]) =>
  source === "subscriptions" ? "Подписки" : "Сделки"

const MerchantCard = ({ merchant }: { merchant: AdminMerchantCard }) => (
  <PageSurface className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{merchant.label}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {merchant.configured
            ? `Терминал ${merchant.terminal_masked}`
            : "Терминал не настроен"}
        </p>
        {merchant.hint && (
          <p className="mt-2 text-xs leading-snug text-muted-foreground">{merchant.hint}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge variant="outline">{sourceLabel(merchant.source)}</Badge>
        <Badge variant="outline" className={merchant.configured ? "" : "text-amber-700"}>
          {merchant.configured ? "Настроен" : "Нет ID"}
        </Badge>
      </div>
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Удерживается</dt>
        <dd className="mt-0.5 text-lg font-bold">
          <Money value={merchant.held} currency={merchant.currency} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Поступило</dt>
        <dd className="mt-0.5 text-lg font-bold">
          <Money value={merchant.released} currency={merchant.currency} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Возвращено</dt>
        <dd className="mt-0.5 font-semibold">
          <Money value={merchant.refunded} currency={merchant.currency} />
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Нетто</dt>
        <dd className="mt-0.5 font-semibold">
          <Money value={merchant.net_released} currency={merchant.currency} />
        </dd>
      </div>
    </dl>
  </PageSurface>
)

const TotalsRow = ({ totals }: { totals: AdminMerchantTotals }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
    {[
      { label: "Всего в escrow", value: totals.held, Icon: Landmark },
      { label: "Поступило всего", value: totals.released, Icon: Building2 },
      {
        label: "Комиссия со сделок",
        value: totals.deals_commission_released,
        Icon: Building2,
      },
      { label: "Подписки", value: totals.subscriptions_released, Icon: Wallet },
      { label: "Доступно исполнителям", value: totals.supplier_available, Icon: Wallet },
      { label: "Выведено", value: totals.withdrawn, Icon: Wallet },
    ].map((item) => (
      <PageSurface key={item.label} className="flex items-center gap-3 p-4">
        <item.Icon className="size-5 text-muted-foreground" aria-hidden />
        <div>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-base font-bold">
            <Money value={item.value} currency={totals.currency} />
          </p>
        </div>
      </PageSurface>
    ))}
  </div>
)

export function AdminMerchantBalancesContent({
  embedded = true,
}: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)
  const balancesQuery = useAdminMerchantBalancesQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) nextParams.delete(key)
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
    const pages = balancesQuery.data?.suppliers.total_pages ?? 0
    if (!pages || page <= pages) return
    replaceSearchParams({ page: String(pages) })
  }, [balancesQuery.data, page, replaceSearchParams])

  if (balancesQuery.isLoading) return <MerchantSkeleton />

  if (balancesQuery.isError || !balancesQuery.data) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Wallet className="mx-auto text-destructive" aria-hidden />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить балансы</h1>
          <Button type="button" className="mt-5" onClick={() => balancesQuery.refetch()}>
            <RefreshCcw aria-hidden />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const data = balancesQuery.data
  const { items, total_pages: totalPages, total } = data.suppliers

  return (
    <Frame>
      {!embedded && (
        <PageHeader
          title="Балансы мерчантов"
          description="Удержание и выплаты по терминалам Alif Marketplace"
        />
      )}

      <PageSurface className="border-amber-200/80 bg-amber-50/50 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
        {data.note}
        {!data.marketplace_enabled && (
          <span className="mt-1 block">
            Marketplace выключен: не заданы оба ID мерчантов в настройках шлюза.
          </span>
        )}
      </PageSurface>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.merchants.map((merchant) => (
          <MerchantCard key={merchant.role} merchant={merchant} />
        ))}
      </div>

      <TotalsRow totals={data.totals} />

      <PageSurface>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Исполнитель, компания, email или #ID"
              className="pl-11"
              aria-label="Поиск балансов исполнителей"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <PageEmptyState
            title="Исполнителей нет"
            description={
              query ? "Измените поисковый запрос." : "Пока нет поставщиков с актёром supplier."
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Исполнитель</TableHead>
                  <TableHead className="text-right">Доступно</TableHead>
                  <TableHead className="text-right">В escrow</TableHead>
                  <TableHead className="text-right">Выплачено</TableHead>
                  <TableHead className="text-right">Выведено</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.actor_id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {row.company_id ? (
                            <AdminLink href={`/admin/companies/${row.company_id}`}>
                              {row.company_title || row.display_name || `Актёр #${row.actor_id}`}
                            </AdminLink>
                          ) : (
                            row.display_name || `Актёр #${row.actor_id}`
                          )}
                        </p>
                        {row.owner_email && (
                          <p className="truncate text-xs text-muted-foreground">{row.owner_email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Money value={row.available} currency={row.currency} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={row.pending} currency={row.currency} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={row.released} currency={row.currency} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={row.withdrawn} currency={row.currency} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t border-border p-3">
              <ListPagination
                page={page}
                totalPages={totalPages}
                onPageChange={(next) =>
                  replaceSearchParams({ page: next > 1 ? String(next) : null })
                }
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">Всего: {total}</p>
            </div>
          </>
        )}
      </PageSurface>
    </Frame>
  )
}
