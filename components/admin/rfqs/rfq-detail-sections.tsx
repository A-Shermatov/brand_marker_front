"use client"

import { AdminLink } from "@/components/admin/admin-link"
import { FileTextIcon as FileText } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import type { AdminRfqDetail } from "@/lib/api/admin"
import {
  adminActorKindLabels,
  adminLabel,
  adminReportReasonLabels,
  adminReportStatusLabels,
  adminRfqVisibilityLabels,
} from "@/lib/admin-display"
import { budgetTypeMeta, rfqStatusMeta, rfqTypeLabel } from "@/lib/rfq-display"
import { proposalStatusMeta } from "@/lib/proposal-display"
import { resolveFileUrl } from "@/lib/file-url"
import { formatDeliveryTime, formatMoneyDisplay } from "@/lib/format"
import type { BudgetType, ProposalStatus, RfqStatus, RfqType } from "@/types"

const sectionClassName = "scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

const formatMoney = (value: number | null | undefined, currency: string) => {
  if (value == null) return "—"
  return formatMoneyDisplay(value, currency || "TJS")
}

const EmptyState = ({ children }: { children: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
)

const partyLabel = (party: AdminRfqDetail["buyer"]) =>
  party?.company_title || party?.name || party?.display_name || "—"

export const AdminRfqDetailSections = ({ rfq }: { rfq: AdminRfqDetail }) => {
  const requirements = rfq.requirements
  const statusMeta = rfqStatusMeta[rfq.status as RfqStatus] || {
    label: rfq.status,
    className: "bg-muted text-muted-foreground",
  }

  return (
    <div className="space-y-5">
      <section id="requirements" className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">Требования</h2>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {rfq.description || "Описание не заполнено."}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Тип
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {rfqTypeLabel[requirements.type as RfqType] || requirements.type}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Категория
            </dt>
            <dd className="mt-1 text-sm font-medium">{requirements.category_id}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Бюджет
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {budgetTypeMeta[requirements.budget_type as BudgetType] || requirements.budget_type}
              {": "}
              {requirements.budget_from != null || requirements.budget_to != null
                ? `${formatMoney(requirements.budget_from, requirements.currency)} – ${formatMoney(requirements.budget_to, requirements.currency)}`
                : "открытый"}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Дедлайн
            </dt>
            <dd className="mt-1 text-sm font-medium">{requirements.deadline}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Видимость
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {adminLabel(adminRfqVisibilityLabels, requirements.visibility)}
            </dd>
          </div>
          {requirements.project_duration && (
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Длительность
              </dt>
              <dd className="mt-1 text-sm font-medium">{requirements.project_duration}</dd>
            </div>
          )}
          {requirements.quantity != null && (
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Количество
              </dt>
              <dd className="mt-1 text-sm font-medium">{requirements.quantity}</dd>
            </div>
          )}
        </dl>
        {requirements.attachments.length > 0 && (
          <div className="mt-5 space-y-2">
            {requirements.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={resolveFileUrl(attachment.file_url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <FileText size={15} aria-hidden="true" />
                {attachment.file_name}
              </a>
            ))}
          </div>
        )}
      </section>

      <section id="buyer" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Покупатель</h2>
        {rfq.buyer ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Имя
              </dt>
              <dd className="mt-1 text-sm font-medium">{partyLabel(rfq.buyer)}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium">{rfq.buyer.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Профиль
              </dt>
              <dd className="mt-1 text-sm font-medium">
                #{rfq.buyer.actor_id} ·{" "}
                {adminLabel(adminActorKindLabels, rfq.buyer.actor_kind)}
              </dd>
            </div>
            {rfq.buyer.company_id && (
              <div>
                <dt className="text-[12.5px] font-medium text-muted-foreground">
                  Компания
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <AdminLink
                    href={`/admin/companies/${rfq.buyer.company_id}`}
                    className="text-primary hover:underline"
                  >
                    {rfq.buyer.company_title || `ID ${rfq.buyer.company_id}`}
                  </AdminLink>
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <EmptyState>Покупатель не найден.</EmptyState>
        )}
      </section>

      <section id="proposals" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Предложения</h2>
        {rfq.proposals.length ? (
          <div className="space-y-3">
            {rfq.proposals.map((proposal) => {
              const meta = proposalStatusMeta[proposal.status as ProposalStatus] || {
                label: proposal.status,
                className: "bg-muted text-muted-foreground",
              }
              return (
                <div
                  key={proposal.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold wrap-anywhere">
                      {partyLabel(proposal.supplier)} · #{proposal.id}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">
                      {formatMoney(proposal.price, proposal.currency)}
                      {proposal.delivery_time ? ` · ${formatDeliveryTime(proposal.delivery_time)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={meta.className}>
                      {meta.label}
                    </Badge>
                    <AdminLink
                      href={`/admin/proposals/${proposal.id}`}
                      hideWhenDenied
                      className="rounded-xl border border-border px-3 py-1.5 text-sm font-semibold hover:bg-secondary"
                    >
                      Открыть
                    </AdminLink>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState>Предложений пока нет.</EmptyState>
        )}
      </section>

      <section id="messages" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Сообщения</h2>
        {rfq.messages.length ? (
          <div className="space-y-3">
            {rfq.messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{message.sender_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(message.created_at)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{message.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Сообщений нет.</EmptyState>
        )}
      </section>

      <section id="reports" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Жалобы</h2>
        {rfq.reports.length ? (
          <div className="space-y-3">
            {rfq.reports.map((report) => (
              <div key={report.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {adminLabel(adminReportReasonLabels, report.reason)}
                  </Badge>
                  <Badge variant="outline">
                    {adminLabel(adminReportStatusLabels, report.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {report.reporter.name} · {formatDate(report.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {report.details || "Без деталей"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Жалоб нет.</EmptyState>
        )}
      </section>
    </div>
  )
}
