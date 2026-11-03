"use client"

import { AdminLink } from "@/components/admin/admin-link"
import { formatCurrency } from "@/lib/format"
import { FileTextIcon as FileText } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import type { AdminProposalDetail } from "@/lib/api/admin"
import {
  adminLabel,
  adminReportReasonLabels,
  adminReportStatusLabels,
} from "@/lib/admin-display"
import { contractStatusMeta } from "@/lib/contract-display"
import { resolveFileUrl } from "@/lib/file-url"
import type { ContractStatus } from "@/types"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sectionClassName = "scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))


const EmptyState = ({ children }: { children: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
)

const partyLabel = (party: AdminProposalDetail["supplier"]) =>
  party?.company_title || party?.name || party?.display_name || "—"

export const AdminProposalDetailSections = ({
  proposal,
}: {
  proposal: AdminProposalDetail
}) => {
  const contractStatus = proposal.contract
    ? contractStatusMeta[proposal.contract.status as ContractStatus] || {
        label: proposal.contract.status,
        className: "bg-muted text-muted-foreground",
      }
    : null

  return (
    <div className="space-y-5">
      <section id="supplier" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Исполнитель</h2>
        {proposal.supplier ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Имя
              </dt>
              <dd className="mt-1 text-sm font-medium">{partyLabel(proposal.supplier)}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium">{proposal.supplier.email || "—"}</dd>
            </div>
            {proposal.supplier.company_id && (
              <div>
                <dt className="text-[12.5px] font-medium text-muted-foreground">
                  Компания
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <AdminLink
                    href={`/admin/companies/${proposal.supplier.company_id}`}
                    className="text-primary hover:underline"
                  >
                    {proposal.supplier.company_title || `ID ${proposal.supplier.company_id}`}
                  </AdminLink>
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <EmptyState>Исполнитель не найден.</EmptyState>
        )}
      </section>

      <section id="buyer" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Покупатель</h2>
        {proposal.buyer ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Имя
              </dt>
              <dd className="mt-1 text-sm font-medium">{partyLabel(proposal.buyer)}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium">{proposal.buyer.email || "—"}</dd>
            </div>
            {proposal.rfq && (
              <div>
                <dt className="text-[12.5px] font-medium text-muted-foreground">
                  Заявка
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <AdminLink
                    href={`/admin/rfqs/${proposal.rfq.id}`}
                    className="text-primary hover:underline"
                  >
                    {proposal.rfq.title}
                  </AdminLink>
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <EmptyState>Покупатель не найден.</EmptyState>
        )}
      </section>

      <section id="price" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Цена</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Сумма
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatMoney(proposal.price, proposal.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Срок
            </dt>
            <dd className="mt-1 text-sm font-medium">{proposal.delivery_time || "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Сообщение предложения
            </dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground">
              {proposal.message || "Без комментария"}
            </dd>
          </div>
        </dl>
      </section>

      <section id="attachments" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Вложения</h2>
        {proposal.attachment ? (
          <a
            href={resolveFileUrl(proposal.attachment.file_url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <FileText size={15} aria-hidden="true" />
            {proposal.attachment.file_name}
          </a>
        ) : (
          <EmptyState>Вложений нет.</EmptyState>
        )}
      </section>

      <section id="messages" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Сообщения</h2>
        {proposal.messages.length ? (
          <div className="space-y-3">
            {proposal.messages.map((message) => (
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

      <section id="contract" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Контракт</h2>
        {proposal.contract ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Название
              </dt>
              <dd className="mt-1 text-sm font-medium">{proposal.contract.title}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Статус
              </dt>
              <dd className="mt-1 text-sm font-medium">
                <Badge variant="outline" className={contractStatus?.className}>
                  {contractStatus?.label}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Сумма
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatMoney(proposal.contract.agreed_amount, proposal.contract.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Создан
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDate(proposal.contract.created_at)}
              </dd>
            </div>
          </dl>
        ) : (
          <EmptyState>Контракт ещё не создан.</EmptyState>
        )}
      </section>

      <section id="reports" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Жалобы</h2>
        {proposal.reports.length ? (
          <div className="space-y-3">
            {proposal.reports.map((report) => (
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
