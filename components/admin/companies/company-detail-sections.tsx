"use client"

import { type ReactNode, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"
import { CheckIcon as Check, ArrowSquareOutIcon as ExternalLink, EyeIcon as Eye, EyeSlashIcon as EyeOff, PackageIcon as Package, StarIcon as Star, TagIcon as Tags, WrenchIcon as Wrench, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { CompanyConfirmDialog } from "@/components/admin/companies/company-confirm-dialog"
import { CompanyDocumentsManager } from "@/components/admin/companies/company-documents-manager"
import { CompanyMembersManager } from "@/components/admin/companies/company-members-manager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAdminCompanyCatalogItemMutation } from "@/hooks/api/use-admin-companies-query"
import type {
  AdminCompanyCatalogItem,
  AdminCompanyDetail,
} from "@/lib/api/admin"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")


const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(value))

export const VERIFICATION_CHECKLIST_LABELS: Record<
  keyof AdminCompanyDetail["verification_checklist"],
  string
> = {
  legal_name: "Юридическое наименование",
  tax_number: "ИНН / налоговый номер",
  address: "Юридический адрес",
  website: "Сайт компании",
  certificates: "Подтверждающие документы",
}

const sectionClassName = "scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6"

const Section = ({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) => (
  <section id={id} className={sectionClassName}>
    <div className="mb-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
    {children}
  </section>
)

const InfoField = ({ label, value }: { label: string; value: ReactNode }) => (
  <div>
    <dt className="text-[12.5px] font-medium text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 text-sm font-medium text-foreground">{value || "Не указано"}</dd>
  </div>
)

const ExpandableCollection = ({
  children,
  total,
}: {
  children: (limit: number) => ReactNode
  total: number
}) => {
  const [expanded, setExpanded] = useState(false)
  const limit = expanded ? total : 5
  return (
    <>
      {children(limit)}
      {total > 5 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Свернуть" : `Показать все (${total})`}
        </Button>
      )}
    </>
  )
}

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
)

const CATALOG_STATUS_LABELS: Record<string, string> = {
  active: "Активна",
  hidden: "Скрыта",
  draft: "Черновик",
  pending_review: "На модерации",
  changes_requested: "На доработке",
  archived: "В архиве",
}

const HIDEABLE_STATUSES = new Set(["active", "pending_review", "changes_requested"])

const CatalogList = ({
  companyId,
  items,
  canModerate,
}: {
  companyId: number
  items: AdminCompanyCatalogItem[]
  canModerate: boolean
}) => {
  const mutation = useAdminCompanyCatalogItemMutation()
  const [hideTarget, setHideTarget] = useState<AdminCompanyCatalogItem | null>(null)
  const [reason, setReason] = useState("")

  if (!items.length) return <EmptyState>Позиций этого типа пока нет.</EmptyState>

  const closeHide = () => {
    setHideTarget(null)
    setReason("")
  }

  const handleHide = async () => {
    if (!hideTarget || !reason.trim()) return
    try {
      await mutation.mutateAsync({
        companyId,
        itemId: hideTarget.id,
        action: "hide",
        reason,
      })
      toast.success("Позиция скрыта")
      closeHide()
    } catch {
      // MutationCache toast
    }
  }

  const handleUnhide = async (item: AdminCompanyCatalogItem) => {
    try {
      await mutation.mutateAsync({ companyId, itemId: item.id, action: "approve" })
      toast.success("Позиция снова опубликована")
    } catch {
      // MutationCache toast
    }
  }

  return (
    <>
      <ExpandableCollection total={items.length}>
        {(limit) => (
          <div className="divide-y divide-border">
            {items.slice(0, limit).map((item) => (
              <div
                key={item.id}
                className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <Link
                    href={`/admin/catalog/${item.id}`}
                    className="font-bold hover:text-primary hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[item.category, `ID ${item.id}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end sm:text-right">
                  <Badge variant="outline">{CATALOG_STATUS_LABELS[item.status] ?? item.status}</Badge>
                  <span className="text-sm font-bold">
                    {item.price ? formatMoney(item.price, item.currency || "TJS") : "Цена не указана"}
                  </span>
                  {canModerate && HIDEABLE_STATUSES.has(item.status) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => setHideTarget(item)}
                    >
                      <EyeOff aria-hidden="true" />
                      Скрыть
                    </Button>
                  )}
                  {canModerate && item.status === "hidden" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => void handleUnhide(item)}
                    >
                      <Eye aria-hidden="true" />
                      Показать
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ExpandableCollection>
      <CompanyConfirmDialog
        open={Boolean(hideTarget)}
        onOpenChange={(open) => {
          if (!open) closeHide()
        }}
        title="Скрыть позицию?"
        description={hideTarget ? `«${hideTarget.title}» пропадёт из каталога.` : ""}
        confirmLabel="Скрыть"
        destructive
        pending={mutation.isPending}
        confirmDisabled={!reason.trim()}
        onConfirm={() => void handleHide()}
      >
        <div className="space-y-2">
          <Label htmlFor="company-catalog-hide-reason" className="text-sm font-semibold">
            Причина <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="company-catalog-hide-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>
      </CompanyConfirmDialog>
    </>
  )
}

export const AdminCompanyDetailSections = ({
  company,
  canManage = false,
  canModerateCatalog = false,
  onEditCategories,
}: {
  company: AdminCompanyDetail
  canManage?: boolean
  canModerateCatalog?: boolean
  onEditCategories?: () => void
}) => {
  return (
    <div className="space-y-5">
      <Section id="overview" title="Обзор" description="Публичная информация и профиль компании">
        <p className="text-sm leading-6 text-muted-foreground">
          {company.description || "Описание компании не заполнено."}
        </p>
        <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <InfoField label="Год основания" value={company.profile?.founded_year} />
          <InfoField label="Сотрудники" value={company.profile?.employees_count} />
          <InfoField label="Выручка" value={company.profile?.annual_revenue_range} />
          <InfoField
            label="Языки"
            value={company.profile?.languages?.join(", ")}
          />
          <InfoField
            label="Отрасли"
            value={company.profile?.industries?.join(", ")}
          />
          <InfoField label="Создана" value={formatDate(company.created_at)} />
          <InfoField label="Обновлена" value={formatDate(company.updated_at)} />
          <InfoField label="Владелец" value={company.owner.name || company.owner.email} />
        </dl>
      </Section>

      <Section id="legal" title="Юридическая информация">
        <dl className="grid gap-5 sm:grid-cols-2">
          <InfoField label="Юридическое наименование" value={company.legal_name} />
          <InfoField label="ИНН / налоговый номер" value={company.tax_number} />
          <InfoField label="Страна" value={company.country} />
          <InfoField label="Город" value={company.city} />
          <InfoField label="Адрес" value={company.address} />
          <InfoField
            label="Сайт"
            value={
              company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {company.website}
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              ) : null
            }
          />
        </dl>
      </Section>

      <Section
        id="documents"
        title="Документы для верификации"
        description="Чеклист заполненности данных для проверки"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(company.verification_checklist).map(([key, complete]) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              <span className={complete ? "text-primary" : "text-warning"}>
                {complete ? <Check size={18} aria-hidden="true" /> : <X size={18} aria-hidden="true" />}
              </span>
              <span className="text-sm font-medium">
                {VERIFICATION_CHECKLIST_LABELS[key as keyof typeof VERIFICATION_CHECKLIST_LABELS]}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Сертификаты ниже показаны отдельно и не считаются заменой юридических документов.
        </p>
      </Section>

      <Section id="certificates" title="Документы и сертификаты">
        <CompanyDocumentsManager company={company} canManage={canManage} />
      </Section>

      <Section id="categories" title={`Категории (${company.categories?.length ?? 0})`}>
        {company.categories?.length ? (
          <div className="flex flex-wrap gap-2">
            {company.categories.map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState>Категории не выбраны.</EmptyState>
        )}
        {canManage && onEditCategories && (
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onEditCategories}>
            <Tags aria-hidden="true" />
            Изменить категории
          </Button>
        )}
      </Section>

      <Section id="members" title={`Участники (${company.members.length})`}>
        <CompanyMembersManager company={company} canManage={canManage} />
      </Section>

      <Section id="products" title={`Товары (${company.products.length})`}>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Package size={16} aria-hidden="true" /> Товарные позиции компании
        </div>
        <CatalogList
          companyId={company.id}
          items={company.products}
          canModerate={canModerateCatalog}
        />
      </Section>

      <Section id="services" title={`Услуги (${company.services.length})`}>
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Wrench size={16} aria-hidden="true" /> Сервисные позиции компании
        </div>
        <CatalogList
          companyId={company.id}
          items={company.services}
          canModerate={canModerateCatalog}
        />
      </Section>

      <Section id="contracts" title={`Контракты (${company.contracts.length})`}>
        {company.contracts.length ? (
          <ExpandableCollection total={company.contracts.length}>
            {(limit) => (
              <div className="divide-y divide-border">
                {company.contracts.slice(0, limit).map((contract) => (
                  <div key={contract.id} className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto]">
                    <div>
                      <p className="font-bold">{contract.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Контракт #{contract.id} · {formatDate(contract.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{contract.status}</Badge>
                      <span className="font-bold">
                        {formatMoney(contract.agreed_amount, contract.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ExpandableCollection>
        ) : (
          <EmptyState>Контрактов с участием компании нет.</EmptyState>
        )}
      </Section>

      <Section id="reviews" title={`Отзывы (${company.reviews.length})`}>
        {company.reviews.length ? (
          <ExpandableCollection total={company.reviews.length}>
            {(limit) => (
              <div className="space-y-3">
                {company.reviews.slice(0, limit).map((review) => (
                  <article key={review.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1 font-bold">
                        <Star size={16} className="fill-amber-400 text-amber-400" aria-hidden="true" weight="fill" />
                        {review.rating}/5
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(review.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {review.comment || "Отзыв без комментария"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </ExpandableCollection>
        ) : (
          <EmptyState>Отзывы пока не оставляли.</EmptyState>
        )}
      </Section>
    </div>
  )
}
