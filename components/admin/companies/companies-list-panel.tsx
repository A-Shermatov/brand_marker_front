"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowsDownUpIcon as ArrowDownUp, BuildingsIcon as Building2, CrownIcon as Crown, MapPinIcon as MapPin, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import {
  CompanyOperationalBadge,
  CompanyVerificationBadge,
} from "@/components/admin/companies/company-status-badges"
import { ListPagination } from "@/components/list-pagination"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
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
import { useAdminCompaniesQuery } from "@/hooks/api/use-admin-companies-query"
import type {
  AdminCompany,
  AdminCompanyOperationalStatus,
  AdminCompanySide,
  AdminCompanySort,
  AdminCompanyVerificationStatus,
} from "@/lib/api/admin"
import { resolveFileUrl } from "@/lib/file-url"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"

type SideFilter = "all" | AdminCompanySide

const ALL = "all"

const sideOptions: Array<{ value: SideFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "buyer", label: "Покупатели" },
  { value: "supplier", label: "Поставщики" },
]

const verificationOptions: Array<{ value: AdminCompanyVerificationStatus; label: string }> = [
  { value: "verified", label: "Проверено" },
  { value: "pending", label: "На проверке" },
  { value: "needs_documents", label: "Нужны документы" },
  { value: "rejected", label: "Отклонено" },
]

const operationalOptions: Array<{ value: AdminCompanyOperationalStatus; label: string }> = [
  { value: "active", label: "Активна" },
  { value: "blocked", label: "Заблокирована" },
  { value: "deactivated", label: "Деактивирована" },
]

const sortOptions: Array<{ value: string; label: string }> = [
  { value: "created_at:desc", label: "Сначала новые" },
  { value: "created_at:asc", label: "Сначала старые" },
  { value: "title:asc", label: "По названию А–Я" },
  { value: "title:desc", label: "По названию Я–А" },
  { value: "rating:desc", label: "Рейтинг ↓" },
  { value: "rating:asc", label: "Рейтинг ↑" },
]

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | null =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : null

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const sideLabel = (company: AdminCompany) => {
  const sides = company.actor_types.length ? company.actor_types : [company.actor_type]
  return sides.map((side) => (side === "buyer" ? "Покупатель" : "Поставщик")).join(", ")
}

const CompanyIdentity = ({ company }: { company: AdminCompany }) => {
  const initials = company.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-sm font-bold text-primary">
        {company.logo ? (
          <Image
            src={resolveFileUrl(company.logo)}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="40px"
          />
        ) : (
          initials
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold text-foreground">{company.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {company.legal_name || `ID ${company.id}`}
        </p>
      </div>
    </div>
  )
}

const VipBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
    <Crown size={12} aria-hidden="true" />
    VIP
  </span>
)

const CompaniesSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка компаний">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-28 rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminCompaniesContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const side: SideFilter = pick(searchParams.get("side"), ["buyer", "supplier"] as const) ?? "all"
  const verification = pick(
    searchParams.get("verification"),
    verificationOptions.map((option) => option.value),
  )
  const operational = pick(
    searchParams.get("operational"),
    operationalOptions.map((option) => option.value),
  )
  const vipParam = searchParams.get("vip")
  const vip = vipParam === "true" ? true : vipParam === "false" ? false : null
  const sortParam = sortOptions.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort")!
    : "created_at:desc"
  const [sortField, sortOrder] = sortParam.split(":") as [AdminCompanySort, "asc" | "desc"]
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const [searchInput, setSearchInput] = useState(query)

  const companiesQuery = useAdminCompaniesQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status: "all",
    query,
    actorType: side === "all" ? null : side,
    verificationStatus: verification,
    operationalStatus: operational,
    vip,
    sort: sortField,
    order: sortOrder,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === ALL) nextParams.delete(key)
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
    if (!companiesQuery.data || page <= companiesQuery.data.pages) return
    replaceSearchParams({ page: String(companiesQuery.data.pages) })
  }, [companiesQuery.data, page, replaceSearchParams])

  if (companiesQuery.isLoading) return <CompaniesSkeleton />

  if (companiesQuery.isError || !companiesQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <Building2 className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить компании</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => companiesQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, pages, total } = companiesQuery.data
  const hasFilters =
    side !== "all" || Boolean(verification || operational || query) || vip !== null

  const resetFilters = () => {
    setSearchInput("")
    replaceSearchParams({
      query: null,
      side: null,
      verification: null,
      operational: null,
      vip: null,
      page: null,
    })
  }

  return (
    <PageFrame>
      <PageHeader
        title="Компании"
        description="Все организации платформы — покупатели и поставщики"
        actions={
          <p className="text-sm text-muted-foreground">
            Найдено <strong className="ml-1 text-foreground">{total}</strong>
          </p>
        }
      />

      <PageSurface>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
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
              placeholder="Название, юр. лицо, ИНН, владелец или ID"
              className="pl-11"
              aria-label="Поиск компаний"
            />
          </div>
          <SegmentedControl
            value={side}
            options={sideOptions}
            onChange={(next) => replaceSearchParams({ side: next, page: null })}
            ariaLabel="Сторона"
          />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Select
            value={verification ?? ALL}
            onValueChange={(next) => replaceSearchParams({ verification: next, page: null })}
          >
            <SelectTrigger className="w-full" aria-label="Статус проверки">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Любая проверка</SelectItem>
              {verificationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={operational ?? ALL}
            onValueChange={(next) => replaceSearchParams({ operational: next, page: null })}
          >
            <SelectTrigger className="w-full" aria-label="Операционный статус">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Любой доступ</SelectItem>
              {operationalOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={vip === null ? ALL : String(vip)}
            onValueChange={(next) => replaceSearchParams({ vip: next, page: null })}
          >
            <SelectTrigger className="w-full" aria-label="VIP">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>VIP: все</SelectItem>
              <SelectItem value="true">Только VIP</SelectItem>
              <SelectItem value="false">Без VIP</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortParam}
            onValueChange={(next) =>
              replaceSearchParams({ sort: next === "created_at:desc" ? null : next, page: null })
            }
          >
            <SelectTrigger className="w-full" aria-label="Сортировка">
              <ArrowDownUp size={16} aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageSurface>

      {items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            title={hasFilters ? "Компании не найдены" : "Компаний пока нет"}
            description={
              hasFilters
                ? "Измените поисковый запрос или фильтры."
                : "Зарегистрированные организации появятся здесь."
            }
            action={
              hasFilters ? (
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              ) : undefined
            }
          />
        </PageSurface>
      ) : (
        <>
          <PageSurface className="relative hidden overflow-x-auto lg:block">
            {companiesQuery.isFetching && (
              <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary" />
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Сторона</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead className="text-right">Участники</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Проверка</TableHead>
                  <TableHead>Доступ</TableHead>
                  <TableHead>VIP</TableHead>
                  <TableHead className="text-right">Позиции</TableHead>
                  <TableHead className="text-right">Контракты</TableHead>
                  <TableHead>Создана</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="max-w-64">
                      <Link
                        href={`/admin/companies/${company.id}`}
                        className="block hover:opacity-75"
                      >
                        <CompanyIdentity company={company} />
                      </Link>
                    </TableCell>
                    <TableCell>{sideLabel(company)}</TableCell>
                    <TableCell className="max-w-52">
                      <p className="truncate font-medium">{company.owner.name || "Без имени"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {company.owner.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {company.members_count ?? 0}
                    </TableCell>
                    <TableCell>{company.city || "—"}</TableCell>
                    <TableCell>
                      <CompanyVerificationBadge status={company.verification_status} />
                    </TableCell>
                    <TableCell>
                      <CompanyOperationalBadge status={company.operational_status} />
                    </TableCell>
                    <TableCell>{company.vip ? <VipBadge /> : "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {company.products_count ?? 0}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {company.contracts_count ?? 0}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(company.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PageSurface>

          <div className="grid gap-3 lg:hidden">
            {items.map((company) => (
              <Link
                key={company.id}
                href={`/admin/companies/${company.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              >
                <CompanyIdentity company={company} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <CompanyVerificationBadge status={company.verification_status} />
                  <CompanyOperationalBadge status={company.operational_status} />
                  {company.vip && <VipBadge />}
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>{company.owner.name || company.owner.email}</p>
                  <p className="flex items-center gap-1.5">
                    <MapPin size={14} aria-hidden="true" />
                    {company.city || "Не указано"}
                  </p>
                  <p>{sideLabel(company)}</p>
                  <p>
                    Участники: {company.members_count ?? 0} · Позиции:{" "}
                    {company.products_count ?? 0} · Контракты: {company.contracts_count ?? 0}
                  </p>
                  <p>{formatDate(company.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <ListPagination
        page={page}
        totalPages={pages}
        onPageChange={(next) => replaceSearchParams({ page: next > 1 ? String(next) : null })}
      />
    </PageFrame>
  )
}
