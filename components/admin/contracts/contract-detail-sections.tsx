"use client"

import { AdminLink } from "@/components/admin/admin-link"
import { formatCurrency } from "@/lib/format"
import { FileTextIcon as FileText } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import type { AdminContractDetail, AdminParty } from "@/lib/api/admin"
import {
  adminActorKindLabels,
  adminHistoryActionLabels,
  adminLabel,
} from "@/lib/admin-display"
import {
  contractStatusMeta,
  escrowSummaryMeta,
  milestoneStatusMeta,
} from "@/lib/contract-display"
import { milestoneTriggerLabel, paymentTypeMeta } from "@/lib/payment-display"
import { resolveFileUrl } from "@/lib/file-url"
import type {
  ContractStatus,
  PaymentMilestoneStatus,
  PaymentMilestoneTrigger,
  PaymentType,
} from "@/types"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sectionClassName = "scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

const fileUploaderSideLabel: Record<"buyer" | "supplier", string> = {
  buyer: "Покупатель",
  supplier: "Поставщик",
}

const fileMetaLine = (file: AdminContractDetail["files"][number]): string => {
  const parts: string[] = []
  if (file.uploaded_by_name) parts.push(file.uploaded_by_name)
  if (file.uploaded_by_side) parts.push(fileUploaderSideLabel[file.uploaded_by_side])
  parts.push(formatDate(file.created_at))
  return parts.join(" · ")
}


const EmptyState = ({ children }: { children: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
)

const partyLabel = (party: AdminParty | null | undefined) =>
  party?.company_title || party?.name || party?.display_name || "—"

const PartySection = ({
  id,
  title,
  party,
}: {
  id: string
  title: string
  party: AdminParty | null
}) => (
  <section id={id} className={sectionClassName}>
    <h2 className="mb-5 text-lg font-bold">{title}</h2>
    {party ? (
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[12.5px] font-medium text-muted-foreground">
            Имя
          </dt>
          <dd className="mt-1 text-sm font-medium">{partyLabel(party)}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] font-medium text-muted-foreground">
            Email
          </dt>
          <dd className="mt-1 text-sm font-medium">{party.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] font-medium text-muted-foreground">
            Профиль
          </dt>
          <dd className="mt-1 text-sm font-medium">
            #{party.actor_id} · {adminLabel(adminActorKindLabels, party.actor_kind)}
          </dd>
        </div>
        {party.company_id && (
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Компания
            </dt>
            <dd className="mt-1 text-sm font-medium">
              <AdminLink
                href={`/admin/companies/${party.company_id}`}
                className="text-primary hover:underline"
              >
                {party.company_title || `ID ${party.company_id}`}
              </AdminLink>
            </dd>
          </div>
        )}
      </dl>
    ) : (
      <EmptyState>{`${title} не найден.`}</EmptyState>
    )}
  </section>
)

export const AdminContractDetailSections = ({
  contract,
}: {
  contract: AdminContractDetail
}) => {
  const statusMeta = contractStatusMeta[contract.status as ContractStatus] || {
    label: contract.status,
    className: "bg-muted text-muted-foreground",
  }
  const paymentLabel =
    paymentTypeMeta[contract.payment_type as PaymentType]?.label || contract.payment_type

  return (
    <div className="space-y-5">
      <section id="overview" className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">Обзор</h2>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {contract.description || "Описание не заполнено."}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Сумма
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatMoney(contract.agreed_amount, contract.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Тип оплаты
            </dt>
            <dd className="mt-1 text-sm font-medium">{paymentLabel}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Старт
            </dt>
            <dd className="mt-1 text-sm font-medium">{contract.start_date}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Срок
            </dt>
            <dd className="mt-1 text-sm font-medium">{contract.due_date}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              RFQ
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {contract.rfq ? (
                <AdminLink
                  href={`/admin/rfqs/${contract.rfq.id}`}
                  className="text-primary hover:underline"
                >
                  {contract.rfq.title}
                </AdminLink>
              ) : (
                contract.rfq_id
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Предложение
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {contract.proposal ? (
                <AdminLink
                  href={`/admin/proposals/${contract.proposal.id}`}
                  className="text-primary hover:underline"
                >
                  #{contract.proposal.id} ·{" "}
                  {formatMoney(contract.proposal.price, contract.currency)}
                </AdminLink>
              ) : (
                `#${contract.proposal_id}`
              )}
            </dd>
          </div>
        </dl>
      </section>

      <PartySection id="buyer" title="Покупатель" party={contract.buyer} />
      <PartySection id="supplier" title="Поставщик" party={contract.supplier} />

      <section id="payment-plan" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">План оплаты</h2>
        {contract.payment_plan ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                ID плана
              </dt>
              <dd className="mt-1 text-sm font-medium">#{contract.payment_plan.id}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Тип
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {paymentTypeMeta[contract.payment_plan.payment_type as PaymentType]
                  ?.label || contract.payment_plan.payment_type}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Этапов
              </dt>
              <dd className="mt-1 text-sm font-medium">{contract.milestones.length}</dd>
            </div>
          </dl>
        ) : (
          <EmptyState>План оплаты отсутствует.</EmptyState>
        )}
      </section>

      <section id="milestones" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Этапы</h2>
        {contract.milestones.length ? (
          <div className="space-y-3">
            {contract.milestones.map((milestone) => {
              const meta =
                milestoneStatusMeta[milestone.status as PaymentMilestoneStatus] || {
                  label: milestone.status,
                  className: "bg-muted text-muted-foreground",
                }
              return (
                <div
                  key={milestone.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-bold">{milestone.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {milestone.percentage}% ·{" "}
                      {formatMoney(milestone.amount, contract.currency)}
                      {" · "}
                      {milestoneTriggerLabel[
                        milestone.trigger as PaymentMilestoneTrigger
                      ] || milestone.trigger}
                    </p>
                  </div>
                  <Badge variant="outline" className={meta.className}>
                    {meta.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState>Этапов нет.</EmptyState>
        )}
      </section>

      <section id="files" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Файлы</h2>
        {contract.files.length ? (
          <div className="space-y-2">
            {contract.files.map((file) => (
              <a
                key={file.id}
                href={resolveFileUrl(file.file_url)}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-0.5 text-sm font-medium text-primary hover:underline"
              >
                <span className="inline-flex items-center gap-2">
                  <FileText size={15} aria-hidden="true" />
                  {file.file_name}
                </span>
                <span className="pl-6 text-xs font-normal text-muted-foreground">
                  {fileMetaLine(file)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState>Файлов нет.</EmptyState>
        )}
      </section>

      <section id="messages" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Сообщения</h2>
        {contract.messages.length ? (
          <div className="space-y-3">
            {contract.messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">Пользователь #{message.sender_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(message.created_at)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Сообщений нет.</EmptyState>
        )}
      </section>

      <section id="escrow" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-semibold">Деньги на гарантии</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["held", contract.escrow.held],
              ["released", contract.escrow.released],
              ["disputed", contract.escrow.disputed],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                {escrowSummaryMeta[key].label}
              </dt>
              <dd className="mt-2 text-lg font-bold">
                {formatMoney(value, contract.escrow.currency)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="history" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">История</h2>
        {contract.history.length ? (
          <div className="space-y-3">
            {contract.history.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">
                    {adminLabel(adminHistoryActionLabels, entry.action)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.actor?.name || entry.actor?.email || "Система"}
                </p>
                {typeof entry.details?.reason === "string" && entry.details.reason && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Причина: {entry.details.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>История пуста.</EmptyState>
        )}
      </section>
    </div>
  )
}
