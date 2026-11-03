"use client"

import type { AdminReportDetail } from "@/lib/api/admin"
import {
  adminHistoryActionLabels,
  adminLabel,
  adminReportReasonLabels,
  adminReportStatusLabels,
  adminReportTargetLabels,
} from "@/lib/admin-display"
import { resolveFileUrl } from "@/lib/file-url"

const sectionClassName = "rounded-xl border border-border bg-card p-5 sm:p-6"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

type AdminReportDetailSectionsProps = {
  report: AdminReportDetail
}

export const AdminReportDetailSections = ({
  report,
}: AdminReportDetailSectionsProps) => {
  const owner =
    report.owner ||
    report.reported_object.owner ||
    null
  const ownerName =
    owner?.company_title || owner?.name || owner?.display_name || "—"

  return (
    <div className="space-y-5">
      <section id="reporter" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Заявитель</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Имя
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {report.reporter.name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Email
            </dt>
            <dd className="mt-1 text-sm">{report.reporter.email}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              ID
            </dt>
            <dd className="mt-1 text-sm">#{report.reporter.id}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Дата жалобы
            </dt>
            <dd className="mt-1 text-sm">{formatDate(report.created_at)}</dd>
          </div>
        </dl>
      </section>

      <section id="reported-object" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Объект</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Тип
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {adminLabel(adminReportTargetLabels, report.target_type)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Причина
            </dt>
            <dd className="mt-1 text-sm font-semibold">
              {adminLabel(adminReportReasonLabels, report.reason)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Название
            </dt>
            <dd className="mt-1">
              <a
                href={report.reported_object.href}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {report.reported_object.title}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Статус объекта
            </dt>
            <dd className="mt-1 text-sm">
              {report.reported_object.status || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Владелец
            </dt>
            <dd className="mt-1 text-sm">{ownerName}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Статус жалобы
            </dt>
            <dd className="mt-1 text-sm">
              {adminLabel(adminReportStatusLabels, report.status)}
            </dd>
          </div>
        </dl>
      </section>

      <section id="evidence" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Доказательства</h2>
        <p className="text-sm leading-relaxed text-foreground">
          {report.evidence.details || "Комментарий к жалобе не указан."}
        </p>
        {report.evidence.files.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {report.evidence.files.map((file) => (
              <li key={`${file.file_url}-${file.file_name}`}>
                <a
                  href={resolveFileUrl(file.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {file.file_name}
                </a>
                <span className="ml-2 text-xs text-muted-foreground">
                  {file.file_type}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Файлы к жалобе или объекту отсутствуют.
          </p>
        )}
      </section>

      <section id="history" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">История</h2>
        {report.history.length ? (
          <ol className="space-y-3">
            {report.history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-border px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {adminLabel(adminHistoryActionLabels, entry.action)}
                  </p>
                  <time className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </time>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.actor?.name || entry.actor?.email || "Система"}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">История пока пуста.</p>
        )}
      </section>
    </div>
  )
}
