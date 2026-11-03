"use client"

import Image from "next/image"
import { FileTextIcon as FileText, ImageIcon, StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import type { AdminCatalogDetail } from "@/lib/api/admin"
import {
  adminActorKindLabels,
  adminHistoryActionLabels,
  adminLabel,
  adminReportStatusLabels,
} from "@/lib/admin-display"
import { catalogReportReasonLabels, formatItemPricing, itemStatusMeta } from "@/lib/item-display"
import type { ItemPricing, ItemStatus } from "@/types"
import { resolveFileUrl } from "@/lib/file-url"

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

const changedFieldLabels: Record<string, string> = {
  type: "тип",
  category_id: "категория",
  title: "название",
  description: "описание",
  invoice: "работа по счёту",
  pricing: "цена",
  attributes: "характеристики",
}

export const AdminCatalogDetailSections = ({
  item,
  mediaEditor,
}: {
  item: AdminCatalogDetail
  mediaEditor?: React.ReactNode
}) => {
  const images = item.media.filter((media) => media.media_type === "image")
  const otherMedia = item.media.filter((media) => media.media_type !== "image")
  const pricing = item.pricing as ItemPricing | null

  return (
    <div className="space-y-5">
      <section id="images" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Изображения</h2>
        {mediaEditor ? mediaEditor : images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((media) => (
              <div
                key={media.id}
                className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary"
              >
                {media.file_url && media.file_url !== "#" ? (
                  <Image
                    src={resolveFileUrl(media.file_url)}
                    alt={media.file_name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="320px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Изображения не загружены.</EmptyState>
        )}
        {!mediaEditor && otherMedia.length > 0 && (
          <div className="mt-4 space-y-2">
            {otherMedia.map((media) => (
              <a
                key={media.id}
                href={resolveFileUrl(media.file_url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <FileText size={15} aria-hidden="true" />
                {media.file_name}
              </a>
            ))}
          </div>
        )}
      </section>

      <section id="description" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Описание</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {item.description || "Описание не заполнено."}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Категория
            </dt>
            <dd className="mt-1 text-sm font-medium">{item.category?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Цена
            </dt>
            <dd className="mt-1 text-sm font-medium">{formatItemPricing(pricing)}</dd>
          </div>
        </dl>
      </section>

      <section id="attributes" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Атрибуты</h2>
        {item.attributes.length ? (
          <div className="divide-y divide-border">
            {item.attributes.map((attribute) => (
              <div
                key={attribute.id}
                className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_1.5fr]"
              >
                <p className="text-sm font-semibold">{attribute.name}</p>
                <p className="text-sm text-muted-foreground">{attribute.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Атрибуты не указаны.</EmptyState>
        )}
      </section>

      <section id="owner" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Владелец</h2>
        {item.owner ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Имя / компания
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {item.owner.company_title || item.owner.name}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Email
              </dt>
              <dd className="mt-1 text-sm font-medium">{item.owner.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Профиль
              </dt>
              <dd className="mt-1 text-sm font-medium">
                #{item.owner.actor_id} ·{" "}
                {adminLabel(adminActorKindLabels, item.owner.actor_kind)}
              </dd>
            </div>
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Метрики
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {item.stats.views} просмотров · {item.stats.leads} лидов
              </dd>
            </div>
          </dl>
        ) : (
          <EmptyState>Владелец не найден.</EmptyState>
        )}
      </section>

      <section id="reports" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Жалобы ({item.reports.length})</h2>
        {item.reports.length ? (
          <div className="space-y-3">
            {item.reports.map((report) => (
              <article key={report.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">
                    {catalogReportReasonLabels[
                      report.reason as keyof typeof catalogReportReasonLabels
                    ] || report.reason}
                  </p>
                  <Badge variant="outline">
                    {adminLabel(adminReportStatusLabels, report.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {report.details || "Без комментария"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {report.reporter.name || report.reporter.email} · {formatDate(report.created_at)}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>Жалоб пока нет.</EmptyState>
        )}
      </section>

      <section id="history" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">История ({item.history.length})</h2>
        {item.history.length ? (
          <div className="space-y-3">
            {item.history.map((entry) => {
              const previousStatus = String(entry.details.previous_status || "")
              const nextStatus = String(entry.details.status || "")
              const changedFields = Array.isArray(entry.details.fields)
                ? entry.details.fields.map((field) => changedFieldLabels[String(field)] || String(field))
                : []
              return (
                <article key={entry.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">
                      {adminLabel(adminHistoryActionLabels, entry.action)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.actor?.name || entry.actor?.email || "Система"}
                    {previousStatus && nextStatus
                      ? ` · ${itemStatusMeta[previousStatus as ItemStatus]?.label || previousStatus} → ${itemStatusMeta[nextStatus as ItemStatus]?.label || nextStatus}`
                      : ""}
                  </p>
                  {changedFields.length > 0 && (
                    <p className="mt-2 text-sm">Изменено: {changedFields.join(", ")}</p>
                  )}
                  {Boolean(entry.details.file_name) && (
                    <p className="mt-2 text-sm">Файл: {String(entry.details.file_name)}</p>
                  )}
                  {Boolean(entry.details.reason) && (
                    <p className="mt-2 text-sm">Причина: {String(entry.details.reason)}</p>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState>История модерации пуста.</EmptyState>
        )}
      </section>
    </div>
  )
}
