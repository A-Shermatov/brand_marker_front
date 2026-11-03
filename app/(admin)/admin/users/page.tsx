"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProhibitIcon as Ban, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, DotsThreeIcon as MoreHorizontal, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
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
import { useAdminUsersQuery } from "@/hooks/api/use-admin-users-query"
import type {
  AdminUser,
  AdminUserRole,
  AdminUserStatus,
  AdminUserTabFilter,
} from "@/lib/api/admin"
import { cn } from "@/lib/utils"
import { PageEmptyState, PageFrame, PageHeader, PageSurface, SegmentedControl } from "@/components/layout"
import { Input } from "@/components/ui/input"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import { formatMoneyDisplay } from "@/lib/format"

const tabFilters: Array<{
  value: AdminUserTabFilter
  label: string
}> = [
  { value: "all", label: "Все" },
  { value: "buyer", label: "Покупатели" },
  { value: "supplier", label: "Поставщики" },
  { value: "blocked", label: "Заблокированные" },
]

const roleLabels: Record<AdminUserRole, string> = {
  buyer: "Покупатель",
  supplier: "Поставщик",
  both: "Покупатель и поставщик",
  admin: "Администратор",
  superadmin: "Суперадминистратор",
  moderator: "Модератор",
}

const statusMetadata: Record<
  AdminUserStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Активен",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  blocked: {
    label: "Заблокирован",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  pending: {
    label: "Ожидает активации",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
}

const isTabFilter = (value: string | null): value is AdminUserTabFilter =>
  value === "all" ||
  value === "buyer" ||
  value === "supplier" ||
  value === "blocked"

const formatRegistrationDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const getInitials = (user: AdminUser) => {
  const firstName = user.first_name.trim().charAt(0)
  const lastName = user.last_name.trim().charAt(0)
  return `${firstName}${lastName}`.toUpperCase() || user.email.charAt(0).toUpperCase()
}

const getPageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second)
}

const UserStatusBadge = ({
  status,
  bannedUntil,
}: {
  status: AdminUserStatus
  bannedUntil?: string | null
}) => {
  const metadata = statusMetadata[status]
  const untilLabel =
    status === "blocked" && bannedUntil
      ? ` до ${new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "short",
        }).format(new Date(bannedUntil))}`
      : status === "blocked"
        ? " · бессрочно"
        : ""
  return (
    <Badge variant="outline" className={metadata.className}>
      {metadata.label}
      {untilLabel}
    </Badge>
  )
}

const UsersSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка пользователей">
    <div className="space-y-2">
      <div className="h-8 w-56 rounded-lg bg-muted" />
      <div className="h-4 w-80 max-w-full rounded bg-muted" />
    </div>
    <div className="h-12 rounded-xl bg-muted" />
    <div className="h-80 rounded-xl border border-border bg-card" />
  </PageFrame>
)

const AdminUsersContent = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") ?? searchParams.get("status")
  const tab = isTabFilter(tabParam) ? tabParam : "all"
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)

  const status = tab === "blocked" ? "blocked" : "all"
  const roleSide = tab === "buyer" || tab === "supplier" ? tab : null

  const usersQuery = useAdminUsersQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
    roleSide,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || (key === "tab" && value === "all")) {
          nextParams.delete(key)
          return
        }
        nextParams.set(key, value)
      })
      nextParams.delete("status")
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (searchInput === query) return
    const timeout = window.setTimeout(() => {
      replaceSearchParams({
        query: searchInput.trim() || null,
        page: null,
      })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [query, replaceSearchParams, searchInput])

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  useEffect(() => {
    if (!usersQuery.data || page <= usersQuery.data.pages) return
    replaceSearchParams({ page: String(usersQuery.data.pages) })
  }, [page, replaceSearchParams, usersQuery.data])

  const handleTabChange = (nextTab: AdminUserTabFilter) => {
    replaceSearchParams({
      tab: nextTab,
      page: null,
    })
  }

  const getPageHref = (targetPage: number) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    if (targetPage <= 1) {
      nextParams.delete("page")
    } else {
      nextParams.set("page", String(targetPage))
    }
    const nextQuery = nextParams.toString()
    return nextQuery ? `${pathname}?${nextQuery}` : pathname
  }

  const pageNumbers = useMemo(
    () => getPageNumbers(page, usersQuery.data?.pages ?? 1),
    [page, usersQuery.data?.pages],
  )

  if (usersQuery.isLoading) {
    return <UsersSkeleton />
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Ban size={26} className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-foreground">
            Не удалось загрузить пользователей
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button
            type="button"
            onClick={() => usersQuery.refetch()}
            className="mt-5"
          >
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, total, pages } = usersQuery.data
  const tabCounts = usersQuery.data.tab_counts ?? {
    all: total,
    buyer: 0,
    supplier: 0,
    blocked: usersQuery.data.status_counts?.blocked ?? 0,
  }
  const hasFilters = Boolean(query || tab !== "all")

  return (
    <PageFrame>
      <PageHeader
        title="Пользователи"
        description="Нажмите на пользователя, чтобы увидеть всю историю"
        actions={
          <p className="text-sm text-muted-foreground">
            Найдено <strong className="ml-1 text-foreground">{total}</strong>
          </p>
        }
      />

      <PageSurface aria-label="Фильтры пользователей">
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
              placeholder="Имя, email, телефон или ID"
              className="pl-11"
              aria-label="Поиск пользователей"
            />
          </div>
        </div>
        <div className="p-3">
          <SegmentedControl
            value={tab}
            options={tabFilters.map((filter) => ({
              ...filter,
              count: tabCounts[filter.value],
            }))}
            onChange={handleTabChange}
            ariaLabel="Тип пользователей"
            className="w-full max-w-full border-0 p-0"
          />
        </div>
      </PageSurface>

      {items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title={hasFilters ? "Пользователи не найдены" : "Пользователей пока нет"}
            description={
              hasFilters
                ? "Измените поисковый запрос или выбранный фильтр."
                : "Новые учётные записи появятся здесь после регистрации."
            }
          />
          {hasFilters && (
            <div className="flex justify-center pb-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchInput("")
                  replaceSearchParams({ query: null, tab: null, page: null })
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          )}
        </PageSurface>
      ) : (
        <PageSurface
          className={cn(usersQuery.isFetching && "opacity-70")}
          aria-busy={usersQuery.isFetching}
        >
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="px-5">Пользователь</TableHead>
                  <TableHead>Компания</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Сделок · оборот</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="px-5 text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
                          {getInitials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="max-w-52 truncate font-bold text-foreground">
                            {`${user.first_name} ${user.last_name}`.trim() || "Без имени"}
                          </p>
                          <p className="text-xs text-muted-foreground">ID {user.id}</p>
                          <p className="mt-0.5 max-w-52 truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-48 truncate text-sm text-foreground">
                        {user.company_title || "Без компании"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabels[user.role]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      <span className="font-semibold text-foreground">
                        {user.contracts_count ?? 0}
                      </span>
                      <span className="mx-1 text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {formatMoneyDisplay(user.contracts_sum ?? 0, "TJS")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge
                        status={user.status}
                        bannedUntil={user.banned_until}
                      />
                    </TableCell>
                    <TableCell className="px-5 text-right">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sm font-semibold text-primary"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Открыть →
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {items.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="block space-y-3 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-primary">
                      {getInitials(user)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">
                        {`${user.first_name} ${user.last_name}`.trim() || "Без имени"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {user.company_title || "Без компании"}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">ID {user.id}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{roleLabels[user.role]}</Badge>
                    <UserStatusBadge
                      status={user.status}
                      bannedUntil={user.banned_until}
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {user.contracts_count ?? 0} ·{" "}
                      {formatMoneyDisplay(user.contracts_sum ?? 0, "TJS")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>{formatRegistrationDate(user.created_at)}</span>
                    <span className="font-semibold text-primary">Открыть →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </PageSurface>
      )}

      {items.length > 0 && pages > 1 && (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label="Пагинация пользователей"
        >
          <Button variant="outline" size="sm" asChild={page > 1}>
            {page > 1 ? (
              <Link href={getPageHref(page - 1)}>
                <ChevronLeft aria-hidden="true" />
                Назад
              </Link>
            ) : (
              <span aria-disabled="true">
                <ChevronLeft aria-hidden="true" />
                Назад
              </span>
            )}
          </Button>

          <div className="hidden items-center gap-1 sm:flex">
            {pageNumbers.map((pageNumber, index) => {
              const previousPage = pageNumbers[index - 1]
              return (
                <span key={pageNumber} className="flex items-center gap-1">
                  {previousPage && pageNumber - previousPage > 1 && (
                    <MoreHorizontal
                      size={16}
                      className="text-muted-foreground"
                      aria-label="Пропущенные страницы"
                    />
                  )}
                  <Button
                    variant={pageNumber === page ? "default" : "ghost"}
                    size="icon-sm"
                    asChild
                  >
                    <Link
                      href={getPageHref(pageNumber)}
                      aria-current={pageNumber === page ? "page" : undefined}
                    >
                      {pageNumber}
                    </Link>
                  </Button>
                </span>
              )
            })}
          </div>
          <span className="text-xs text-muted-foreground sm:hidden">
            {page} из {pages}
          </span>

          <Button variant="outline" size="sm" asChild={page < pages}>
            {page < pages ? (
              <Link href={getPageHref(page + 1)}>
                Далее
                <ChevronRight aria-hidden="true" />
              </Link>
            ) : (
              <span aria-disabled="true">
                Далее
                <ChevronRight aria-hidden="true" />
              </span>
            )}
          </Button>
        </nav>
      )}
    </PageFrame>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <AdminUsersContent />
    </Suspense>
  )
}
