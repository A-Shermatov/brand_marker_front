"use client"

import { use, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { StackIcon as Boxes, CheckCircleIcon as CheckCircle2, EyeSlashIcon as EyeOff, PackageIcon as Package, PencilSimpleIcon as Pencil, ArrowsCounterClockwiseIcon as RefreshCcw, ArrowCounterClockwiseIcon as RotateCcw, TrashIcon as Trash2, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { AdminLink } from "@/components/admin/admin-link"
import { CatalogActionDialog } from "@/components/admin/catalog/catalog-action-dialog"
import { AdminCatalogDetailSections } from "@/components/admin/catalog/catalog-detail-sections"
import { CatalogEditDialog } from "@/components/admin/catalog/catalog-edit-dialog"
import { CatalogMediaManager } from "@/components/admin/catalog/catalog-media-manager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminCatalogItemQuery } from "@/hooks/api/use-admin-catalog-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminCatalogAction } from "@/lib/api/admin"
import { catalogItemTypeLabel, itemStatusMeta } from "@/lib/item-display"
import { resolveFileUrl } from "@/lib/file-url"
import type { ItemStatus } from "@/types"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"

const sections = [
  ["images", "Изображения"],
  ["description", "Описание"],
  ["attributes", "Атрибуты"],
  ["owner", "Владелец"],
  ["reports", "Жалобы"],
  ["history", "История"],
] as const

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

export default function AdminCatalogDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const itemId = Number(id)
  const itemQuery = useAdminCatalogItemQuery(itemId)
  const [selectedAction, setSelectedAction] = useState<AdminCatalogAction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const canUpdate = useAdminPermission("admin_catalog.update")
  const canDelete = useAdminPermission("admin_catalog.delete")

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID позиции</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/catalog">Вернуться к каталогу</Link>
        </Button>
      </div>
    )
  }

  if (itemQuery.isLoading) return <DetailSkeleton />

  if (itemQuery.isError || !itemQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <Boxes className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Позиция не найдена</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/catalog">К списку</Link>
            </Button>
            <Button type="button" onClick={() => itemQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const item = itemQuery.data
  const statusMeta = itemStatusMeta[item.status as ItemStatus] || {
    label: item.status,
    className: "bg-muted text-muted-foreground",
  }
  const isDeleted = item.status === "deleted"
  const canRestore = item.status === "hidden" || item.status === "archived" || isDeleted
  const editable = canUpdate && !isDeleted

  return (
    <PageFrame>
      <PageHeader
        title={item.title}
        description={
          <>
            {item.owner?.company_id ? (
              <AdminLink
                href={`/admin/companies/${item.owner.company_id}`}
                className="hover:text-primary hover:underline"
              >
                {item.owner.company_title || item.owner.name}
              </AdminLink>
            ) : (
              item.owner?.name || "Без владельца"
            )}
            {item.category_name ? ` · ${item.category_name}` : ""}
          </>
        }
        backHref="/admin/catalog"
        backLabel="Товары и услуги"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
              {item.preview_url && item.preview_url !== "#" ? (
                <Image
                  src={resolveFileUrl(item.preview_url)}
                  alt=""
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <Package size={24} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-muted-foreground">
                {catalogItemTypeLabel[item.type]} #{item.id}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className={statusMeta.className}>
                  {statusMeta.label}
                </Badge>
                {item.open_reports_count > 0 && (
                  <Badge variant="outline">Жалоб: {item.open_reports_count}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
            {editable && (
              <Button type="button" size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" />
                Редактировать
              </Button>
            )}
            {canUpdate && canRestore && (
              <Button type="button" size="sm" onClick={() => setSelectedAction("restore")}>
                <RotateCcw aria-hidden="true" />
                {isDeleted ? "Восстановить" : "Вернуть в каталог"}
              </Button>
            )}
            {canUpdate && !isDeleted && item.status !== "active" && !canRestore && (
              <Button type="button" size="sm" onClick={() => setSelectedAction("approve")}>
                <CheckCircle2 aria-hidden="true" />
                Одобрить
              </Button>
            )}
            {canUpdate && item.status === "active" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("hide")}
              >
                <EyeOff aria-hidden="true" />
                Скрыть
              </Button>
            )}
            {canUpdate &&
              (item.status === "pending_review" ||
                item.status === "active" ||
                item.status === "draft") && (
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
            {canDelete && !isDeleted && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setSelectedAction("delete")}
              >
                <Trash2 aria-hidden="true" />
                Удалить
              </Button>
            )}
          </div>
        </div>
      </PageSurface>

      <nav
        className="sticky top-17 z-20 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/95 p-2 backdrop-blur"
        aria-label="Разделы карточки позиции"
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

      <AdminCatalogDetailSections
        item={item}
        mediaEditor={editable ? <CatalogMediaManager item={item} /> : undefined}
      />

      <CatalogActionDialog
        itemId={item.id}
        itemTitle={item.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
      {editable && (
        <CatalogEditDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </PageFrame>
  )
}
