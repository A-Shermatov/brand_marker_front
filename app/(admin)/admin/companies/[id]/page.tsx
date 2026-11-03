"use client"

import { use, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ProhibitIcon as Ban, BuildingsIcon as Building2, CheckCircleIcon as CheckCircle2, CaretDownIcon as ChevronDown, CrownIcon as Crown, FileDashedIcon as FileQuestion, PauseCircleIcon as PauseCircle, PencilSimpleIcon as Pencil, ArrowsCounterClockwiseIcon as RefreshCcw, ArrowCounterClockwiseIcon as RotateCcw, ShieldCheckIcon as ShieldCheck, StarIcon as Star, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { CompanyActionDialog } from "@/components/admin/companies/company-action-dialog"
import { CompanyCategoriesDialog } from "@/components/admin/companies/company-categories-dialog"
import { AdminCompanyDetailSections } from "@/components/admin/companies/company-detail-sections"
import { CompanyEditDialog } from "@/components/admin/companies/company-edit-dialog"
import {
  CompanyOperationalBadge,
  CompanyVerificationBadge,
} from "@/components/admin/companies/company-status-badges"
import {
  CompanyVerificationDialog,
  VERIFICATION_STATUS_LABELS,
} from "@/components/admin/companies/company-verification-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useAdminCompanyQuery,
  useAdminCompanyVipMutation,
} from "@/hooks/api/use-admin-companies-query"
import type { AdminCompanyAction, AdminCompanyVerificationStatus } from "@/lib/api/admin"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import { resolveFileUrl } from "@/lib/file-url"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"

const sections = [
  ["overview", "Обзор"],
  ["legal", "Юр. информация"],
  ["documents", "Чеклист"],
  ["certificates", "Документы"],
  ["categories", "Категории"],
  ["members", "Участники"],
  ["products", "Товары"],
  ["services", "Услуги"],
  ["contracts", "Контракты"],
  ["reviews", "Отзывы"],
] as const

const VERIFICATION_STATUSES: AdminCompanyVerificationStatus[] = [
  "verified",
  "pending",
  "needs_documents",
  "rejected",
]

const DetailSkeleton = () => (
  <PageFrame className="animate-pulse space-y-5">
    <div className="h-5 w-36 rounded bg-muted" />
    <div className="h-56 rounded-xl bg-muted" />
    <div className="h-14 rounded-xl bg-muted" />
    <div className="h-80 rounded-xl bg-muted" />
  </PageFrame>
)

type PageProps = {
  params: Promise<{ id: string }>
}

export default function AdminCompanyDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const companyId = Number(id)
  const companyQuery = useAdminCompanyQuery(companyId)
  const vipMutation = useAdminCompanyVipMutation()
  const [selectedAction, setSelectedAction] = useState<AdminCompanyAction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [verificationTarget, setVerificationTarget] =
    useState<AdminCompanyVerificationStatus | null>(null)
  const canVerify = useAdminPermission("admin_companies.update")
  const canBlock = useAdminPermission("admin_companies.block")
  const canModerateCatalog = useAdminPermission("admin_catalog.update")

  if (!Number.isInteger(companyId) || companyId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID компании</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/companies">Вернуться к списку</Link>
        </Button>
      </div>
    )
  }

  if (companyQuery.isLoading) return <DetailSkeleton />

  if (companyQuery.isError || !companyQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <Building2 className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Компания не найдена</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/companies">К списку</Link>
            </Button>
            <Button type="button" onClick={() => companyQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const company = companyQuery.data
  const initials = company.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
  const stats = [
    { label: "Рейтинг", value: company.rating.toFixed(1), Icon: Star },
    {
      label: "Завершено контрактов",
      value: company.stats?.completed_contracts ?? 0,
      Icon: CheckCircle2,
    },
    {
      label: "Активные контракты",
      value: company.stats?.active_contracts ?? 0,
      Icon: RefreshCcw,
    },
    {
      label: "Споры",
      value: company.stats?.disputes_count ?? 0,
      Icon: FileQuestion,
    },
  ]

  return (
    <PageFrame>
      <PageHeader
        title={company.title}
        description={
          <>
            {company.owner.name || company.owner.email}
            {" · "}
            {company.actor_types
              .map((type) => (type === "buyer" ? "Заказчик" : "Исполнитель"))
              .join(", ")}
          </>
        }
        backHref="/admin/companies"
        backLabel="Компании"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-xl font-bold text-primary">
              {company.logo ? (
                <Image
                  src={resolveFileUrl(company.logo)}
                  alt=""
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-muted-foreground">
                Компания #{company.id}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CompanyVerificationBadge status={company.verification_status} />
                <CompanyOperationalBadge status={company.operational_status} />
                {company.vip && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    <Crown size={12} aria-hidden="true" />
                    VIP
                    {company.vip_until
                      ? ` до ${new Date(company.vip_until).toLocaleDateString("ru-RU")}`
                      : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
            {canVerify && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={vipMutation.isPending}
                onClick={async () => {
                  try {
                    await vipMutation.mutateAsync({
                      companyId: company.id,
                      vip: !company.vip,
                      months: company.vip ? null : 3,
                      reason: company.vip ? "Снятие VIP" : "Админ VIP",
                    })
                    toast.success(
                      company.vip ? "VIP снят" : "VIP выдан на 3 месяца",
                    )
                  } catch {
                    // MutationCache toast
                  }
                }}
              >
                <Crown aria-hidden="true" />
                {company.vip ? "Снять VIP" : "Дать VIP"}
              </Button>
            )}
            {canVerify && (
              <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" />
                Редактировать
              </Button>
            )}
            {canVerify && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" variant="outline">
                    <ShieldCheck aria-hidden="true" />
                    Статус проверки
                    <ChevronDown aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Установить вручную</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {VERIFICATION_STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      disabled={status === company.verification_status}
                      onSelect={() => setVerificationTarget(status)}
                    >
                      {VERIFICATION_STATUS_LABELS[status]}
                      {status === company.verification_status ? " · текущий" : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canVerify && company.verification_status !== "verified" && (
              <Button type="button" size="sm" onClick={() => setSelectedAction("approve")}>
                <CheckCircle2 aria-hidden="true" />
                Одобрить
              </Button>
            )}
            {canVerify && company.verification_status !== "rejected" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setSelectedAction("reject")}
              >
                <XCircle aria-hidden="true" />
                Отклонить
              </Button>
            )}
            {canVerify && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("request_documents")}
              >
                <FileQuestion aria-hidden="true" />
                Запросить документы
              </Button>
            )}
            {canBlock && company.operational_status === "active" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setSelectedAction("block")}
                >
                  <Ban aria-hidden="true" />
                  Заблокировать
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAction("deactivate")}
                >
                  <PauseCircle aria-hidden="true" />
                  Деактивировать
                </Button>
              </>
            )}
            {canBlock && company.operational_status !== "active" && (
              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedAction("reactivate")}
              >
                <RotateCcw aria-hidden="true" />
                Активировать
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-xl bg-secondary/70 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Icon size={15} aria-hidden="true" />
                {label}
              </div>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      </PageSurface>

      <nav
        className="sticky top-17 z-20 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-2 backdrop-blur"
        aria-label="Разделы карточки компании"
      >
        {sections.map(([sectionId, label]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <AdminCompanyDetailSections
        company={company}
        canManage={canVerify}
        canModerateCatalog={canModerateCatalog}
        onEditCategories={() => setCategoriesOpen(true)}
      />

      <CompanyEditDialog company={company} open={editOpen} onOpenChange={setEditOpen} />
      <CompanyCategoriesDialog
        company={company}
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
      <CompanyVerificationDialog
        company={company}
        status={verificationTarget}
        onOpenChange={(open) => {
          if (!open) setVerificationTarget(null)
        }}
      />

      <CompanyActionDialog
        companyId={company.id}
        companyTitle={company.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
