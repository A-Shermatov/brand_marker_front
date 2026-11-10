"use client"

import Link from "next/link"
import { WarningIcon as AlertTriangle, ArrowSquareOutIcon as ExternalLink, FileTextIcon as FileText, ArrowsCounterClockwiseIcon as RefreshCcw, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import {
  CompanyOperationalBadge,
  CompanyVerificationBadge,
} from "@/components/admin/companies/company-status-badges"
import { PageSurface } from "@/components/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IndividualStatusBadge } from "@/components/verification/individual-status-badge"
import { useAdminUserDossierQuery } from "@/hooks/api/use-client-verification-query"
import type {
  AdminCompanyOperationalStatus,
  AdminCompanyVerificationStatus,
} from "@/lib/api/admin"
import { ADMIN_COMPANY_MEMBER_ROLE_LABELS } from "@/lib/api/admin-companies"
import type { AdminDossierRiskLevel, AdminUserDossier } from "@/lib/api/client-verification"
import { resolveFileUrl } from "@/lib/file-url"
import { formatMoneyDisplay } from "@/lib/format"
import { cn } from "@/lib/utils"

const RISK_STYLES: Record<AdminDossierRiskLevel, string> = {
  low: "border-safe-100 bg-safe-50 text-safe-700",
  medium: "border-amber-200 bg-amber-50 text-amber-900",
  high: "border-red-200 bg-red-50 text-red-700",
}

const SIDE_LABELS: Record<string, string> = {
  buyer: "Покупатель",
  supplier: "Поставщик",
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const Fact = ({
  label,
  value,
  danger,
}: {
  label: string
  value: React.ReactNode
  danger?: boolean
}) => (
  <div className="rounded-lg border border-border px-3 py-2.5">
    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className={cn("mt-1 text-sm font-bold tabular-nums", danger && "text-destructive")}>
      {value}
    </dd>
  </div>
)

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <PageSurface className="space-y-3 p-5">
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
    {children}
  </PageSurface>
)

const ratingLabel = (stats: { count: number; avg: number | null } | undefined) =>
  stats && stats.count > 0 && stats.avg != null
    ? `${stats.avg.toFixed(1)} (${stats.count})`
    : "нет отзывов"

const DossierBody = ({ dossier }: { dossier: AdminUserDossier }) => {
  const { user, identity, companies, signals, money, reviews, blocks, risk } = dossier
  const currency = money.currency

  return (
    <div className="space-y-4">
      <PageSurface className={cn("border p-5", RISK_STYLES[risk.level])}>
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle size={20} aria-hidden="true" />
          <p className="text-base font-bold">Риск: {risk.label}</p>
          <span className="text-xs opacity-80">баллов: {risk.score}</span>
        </div>
        {risk.reasons.length ? (
          <ul className="mt-3 grid gap-1 text-sm">
            {risk.reasons.map((reason) => (
              <li key={reason.code} className="flex items-center gap-2">
                <span className="tabular-nums text-xs opacity-70">+{reason.weight}</span>
                {reason.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm">Тревожных сигналов не найдено.</p>
        )}
      </PageSurface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Личность и аккаунт">
          <div className="flex flex-wrap items-center gap-2">
            <IndividualStatusBadge status={identity.status} />
            {identity.sides.length ? (
              <span className="text-xs text-muted-foreground">
                Физлицо: {identity.sides.map((side) => SIDE_LABELS[side] ?? side).join(", ")}
              </span>
            ) : null}
            {identity.status !== "none" ? (
              <Link
                href={`/admin/verification?tab=individuals&status=all&user=${user.id}&query=${encodeURIComponent(user.email)}`}
                className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
              >
                Открыть в проверке
              </Link>
            ) : null}
          </div>
          {identity.reason && identity.status !== "verified" ? (
            <p className="text-sm text-muted-foreground">Комментарий: {identity.reason}</p>
          ) : null}
          <dl className="grid grid-cols-2 gap-2">
            <Fact label="Возраст аккаунта" value={`${user.account_age_days} дн.`} />
            <Fact
              label="2FA"
              value={user.totp_enabled ? "Включена" : "Выключена"}
            />
            <Fact
              label="Последний вход"
              value={user.last_login_at ? formatDateTime(user.last_login_at) : "—"}
            />
            <Fact label="IP последнего входа" value={user.last_login_ip || "—"} />
            <Fact
              label="Неудачных входов (30 дн.)"
              value={signals.failed_logins_30d}
              danger={signals.failed_logins_30d >= 5}
            />
            <Fact label="Разных IP (30 дн.)" value={signals.distinct_ips_30d} />
          </dl>
          {identity.documents.length ? (
            <ul className="grid gap-2">
              {identity.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <FileText size={16} className="text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    {doc.doc_type_label}
                    {doc.file_name ? ` · ${doc.file_name}` : ""}
                  </span>
                  {doc.file_url ? (
                    <a
                      href={resolveFileUrl(doc.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary"
                    >
                      Открыть
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Документы личности не загружены.</p>
          )}
        </Section>

        <Section title="Деньги">
          <dl className="grid grid-cols-2 gap-2">
            <Fact
              label={`Оборот как покупатель (${money.contracts_as_buyer})`}
              value={formatMoneyDisplay(money.buyer_turnover, currency)}
            />
            <Fact
              label={`Оборот как поставщик (${money.contracts_as_supplier})`}
              value={formatMoneyDisplay(money.supplier_turnover, currency)}
            />
            <Fact
              label="В эскроу (оплачено им)"
              value={formatMoneyDisplay(money.escrow_held_as_buyer, currency)}
            />
            <Fact
              label="В эскроу (к выплате ему)"
              value={formatMoneyDisplay(money.escrow_held_as_supplier, currency)}
            />
            <Fact
              label={`Выводы в ожидании (${money.pending_withdrawals_count})`}
              value={formatMoneyDisplay(money.pending_withdrawals_amount, currency)}
            />
            <Fact
              label="Отзывы как поставщик / покупатель"
              value={`${ratingLabel(reviews.supplier)} / ${ratingLabel(reviews.buyer)}`}
            />
          </dl>
        </Section>
      </div>

      <Section title={`Компании (${companies.length})`}>
        {companies.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {companies.map((company) => (
              <li key={company.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="inline-flex min-w-0 items-center gap-1 font-bold hover:underline"
                >
                  <span className="truncate">{company.title}</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>
                <span className="text-xs text-muted-foreground">
                  {company.is_owner
                    ? "Владелец"
                    : ADMIN_COMPANY_MEMBER_ROLE_LABELS[company.role] ?? company.role}
                  {" · "}
                  {(company.sides.length ? company.sides : [company.actor_type])
                    .map((side) => SIDE_LABELS[side] ?? side)
                    .join(", ")}
                </span>
                <span className="ml-auto flex gap-1.5">
                  <CompanyVerificationBadge
                    status={company.verification_status as AdminCompanyVerificationStatus}
                  />
                  <CompanyOperationalBadge
                    status={company.operational_status as AdminCompanyOperationalStatus}
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Не состоит в компаниях.</p>
        )}
      </Section>

      <Section title="Сигналы риска">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Fact label="Сделок всего" value={signals.contracts_total} />
          <Fact label="Активных" value={signals.contracts_active} />
          <Fact label="Завершено" value={signals.contracts_completed} />
          <Fact
            label="Отменено"
            value={signals.contracts_cancelled}
            danger={signals.contracts_cancelled > 0}
          />
          <Fact label="Споров всего" value={signals.disputes_total} />
          <Fact label="Открыл споров" value={signals.disputes_opened_by} />
          <Fact
            label="Споров против"
            value={signals.disputes_against}
            danger={signals.disputes_against > 0}
          />
          <Fact
            label="Проиграно споров"
            value={signals.disputes_lost}
            danger={signals.disputes_lost > 0}
          />
          <Fact
            label="Жалоб на объявления"
            value={`${signals.complaints_total} (откр. ${signals.complaints_open})`}
            danger={signals.complaints_open > 0}
          />
          <Fact
            label="Жалобы: каталог / заявки / КП"
            value={`${signals.complaints_catalog} / ${signals.complaints_rfq} / ${signals.complaints_proposal}`}
          />
          <Fact label="Подал жалоб" value={signals.complaints_filed} />
          <Fact
            label="Блокировок"
            value={signals.blocks_count}
            danger={signals.blocks_count > 0}
          />
        </dl>
        {blocks.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {blocks.map((block) => (
              <li key={block.id} className="grid gap-0.5 px-3 py-2 sm:grid-cols-[150px_140px_1fr]">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDateTime(block.created_at)}
                </span>
                <span>
                  <Badge variant={block.status === "blocked" ? "destructive" : "muted"}>
                    {block.status === "blocked" ? "Блокировка" : "Разблокировка"}
                  </Badge>
                </span>
                <span className="text-foreground/80">
                  {[block.reason, block.admin].filter(Boolean).join(" · ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </div>
  )
}

export function UserDossierTab({ userId }: { userId: number }) {
  const query = useAdminUserDossierQuery(userId)

  if (query.isLoading) {
    return <div className="h-96 animate-pulse rounded-xl bg-muted" aria-label="Загрузка досье" />
  }
  if (query.isError || !query.data) {
    return (
      <PageSurface className="flex flex-col items-center gap-3 p-8 text-center">
        <ShieldCheck className="text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Не удалось загрузить досье клиента</p>
        <Button type="button" variant="outline" size="sm" onClick={() => query.refetch()}>
          <RefreshCcw aria-hidden="true" />
          Повторить
        </Button>
      </PageSurface>
    )
  }
  return <DossierBody dossier={query.data} />
}
