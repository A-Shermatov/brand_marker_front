"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArchiveIcon as Archive,
  ArrowCounterClockwiseIcon as Restore,
  EyeIcon as Eye,
  PackageIcon as Package,
  PencilSimpleIcon as Pencil,
  SparkleIcon as Sparkles,
  TrashIcon as Trash,
} from "@phosphor-icons/react/dist/ssr"
import type { CatalogItemWithRelations } from "@/types"
import { cn } from "@/lib/utils"
import { formatItemPricing, getPricingMoq, itemStatusMeta } from "@/lib/item-display"
import { isApiEnabled } from "@/lib/api/config"
import { getCatalogCategory } from "@/lib/mock/catalog-categories"
import { scoreCatalogItem, scoreLevel } from "@/lib/catalog-quality-score"
import { serviceUrl } from "@/lib/marketplace-routes"
import { StatusBadge } from "@/components/bm"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type CatalogProductCardProps = {
  item: CatalogItemWithRelations
  onArchive: (id: number) => Promise<unknown>
  onRestore: (id: number) => Promise<unknown>
  onDelete: (id: number) => Promise<unknown>
  busy?: boolean
}

const categoryName = (item: CatalogItemWithRelations): string => {
  if (item.category?.name) return item.category.name
  if (isApiEnabled()) return "Без категории"
  return getCatalogCategory(item.category_id)?.name ?? "Без категории"
}

type Confirm = "archive" | "delete" | null

/** One card of the supplier's showcase: photo, price, status, quality and actions. */
export const CatalogProductCard = ({
  item,
  onArchive,
  onRestore,
  onDelete,
  busy = false,
}: CatalogProductCardProps) => {
  const [confirm, setConfirm] = useState<Confirm>(null)
  const score = scoreCatalogItem(item)
  const level = scoreLevel(score)
  const meta = itemStatusMeta[item.status]
  const photo = item.media.find((m) => m.media_type === "image")
  const photoCount = item.media.filter((m) => m.media_type === "image").length
  const moq = getPricingMoq(item.pricing)
  const editHref = `/supplier/catalog/${item.id}`
  const archived = item.status === "archived"
  const canPreview = item.status === "active"

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <Link href={editHref} className="relative block aspect-[4/3] bg-canvas" aria-label={`Изменить «${item.title}»`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.file_url} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center gap-1 text-mute">
            <Package className="size-9" aria-hidden />
          </span>
        )}
        <span className="absolute left-3 top-3">
          <StatusBadge status={item.status} label={meta.label} />
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-card/90 px-2 py-0.5 text-[12px] text-ink-soft">
          {photoCount ? `${photoCount} фото` : "нет фото"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid gap-1">
          <span className="text-[12.5px] text-mute">{categoryName(item)}</span>
          <Link href={editHref} className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-ink hover:text-brand-700">
            {item.title}
          </Link>
          <span className="text-[14px] font-semibold tnum">
            {formatItemPricing(item.pricing)}
            {item.pricing ? <span className="font-normal text-mute">{`, от ${moq}`}</span> : null}
          </span>
        </div>

        {item.status === "changes_requested" && item.rejection_reason ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-800">
            Модератор: {item.rejection_reason}
          </p>
        ) : null}

        <div className="mt-auto grid gap-1.5">
          <span className="flex justify-between text-[13px]">
            <span className="text-mute">Качество карточки</span>
            <b className={cn("tnum", level.textClass)}>{score}/100</b>
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <span className={cn("block h-full", level.barClass)} style={{ width: `${score}%` }} />
          </span>
          {score < 80 ? (
            <Link href={editHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
              <Sparkles className="size-3.5" aria-hidden />
              Как улучшить
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1 border-t border-line p-2">
        <Button asChild variant="ghost" size="sm" className="flex-1">
          <Link href={editHref}>
            <Pencil aria-hidden />
            Изменить
          </Link>
        </Button>
        {archived ? (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => void onRestore(item.id)}
          >
            <Restore aria-hidden />
            Вернуть
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => setConfirm("archive")}
          >
            <Archive aria-hidden />
            В архив
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-red-700 hover:bg-red-50 hover:text-red-800"
          disabled={busy}
          onClick={() => setConfirm("delete")}
          aria-label={`Удалить «${item.title}»`}
        >
          <Trash aria-hidden />
        </Button>
        {canPreview ? (
          <Button asChild variant="ghost" size="icon-sm" aria-label="Как видят покупатели">
            <Link href={serviceUrl(item.id)} target="_blank" rel="noopener noreferrer">
              <Eye aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete" ? "Удалить карточку?" : "Перенести в архив?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? `«${item.title}» пропадёт из витрины и каталога. Вернуть её будет нельзя: при необходимости карточку придётся создать заново.`
                : `«${item.title}» скроется из каталога, но останется в разделе «Архив». Вернуть её можно в любой момент, после повторной проверки.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className={confirm === "delete" ? "bg-red-600 border-red-600 hover:bg-red-700 dark:bg-[#C93B3B] dark:border-[#C93B3B] dark:hover:bg-[#B23131]" : undefined}
              onClick={() => {
                const action = confirm === "delete" ? onDelete : onArchive
                setConfirm(null)
                void action(item.id)
              }}
            >
              {confirm === "delete" ? "Удалить" : "В архив"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
