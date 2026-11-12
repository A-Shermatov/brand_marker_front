"use client"

import { AdminLink } from "@/components/admin/admin-link"
import { formatCurrency } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import type { AdminFinanceDetail, AdminParty } from "@/lib/api/admin"
import {
  adminActorKindLabels,
  adminFinanceGatewayLabels,
  adminFinanceStatusMeta,
  adminFinanceTypeLabels,
  adminHistoryActionLabels,
  adminLabel,
} from "@/lib/admin-display"

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

const partyLabel = (party: AdminParty | null | undefined) =>
  party?.company_title || party?.name || party?.display_name || "—"

export const AdminFinanceDetailSections = ({
  payment,
}: {
  payment: AdminFinanceDetail
}) => {
  const statusMeta = adminFinanceStatusMeta[payment.status] || {
    label: payment.status,
    className: "bg-muted text-muted-foreground",
  }

  return (
    <div className="space-y-5">
      <section id="transaction" className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">Платёж</h2>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
          <Badge variant="outline">
            {adminLabel(adminFinanceTypeLabels, payment.type)}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {payment.description || "Описание отсутствует."}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              ID
            </dt>
            <dd className="mt-1 text-sm font-medium">#{payment.id}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              External ID
            </dt>
            <dd className="mt-1 text-sm font-medium">{payment.external_id || "—"}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Сумма
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatMoney(payment.amount, payment.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Создан
            </dt>
            <dd className="mt-1 text-sm font-medium">{formatDate(payment.created_at)}</dd>
          </div>
          {payment.paid_at && (
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Оплачен
              </dt>
              <dd className="mt-1 text-sm font-medium">{formatDate(payment.paid_at)}</dd>
            </div>
          )}
          {payment.contract && (
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Контракт
              </dt>
              <dd className="mt-1 text-sm font-medium">
                <AdminLink
                  href={`/admin/contracts/${payment.contract.id}`}
                  className="text-primary hover:underline"
                >
                  {payment.contract.title}
                </AdminLink>
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section id="gateway" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Через что прошёл</h2>
        <p className="text-sm font-medium">
          {adminLabel(adminFinanceGatewayLabels, payment.gateway)}
        </p>
      </section>

      <section id="status" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Статус</h2>
        <Badge variant="outline" className={statusMeta.className}>
          {statusMeta.label}
        </Badge>
        {payment.failed_at && (
          <p className="mt-3 text-sm text-muted-foreground">
            Ошибка: {formatDate(payment.failed_at)}
          </p>
        )}
        {payment.refunded_at && (
          <p className="mt-3 text-sm text-muted-foreground">
            Возврат: {formatDate(payment.refunded_at)}
          </p>
        )}
      </section>

      <section id="commission" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Комиссия</h2>
        <p className="text-2xl font-bold">
          {formatMoney(payment.commission, payment.currency)}
        </p>
      </section>

      <section id="invoice" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Счёт</h2>
        {payment.invoice ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Номер
              </dt>
              <dd className="mt-1 text-sm font-medium">{payment.invoice.number}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Статус
              </dt>
              <dd className="mt-1 text-sm font-medium">{payment.invoice.status}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Сумма
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatMoney(payment.invoice.amount, payment.invoice.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Название
              </dt>
              <dd className="mt-1 text-sm font-medium">{payment.invoice.title}</dd>
            </div>
          </dl>
        ) : (
          <EmptyState>Счёт не привязан.</EmptyState>
        )}
      </section>

      <section id="actor" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Сторона</h2>
        {payment.actor ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Имя
              </dt>
              <dd className="mt-1 text-sm font-medium">{partyLabel(payment.actor)}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium">{payment.actor.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Профиль
              </dt>
              <dd className="mt-1 text-sm font-medium">
                #{payment.actor.actor_id} ·{" "}
                {adminLabel(adminActorKindLabels, payment.actor.actor_kind)}
              </dd>
            </div>
          </dl>
        ) : (
          <EmptyState>Сторона не указана.</EmptyState>
        )}
      </section>

      <section id="history" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">История</h2>
        {payment.history.length ? (
          <div className="space-y-3">
            {payment.history.map((entry) => (
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
