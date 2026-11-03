"use client"

import { Suspense, useCallback, useEffect, useState, Fragment} from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CheckIcon as Check, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowSquareOutIcon as ExternalLink, CertificateIcon as FileCheck2, FileTextIcon as FileText, CircleNotchIcon as Loader2, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { CompanyActionDialog } from "@/components/admin/companies/company-action-dialog"
import { VERIFICATION_CHECKLIST_LABELS } from "@/components/admin/companies/company-detail-sections"
import { CompanyVerificationBadge } from "@/components/admin/companies/company-status-badges"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useAdminCompaniesQuery,
  useAdminCompanyQuery,
} from "@/hooks/api/use-admin-companies-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type {
  AdminCompany,
  AdminCompanyAction,
  AdminCompanyDetail,
  AdminCompanySide,
} from "@/lib/api/admin"
import { resolveFileUrl } from "@/lib/file-url"
import { cn } from "@/lib/utils"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"


const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  )

const VerificationSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка очереди верификации">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="h-96 rounded-xl bg-muted" />
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  </PageFrame>
)

const QueueItem = ({
  company,
  selected,
  onSelect,
}: {
  company: AdminCompany
  selected: boolean
  onSelect: (companyId: number) => void
}) => (
  <li>
    <button
      type="button"
      onClick={() => onSelect(company.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "w-full rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected && "bg-secondary",
        !selected && "hover:bg-secondary/60",
      )}
    >
      <p className="truncate font-bold text-foreground">{company.title}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {company.legal_name || company.owner.email}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <CompanyVerificationBadge status={company.verification_status} />
        <span className="text-xs text-muted-foreground">{formatDate(company.created_at)}</span>
      </div>
    </button>
  </li>
)

const ChecklistRow = ({ label, complete }: { label: string; complete: boolean }) => (
  <li className="flex items-center gap-3 rounded-lg border border-border p-3">
    <span className={complete ? "text-primary" : "text-warning"}>
      {complete ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
    </span>
    <span className="text-sm font-medium">{label}</span>
    <span className="sr-only">{complete ? "заполнено" : "не заполнено"}</span>
  </li>
)

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <dt className="text-[12.5px] font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-foreground">{value || "Не указано"}</dd>
  </div>
)

const CompanyReview = ({
  company,
  onAction,
}: {
  company: AdminCompanyDetail
  onAction: (action: AdminCompanyAction) => void
}) => {
  const checklist = Object.entries(company.verification_checklist) as Array<
    [keyof AdminCompanyDetail["verification_checklist"], boolean]
  >
  const completed = checklist.filter(([, complete]) => complete).length
  const canVerify = useAdminPermission("admin_companies.update")

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-foreground">{company.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {company.owner.name || "Без имени"} · {company.owner.email}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/companies/${company.id}`}>
            Полная карточка
            <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <section aria-labelledby="verification-checklist-title">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="verification-checklist-title" className="text-sm font-bold">
            Чеклист проверки
          </h3>
          <span className="text-xs text-muted-foreground">
            {completed} из {checklist.length}
          </span>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checklist.map(([key, complete]) => (
            <ChecklistRow key={key} label={VERIFICATION_CHECKLIST_LABELS[key]} complete={complete} />
          ))}
        </ul>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <InfoRow label="Юридическое наименование" value={company.legal_name} />
        <InfoRow label="ИНН / налоговый номер" value={company.tax_number} />
        <InfoRow label="Адрес" value={[company.address, company.city, company.country].filter(Boolean).join(", ")} />
        <InfoRow label="Сайт" value={company.website} />
      </dl>

      <section aria-labelledby="verification-documents-title">
        <h3 id="verification-documents-title" className="mb-3 text-sm font-bold">
          Документы и сертификаты
        </h3>
        {company.certificates.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {company.certificates.map((certificate) => (
              <li key={certificate.id}>
                <a
                  href={resolveFileUrl(certificate.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary/30"
                >
                  <FileText className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{certificate.title}</span>
                    <span className="block text-xs text-muted-foreground">{certificate.issuer}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Документы не загружены
          </p>
        )}
      </section>

      {canVerify && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          <Button type="button" onClick={() => onAction("approve")}>
            <Check aria-hidden="true" />
            Подтвердить
          </Button>
          <Button type="button" variant="outline" onClick={() => onAction("request_documents")}>
            <FileCheck2 aria-hidden="true" />
            Запросить документы
          </Button>
          <Button type="button" variant="destructive" onClick={() => onAction("reject")}>
            <X aria-hidden="true" />
            Отклонить
          </Button>
        </div>
      )}
    </div>
  )
}

const CompanyReviewPanel = ({ companyId }: { companyId: number }) => {
  const [action, setAction] = useState<AdminCompanyAction | null>(null)
  const companyQuery = useAdminCompanyQuery(companyId)

  if (companyQuery.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" aria-label="Загрузка компании" />
      </div>
    )
  }

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Не удалось загрузить данные компании</p>
        <Button type="button" variant="outline" size="sm" onClick={() => companyQuery.refetch()}>
          <RefreshCcw aria-hidden="true" />
          Повторить
        </Button>
      </div>
    )
  }

  const company = companyQuery.data

  return (
    <>
      <CompanyReview company={company} onAction={setAction} />
      <CompanyActionDialog
        companyId={company.id}
        companyTitle={company.title}
        action={action}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
    </>
  )
}

type AdminVerificationContentProps = {
  embedded?: boolean
  /** Restrict the queue to one side; omitted shows every pending company. */
  actorType?: AdminCompanySide | null
}

export function AdminVerificationContent({
  embedded = true,
  actorType = null,
}: AdminVerificationContentProps = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const selectedParam = Number(searchParams.get("company")) || null
  const [searchInput, setSearchInput] = useState(query)
  const queueQuery = useAdminCompaniesQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status: "pending",
    query,
    actorType,
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
      replaceSearchParams({ query: searchInput.trim() || null, page: null, company: null })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [query, replaceSearchParams, searchInput])

  const items = queueQuery.data?.items ?? []
  const selectedId = items.some((company) => company.id === selectedParam)
    ? selectedParam
    : items[0]?.id ?? null

  const handleSelect = (companyId: number) => replaceSearchParams({ company: String(companyId) })

  if (queueQuery.isLoading) return <VerificationSkeleton />

  if (queueQuery.isError || !queueQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <FileCheck2 className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить очередь</h1>
          <Button type="button" className="mt-5" onClick={() => queueQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { total, pages } = queueQuery.data

  return (
    <Frame>
      {!embedded && (
        <PageHeader
        title="Верификация"
        description="Компании, ожидающие проверки или дозагрузки документов"
        actions={
          <p className="text-sm text-muted-foreground">
            В очереди <strong className="ml-1 text-foreground">{total}</strong>
          </p>
        }
      />
      )}

      {total === 0 && !query ? (
        <PageSurface>
          <PageEmptyState
            title="Очередь пуста"
            description="Все компании проверены. Новые заявки появятся здесь."
          />
        </PageSurface>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <PageSurface className="flex flex-col">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Название, ИНН или email"
                  className="pl-9"
                  aria-label="Поиск в очереди верификации"
                />
              </div>
            </div>
            {items.length ? (
              <ul className="max-h-[65dvh] space-y-1 overflow-y-auto p-2" aria-label="Очередь компаний">
                {items.map((company) => (
                  <QueueItem
                    key={company.id}
                    company={company}
                    selected={company.id === selectedId}
                    onSelect={handleSelect}
                  />
                ))}
              </ul>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">Ничего не найдено</p>
            )}
            {pages > 1 && (
              <nav
                className="flex items-center justify-between border-t border-border p-2"
                aria-label="Пагинация очереди"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => replaceSearchParams({ page: String(page - 1), company: null })}
                  aria-label="Предыдущая страница"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {page} из {pages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => replaceSearchParams({ page: String(page + 1), company: null })}
                  aria-label="Следующая страница"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </nav>
            )}
          </PageSurface>

          <PageSurface>
            {selectedId ? (
              <CompanyReviewPanel key={selectedId} companyId={selectedId} />
            ) : (
              <PageEmptyState title="Выберите компанию" description="Карточка откроется здесь." />
            )}
          </PageSurface>
        </div>
      )}
    </Frame>
  )
}

