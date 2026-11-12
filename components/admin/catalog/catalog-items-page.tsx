"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { StackIcon as Boxes, CheckCircleIcon as CheckCircle2, EyeSlashIcon as EyeOff, PackageIcon as Package, ArrowsCounterClockwiseIcon as RefreshCcw, ArrowCounterClockwiseIcon as RotateCcw, MagnifyingGlassIcon as Search, TrashIcon as Trash2, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { AdminLink } from "@/components/admin/admin-link"
import { CatalogBulkActionDialog } from "@/components/admin/catalog/catalog-bulk-action-dialog"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { ListPagination } from "@/components/list-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useAdminCatalogItemsQuery } from "@/hooks/api/use-admin-catalog-query"
import { useAdminCategoriesQuery } from "@/hooks/api/use-admin-categories-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type {
  AdminCatalogBulkAction,
  AdminCatalogItemStatus,
  AdminCatalogItemsParams,
  AdminCatalogManageItem,
  AdminCatalogSort,
} from "@/lib/api/admin"
import { resolveFileUrl } from "@/lib/file-url"
import { formatCurrency } from "@/lib/format"
import { catalogItemTypeLabel, itemStatusMeta } from "@/lib/item-display"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

const ALL_VALUE = "all"

type StatusTab = AdminCatalogItemStatus | typeof ALL_VALUE

const statusTabs: Array<{ value: StatusTab; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "pending_review", label: "На модерации" },
  { value: "draft", label: "Черновики" },
  { value: "changes_requested", label: "Отклонённые" },
  { value: "hidden", label: "Скрытые" },
  { value: "archived", label: "Архив" },
  { value: "deleted", label: "Удалённые" },
]

const sortOptions: Array<{ value: string; label: string }> = [
  { value: "created_at:desc", label: "Сначала новые" },
  { value: "created_at:asc", label: "Сначала старые" },
  { value: "updated_at:desc", label: "Недавно изменённые" },
  { value: "price:asc", label: "Цена по возрастанию" },
  { value: "price:desc", label: "Цена по убыванию" },
  { value: "title:asc", label: "Название А–Я" },
  { value: "views:desc", label: "Больше просмотров" },
  { value: "reports:desc", label: "Больше жалоб" },
]

const SORT_KEYS: AdminCatalogSort[] = ["created_at", "updated_at", "price", "title", "views", "reports"]

const isStatusTab = (value: string | null): value is StatusTab =>
  statusTabs.some((tab) => tab.value === value)

const positiveInt = (value: string | null): number | undefined => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const nonNegativeNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—"

const formatPrice = (item: AdminCatalogManageItem) => {
  if (item.price == null) return "—"
  const amount = formatCurrency(item.price, item.currency || "TJS")
  if (item.pricing_type === "hourly") return `${amount}/час`
  if (item.pricing_type === "monthly") return `${amount}/мес`
  if (item.pricing_type === "tiered") return `от ${amount}`
  return amount
}

const statusBadge = (status: string) => {
  const meta = itemStatusMeta[status as AdminCatalogItemStatus] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  }
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  )
}

const ItemPreview = ({ item }: { item: AdminCatalogManageItem }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
      {item.preview_url && item.preview_url !== "#" ? (
        <Image
          src={resolveFileUrl(item.preview_url)}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="44px"
        />
      ) : (
        <Package size={16} aria-hidden="true" />
      )}
    </div>
    <div className="min-w-0">
      <p className="truncate font-bold text-foreground">{item.title}</p>
      <p className="truncate text-xs text-muted-foreground">ID {item.id}</p>
    </div>
  </div>
)

const SupplierCell = ({ item }: { item: AdminCatalogManageItem }) => {
  const owner = item.owner
  if (!owner) return <span className="text-muted-foreground">—</span>
  const label = owner.company_title || owner.name || owner.display_name
  const href = owner.company_id
    ? `/admin/companies/${owner.company_id}`
    : owner.user_id
      ? `/admin/users/${owner.user_id}`
      : null
  return (
    <div className="min-w-0">
      {href ? (
        <AdminLink href={href} className="block truncate font-medium hover:text-primary hover:underline">
          {label}
        </AdminLink>
      ) : (
        <p className="truncate font-medium">{label}</p>
      )}
      <p className="truncate text-xs text-muted-foreground">{owner.email || "Без email"}</p>
    </div>
  )
}

const FilterSelect = ({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-muted-foreground">
      {label}
    </label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

const useDebouncedParam = (
  value: string,
  apply: (next: string) => void,
) => {
  const [input, setInput] = useState(value)
  useEffect(() => {
    setInput(value)
  }, [value])
  useEffect(() => {
    if (input === value) return
    const timeout = window.setTimeout(() => apply(input), 350)
    return () => window.clearTimeout(timeout)
  }, [apply, input, value])
  return [input, setInput] as const
}

const ListSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка каталога">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-40 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminCatalogItemsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canUpdate = useAdminPermission("admin_catalog.update")
  const canDelete = useAdminPermission("admin_catalog.delete")
  const categoriesQuery = useAdminCategoriesQuery()

  const statusParam = searchParams.get("status")
  const status: StatusTab = isStatusTab(statusParam) ? statusParam : ALL_VALUE
  const typeParam = searchParams.get("type")
  const type = typeParam === "product" || typeParam === "service" ? typeParam : undefined
  const reportsParam = searchParams.get("has_reports")
  const hasReports = reportsParam === "true" ? true : reportsParam === "false" ? false : undefined
  const [sortKey, sortOrder] = (searchParams.get("sort") || "created_at:desc").split(":")
  const sort = SORT_KEYS.includes(sortKey as AdminCatalogSort)
    ? (sortKey as AdminCatalogSort)
    : "created_at"
  const order = sortOrder === "asc" ? "asc" : "desc"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const supplier = searchParams.get("supplier") ?? ""
  const companyId = positiveInt(searchParams.get("company_id"))
  const categoryId = positiveInt(searchParams.get("category_id"))
  const priceMin = nonNegativeNumber(searchParams.get("price_min"))
  const priceMax = nonNegativeNumber(searchParams.get("price_max"))

  const params: AdminCatalogItemsParams = {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    type,
    status: status === ALL_VALUE ? undefined : [status],
    companyId,
    categoryId,
    supplier,
    priceMin,
    priceMax,
    hasReports,
    query,
    sort,
    order,
  }
  const itemsQuery = useAdminCatalogItemsQuery(params)

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === ALL_VALUE) nextParams.delete(key)
        else nextParams.set(key, value)
      })
      if (resetPage && !("page" in updates)) nextParams.delete("page")
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
    },
    [pathname, router, searchParams],
  )

  const applyQuery = useCallback(
    (next: string) => replaceSearchParams({ query: next.trim() || null }),
    [replaceSearchParams],
  )
  const applySupplier = useCallback(
    (next: string) => replaceSearchParams({ supplier: next.trim() || null }),
    [replaceSearchParams],
  )
  const applyPriceMin = useCallback(
    (next: string) => replaceSearchParams({ price_min: next.trim() || null }),
    [replaceSearchParams],
  )
  const applyPriceMax = useCallback(
    (next: string) => replaceSearchParams({ price_max: next.trim() || null }),
    [replaceSearchParams],
  )
  const [searchInput, setSearchInput] = useDebouncedParam(query, applyQuery)
  const [supplierInput, setSupplierInput] = useDebouncedParam(supplier, applySupplier)
  const [priceMinInput, setPriceMinInput] = useDebouncedParam(
    searchParams.get("price_min") ?? "",
    applyPriceMin,
  )
  const [priceMaxInput, setPriceMaxInput] = useDebouncedParam(
    searchParams.get("price_max") ?? "",
    applyPriceMax,
  )

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkAction, setBulkAction] = useState<AdminCatalogBulkAction | null>(null)

  const filtersKey = searchParams.toString()
  useEffect(() => {
    setSelected(new Set())
  }, [filtersKey])

  useEffect(() => {
    if (!itemsQuery.data || page <= itemsQuery.data.pages) return
    replaceSearchParams({ page: String(itemsQuery.data.pages) }, false)
  }, [itemsQuery.data, page, replaceSearchParams])

  const categoryOptions = useMemo(() => {
    const categories = categoriesQuery.data?.items ?? []
    const byId = new Map(categories.map((category) => [category.id, category]))
    return [
      { value: ALL_VALUE, label: "Все категории" },
      ...categories
        .map((category) => {
          const parent = category.parent_id ? byId.get(category.parent_id) : undefined
          return {
            value: String(category.id),
            label: parent ? `${parent.name} / ${category.name}` : category.name,
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label, "ru")),
    ]
  }, [categoriesQuery.data])

  if (itemsQuery.isLoading) return <ListSkeleton />

  if (itemsQuery.isError || !itemsQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Boxes className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить каталог</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => itemsQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total, status_counts: statusCounts } = itemsQuery.data
  const pageIds = items.map((item) => item.id)
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id))
  const someSelected = pageIds.some((id) => selected.has(id))
  const selectedIds = Array.from(selected)
  const hasFilters =
    status !== ALL_VALUE ||
    Boolean(query || supplier || type || categoryId || companyId) ||
    priceMin != null ||
    priceMax != null ||
    hasReports != null

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  return (
    <PageFrame>
      <PageHeader
        title="Товары и услуги"
        description="Все позиции каталога платформы: поиск, фильтры, редактирование и модерация"
        actions={
          <p className="text-sm text-muted-foreground">
            Найдено <strong className="ml-1 text-foreground">{total}</strong>
          </p>
        }
      />

      <PageSurface>
        <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-2">
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
              placeholder="Название, описание или ID"
              className="pl-11"
              aria-label="Поиск по каталогу"
            />
          </div>
          <Input
            type="search"
            value={supplierInput}
            onChange={(event) => setSupplierInput(event.target.value)}
            placeholder="Поставщик: компания, имя или email"
            aria-label="Поиск по поставщику"
          />
        </div>
        <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-6">
          <FilterSelect
            id="catalog-type"
            label="Тип"
            value={type ?? ALL_VALUE}
            onChange={(next) => replaceSearchParams({ type: next })}
            options={[
              { value: ALL_VALUE, label: "Товары и услуги" },
              { value: "product", label: "Товары" },
              { value: "service", label: "Услуги" },
            ]}
          />
          <FilterSelect
            id="catalog-category"
            label="Категория"
            value={categoryId ? String(categoryId) : ALL_VALUE}
            onChange={(next) => replaceSearchParams({ category_id: next })}
            options={categoryOptions}
          />
          <FilterSelect
            id="catalog-reports"
            label="Жалобы"
            value={hasReports == null ? ALL_VALUE : String(hasReports)}
            onChange={(next) => replaceSearchParams({ has_reports: next })}
            options={[
              { value: ALL_VALUE, label: "Не важно" },
              { value: "true", label: "Есть открытые" },
              { value: "false", label: "Без жалоб" },
            ]}
          />
          <div className="space-y-1.5">
            <label htmlFor="catalog-price-min" className="text-xs font-semibold text-muted-foreground">
              Цена от
            </label>
            <Input
              id="catalog-price-min"
              type="number"
              min={0}
              inputMode="decimal"
              value={priceMinInput}
              onChange={(event) => setPriceMinInput(event.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="catalog-price-max" className="text-xs font-semibold text-muted-foreground">
              Цена до
            </label>
            <Input
              id="catalog-price-max"
              type="number"
              min={0}
              inputMode="decimal"
              value={priceMaxInput}
              onChange={(event) => setPriceMaxInput(event.target.value)}
              placeholder="∞"
            />
          </div>
          <FilterSelect
            id="catalog-sort"
            label="Сортировка"
            value={`${sort}:${order}`}
            onChange={(next) => replaceSearchParams({ sort: next === "created_at:desc" ? null : next })}
            options={sortOptions}
          />
        </div>
        {companyId && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Badge variant="outline" className="gap-1.5 py-1">
              Компания #{companyId}
              <button
                type="button"
                className="rounded-full hover:text-destructive"
                aria-label="Сбросить фильтр по компании"
                onClick={() => replaceSearchParams({ company_id: null })}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </Badge>
            <AdminLink
              href={`/admin/companies/${companyId}`}
              className="text-sm text-primary hover:underline"
            >
              Открыть компанию
            </AdminLink>
          </div>
        )}
        <div className="p-3">
          <SegmentedControl
            value={status}
            options={statusTabs.map((tab) => ({ ...tab, count: statusCounts[tab.value] }))}
            onChange={(next) => replaceSearchParams({ status: next })}
            ariaLabel="Статус позиции"
            className="w-full"
          />
        </div>
      </PageSurface>

      {(canUpdate || canDelete) && selectedIds.length > 0 && (
        <PageSurface className="sticky top-17 z-20 flex flex-wrap items-center gap-2 p-3">
          <p className="mr-2 text-sm font-semibold">Выбрано: {selectedIds.length}</p>
          {canUpdate && (
            <>
              <Button type="button" size="sm" onClick={() => setBulkAction("approve")}>
                <CheckCircle2 aria-hidden="true" />
                Одобрить
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setBulkAction("hide")}>
                <EyeOff aria-hidden="true" />
                Скрыть
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setBulkAction("restore")}>
                <RotateCcw aria-hidden="true" />
                Восстановить
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setBulkAction("delete")}
            >
              <Trash2 aria-hidden="true" />
              Удалить
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Снять выделение
          </Button>
        </PageSurface>
      )}

      {items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title={hasFilters ? "Позиции не найдены" : "Каталог пуст"}
            description={
              hasFilters
                ? "Измените поисковый запрос или фильтры."
                : "Позиции появятся, когда поставщики добавят товары или услуги."
            }
          />
        </PageSurface>
      ) : (
        <>
          <PageSurface className="relative hidden lg:block">
            {itemsQuery.isFetching && (
              <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary" />
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  {(canUpdate || canDelete) && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) => toggleAll(checked === true)}
                        aria-label="Выбрать все на странице"
                      />
                    </TableHead>
                  )}
                  <TableHead>Позиция</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Поставщик</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Жалобы</TableHead>
                  <TableHead>Создана / изменена</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} data-state={selected.has(item.id) ? "selected" : undefined}>
                    {(canUpdate || canDelete) && (
                      <TableCell>
                        <Checkbox
                          checked={selected.has(item.id)}
                          onCheckedChange={(checked) => toggleOne(item.id, checked === true)}
                          aria-label={`Выбрать «${item.title}»`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="max-w-72">
                      <Link href={`/admin/catalog/${item.id}`} className="block hover:opacity-75">
                        <ItemPreview item={item} />
                      </Link>
                    </TableCell>
                    <TableCell>{catalogItemTypeLabel[item.type]}</TableCell>
                    <TableCell className="max-w-56">
                      <SupplierCell item={item} />
                    </TableCell>
                    <TableCell className="max-w-44 truncate">{item.category_name || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatPrice(item)}</TableCell>
                    <TableCell>{statusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.open_reports_count > 0 ? (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive">
                          {item.open_reports_count}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {item.reports_count > 0 ? `0 / ${item.reports_count}` : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      <p>{formatDate(item.created_at)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.updated_at)}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PageSurface>

          <div className="grid gap-3 lg:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-4"
              >
                {(canUpdate || canDelete) && (
                  <Checkbox
                    className="mt-3"
                    checked={selected.has(item.id)}
                    onCheckedChange={(checked) => toggleOne(item.id, checked === true)}
                    aria-label={`Выбрать «${item.title}»`}
                  />
                )}
                <Link href={`/admin/catalog/${item.id}`} className="min-w-0 flex-1">
                  <ItemPreview item={item} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statusBadge(item.status)}
                    <Badge variant="outline">{catalogItemTypeLabel[item.type]}</Badge>
                    {item.open_reports_count > 0 && (
                      <Badge variant="outline">Жалоб: {item.open_reports_count}</Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {item.owner?.company_title || item.owner?.name || "Без владельца"} ·{" "}
                    {formatPrice(item)} · {formatDate(item.created_at)}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </>
      )}

      <ListPagination
        page={page}
        totalPages={pages}
        onPageChange={(next) => replaceSearchParams({ page: next > 1 ? String(next) : null }, false)}
      />

      <CatalogBulkActionDialog
        ids={selectedIds}
        action={bulkAction}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null)
        }}
        onDone={(failedIds) => setSelected(new Set(failedIds))}
      />
    </PageFrame>
  )
}
