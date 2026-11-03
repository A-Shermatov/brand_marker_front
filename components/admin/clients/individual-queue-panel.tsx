"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CheckIcon as Check, CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, ArrowSquareOutIcon as ExternalLink, CertificateIcon as FileCheck2, FileTextIcon as FileText, CircleNotchIcon as Loader2, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, ShieldSlashIcon as ShieldOff, TrashIcon as Trash2, UploadSimpleIcon as Upload, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import {
  IndividualVerificationDialog,
  type IndividualDecision,
} from "@/components/admin/clients/individual-verification-dialog"
import { PageEmptyState, PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IndividualStatusBadge } from "@/components/verification/individual-status-badge"
import { IDENTITY_ACCEPT } from "@/components/verification/identity-verification-card"
import {
  useAdminAddIndividualDocumentMutation,
  useAdminDeleteIndividualDocumentMutation,
  useAdminIndividualQuery,
  useAdminIndividualsQuery,
} from "@/hooks/api/use-client-verification-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import {
  INDIVIDUAL_DOCUMENT_TYPE_LABELS,
  type AdminIndividual,
  type AdminIndividualDetail,
  type AdminIndividualListStatus,
  type IndividualDocument,
  type IndividualDocumentType,
} from "@/lib/api/client-verification"
import { resolveFileUrl } from "@/lib/file-url"
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination"
import { cn } from "@/lib/utils"

const SIDE_LABELS: Record<string, string> = {
  buyer: "Заказчик",
  supplier: "Исполнитель",
}

const STATUS_FILTERS: { value: AdminIndividualListStatus; label: string }[] = [
  { value: "queue", label: "В очереди" },
  { value: "verified", label: "Проверены" },
  { value: "rejected", label: "Отклонены" },
  { value: "all", label: "Все" },
]

const DOCUMENT_TYPES = Object.keys(INDIVIDUAL_DOCUMENT_TYPE_LABELS) as IndividualDocumentType[]

const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  )

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const sidesLabel = (sides: string[]) =>
  sides.map((side) => SIDE_LABELS[side] ?? side).join(" · ") || "—"

const historyLabel = (action: string, details: Record<string, unknown>) => {
  if (action === "verification.individual.submit") return "Клиент отправил на проверку"
  if (action === "verification.individual.document.add") return "Клиент загрузил документ"
  if (action === "verification.individual.document.delete") return "Клиент удалил документ"
  if (action === "admin.individual.document.add") return "Документ загружен администратором"
  if (action === "admin.individual.document.delete") return "Документ удалён администратором"
  if (action === "admin.individual.verification.set") {
    const status = typeof details.status === "string" ? details.status : ""
    const labels: Record<string, string> = {
      verified: "Подтверждено",
      rejected: "Отклонено",
      needs_documents: "Запрошены документы",
      pending: "Возвращено на проверку",
      none: "Статус сброшен",
    }
    return labels[status] ?? "Статус изменён"
  }
  return action
}

const QueueItem = ({
  person,
  selected,
  onSelect,
}: {
  person: AdminIndividual
  selected: boolean
  onSelect: (userId: number) => void
}) => (
  <li>
    <button
      type="button"
      onClick={() => onSelect(person.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "w-full rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected ? "bg-secondary" : "hover:bg-secondary/60",
      )}
    >
      <p className="truncate font-bold text-foreground">{person.name || person.email}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {person.email} · {sidesLabel(person.sides)}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <IndividualStatusBadge status={person.verification_status} />
        <span className="text-xs text-muted-foreground">
          {person.documents_count} док. ·{" "}
          {formatDate(person.submitted_at ?? person.created_at)}
        </span>
      </div>
    </button>
  </li>
)

const DocumentTile = ({
  doc,
  onDelete,
  deleting,
}: {
  doc: IndividualDocument
  onDelete?: () => void
  deleting?: boolean
}) => {
  const url = resolveFileUrl(doc.file_url)
  const isImage = IMAGE_RE.test(doc.file_name ?? "") || IMAGE_RE.test(doc.file_url ?? "")
  return (
    <li className="overflow-hidden rounded-lg border border-border">
      {isImage && url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={doc.doc_type_label}
            className="h-40 w-full object-contain"
            loading="lazy"
          />
        </a>
      ) : null}
      <div className="flex items-start gap-3 p-3">
        <FileText className="mt-0.5 shrink-0 text-primary" size={18} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{doc.doc_type_label}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {doc.file_name || "Файл"} · {formatDate(doc.uploaded_at)}
            {doc.uploaded_by_admin ? " · загружен админом" : ""}
          </span>
        </span>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-primary"
          >
            Открыть
          </a>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={deleting}
            onClick={onDelete}
            aria-label={`Удалить ${doc.doc_type_label}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <dt className="text-[12.5px] font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-foreground">{value || "Не указано"}</dd>
  </div>
)

const IndividualReview = ({
  person,
  onDecision,
}: {
  person: AdminIndividualDetail
  onDecision: (decision: IndividualDecision) => void
}) => {
  const canEditCompanies = useAdminPermission("admin_companies.update")
  const canEditUsers = useAdminPermission("admin_users.update")
  const canViewUsers = useAdminPermission("admin_users.view")
  const canVerify = canEditCompanies || canEditUsers
  const addMutation = useAdminAddIndividualDocumentMutation()
  const deleteMutation = useAdminDeleteIndividualDocumentMutation()
  const [docType, setDocType] = useState<IndividualDocumentType>("passport")
  const fileRef = useRef<HTMLInputElement>(null)
  const status = person.verification_status

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      await addMutation.mutateAsync({ userId: person.id, file, docType })
      toast.success("Документ добавлен")
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-foreground">
            {person.name || person.email}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {person.email} · {sidesLabel(person.sides)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <IndividualStatusBadge status={status} />
          {canViewUsers && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/users/${person.id}?tab=dossier`}>
                Досье клиента
                <ExternalLink aria-hidden="true" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {person.verification_reason && status !== "verified" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <b className="font-semibold">Последний комментарий:</b> {person.verification_reason}
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <InfoRow label="Телефон" value={person.phone} />
        <InfoRow label="Аккаунт создан" value={formatDate(person.created_at)} />
        <InfoRow
          label="Отправлено на проверку"
          value={person.submitted_at ? formatDateTime(person.submitted_at) : null}
        />
        <InfoRow
          label="Проверено"
          value={
            person.verified_at
              ? `${formatDateTime(person.verified_at)}${
                  person.verified_by ? ` · ${person.verified_by.name || person.verified_by.email}` : ""
                }`
              : null
          }
        />
        <InfoRow
          label="Компании"
          value={person.companies_count ? `Состоит в ${person.companies_count}` : "Нет"}
        />
      </dl>

      <section aria-labelledby="individual-documents-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 id="individual-documents-title" className="text-sm font-bold">
            Документы личности
          </h3>
          {canVerify && (
            <div className="flex items-center gap-2">
              <label htmlFor="admin-identity-doc-type" className="sr-only">
                Тип документа
              </label>
              <select
                id="admin-identity-doc-type"
                value={docType}
                onChange={(event) => setDocType(event.target.value as IndividualDocumentType)}
                className="h-9 rounded-lg border border-input bg-card px-2 text-sm"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {INDIVIDUAL_DOCUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept={IDENTITY_ACCEPT}
                className="hidden"
                onChange={(event) => void handleFile(event)}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={addMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {addMutation.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                Добавить
              </Button>
            </div>
          )}
        </div>
        {person.documents.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {person.documents.map((doc) => (
              <DocumentTile
                key={doc.id}
                doc={doc}
                deleting={deleteMutation.isPending}
                onDelete={
                  canVerify
                    ? () => deleteMutation.mutate({ userId: person.id, documentId: doc.id })
                    : undefined
                }
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Документы не загружены
          </p>
        )}
      </section>

      {person.history.length > 0 && (
        <section aria-labelledby="individual-history-title">
          <h3 id="individual-history-title" className="mb-2 text-sm font-bold">
            История проверки
          </h3>
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {person.history.slice(0, 8).map((item) => {
              const reason =
                typeof item.details?.reason === "string" ? item.details.reason : null
              return (
                <li key={item.id} className="grid gap-0.5 px-3 py-2 sm:grid-cols-[140px_1fr]">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(item.created_at)}
                  </span>
                  <span>
                    <b className="font-semibold">{historyLabel(item.action, item.details)}</b>
                    {reason ? ` · ${reason}` : ""}
                    {item.actor ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.actor.name || item.actor.email}
                      </span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {canVerify && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          {status !== "verified" ? (
            <>
              <Button
                type="button"
                disabled={!person.documents.length}
                onClick={() => onDecision("approve")}
              >
                <Check aria-hidden="true" />
                Подтвердить
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onDecision("request_documents")}
              >
                <FileCheck2 aria-hidden="true" />
                Запросить документы
              </Button>
              {status !== "rejected" && (
                <Button type="button" variant="destructive" onClick={() => onDecision("reject")}>
                  <X aria-hidden="true" />
                  Отклонить
                </Button>
              )}
            </>
          ) : (
            <Button type="button" variant="destructive-outline" onClick={() => onDecision("revoke")}>
              <ShieldOff aria-hidden="true" />
              Отозвать подтверждение
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

const IndividualReviewPanel = ({ userId }: { userId: number }) => {
  const [decision, setDecision] = useState<IndividualDecision | null>(null)
  const query = useAdminIndividualQuery(userId)

  if (query.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-muted-foreground">
        <Loader2 className="animate-spin" aria-label="Загрузка" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Не удалось загрузить данные клиента</p>
        <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()}>
          <RefreshCcw aria-hidden="true" />
          Повторить
        </Button>
      </div>
    )
  }

  const person = query.data
  return (
    <>
      <IndividualReview person={person} onDecision={setDecision} />
      <IndividualVerificationDialog
        userId={person.id}
        userName={person.name || person.email}
        decision={decision}
        onOpenChange={(open) => {
          if (!open) setDecision(null)
        }}
      />
    </>
  )
}

export function IndividualQueuePanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const query = searchParams.get("query") ?? ""
  const statusParam = searchParams.get("status") as AdminIndividualListStatus | null
  const status = STATUS_FILTERS.some((option) => option.value === statusParam)
    ? (statusParam as AdminIndividualListStatus)
    : "queue"
  const sideParam = searchParams.get("side")
  const side = sideParam === "buyer" || sideParam === "supplier" ? sideParam : null
  const selectedParam = Number(searchParams.get("user")) || null
  const [searchInput, setSearchInput] = useState(query)

  const listQuery = useAdminIndividualsQuery({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    status,
    side,
    query,
  })

  const replaceSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) next.delete(key)
        else next.set(key, value)
      })
      const nextQuery = next.toString()
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
      replaceSearchParams({ query: searchInput.trim() || null, page: null, user: null })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [query, replaceSearchParams, searchInput])

  const items = listQuery.data?.items ?? []
  const selectedId = items.some((person) => person.id === selectedParam)
    ? selectedParam
    : items[0]?.id ?? null
  const counts = listQuery.data?.status_counts ?? {}
  const pages = listQuery.data?.pages ?? 1

  if (listQuery.isError) {
    return (
      <PageSurface className="p-8 text-center">
        <p className="text-sm text-muted-foreground">Не удалось загрузить очередь физлиц</p>
        <Button type="button" className="mt-4" onClick={() => listQuery.refetch()}>
          <RefreshCcw aria-hidden="true" />
          Повторить
        </Button>
      </PageSurface>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <PageSurface className="flex flex-col">
        <div className="space-y-2 border-b border-border p-3">
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
              placeholder="Имя, email или телефон"
              className="pl-9"
              aria-label="Поиск физлиц"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((option) => {
              const count = counts[option.value]
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    replaceSearchParams({
                      status: option.value === "queue" ? null : option.value,
                      page: null,
                      user: null,
                    })
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                    status === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                  {count !== undefined ? ` · ${count}` : ""}
                </button>
              )
            })}
          </div>
          <div className="flex gap-1.5">
            {[
              { value: null, label: "Все стороны" },
              { value: "supplier", label: "Исполнители" },
              { value: "buyer", label: "Заказчики" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => replaceSearchParams({ side: option.value, page: null, user: null })}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                  side === option.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {listQuery.isLoading ? (
          <div className="flex min-h-60 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" aria-label="Загрузка" />
          </div>
        ) : items.length ? (
          <ul className="max-h-[65dvh] space-y-1 overflow-y-auto p-2" aria-label="Очередь физлиц">
            {items.map((person) => (
              <QueueItem
                key={person.id}
                person={person}
                selected={person.id === selectedId}
                onSelect={(userId) => replaceSearchParams({ user: String(userId) })}
              />
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {status === "queue" && !query ? "Очередь пуста" : "Ничего не найдено"}
          </p>
        )}
        {pages > 1 && (
          <nav
            className="flex items-center justify-between border-t border-border p-2"
            aria-label="Пагинация очереди физлиц"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => replaceSearchParams({ page: String(page - 1), user: null })}
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
              onClick={() => replaceSearchParams({ page: String(page + 1), user: null })}
              aria-label="Следующая страница"
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </nav>
        )}
      </PageSurface>

      <PageSurface>
        {selectedId ? (
          <IndividualReviewPanel key={selectedId} userId={selectedId} />
        ) : (
          <PageEmptyState
            title="Выберите клиента"
            description="Документы и решение по проверке откроются здесь."
          />
        )}
      </PageSurface>
    </div>
  )
}
