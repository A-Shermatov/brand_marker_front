import Link from "next/link"
import { EyeIcon as Eye, PackageIcon as Package, SparkleIcon as Sparkles } from "@phosphor-icons/react/dist/ssr"
import type { CatalogItemWithRelations } from "@/types"
import { cn } from "@/lib/utils"
import {
  formatItemPricing,
  getPricingMoq,
  itemStatusMeta,
} from "@/lib/item-display"
import { isApiEnabled } from "@/lib/api/config"
import { getCatalogCategory } from "@/lib/mock/catalog-categories"
import { scoreCatalogItem, scoreLevel } from "@/lib/catalog-quality-score"
import { serviceUrl } from "@/lib/marketplace-routes"
import { StatusBadge } from "@/components/bm"
import { Button } from "@/components/ui/button"

type CatalogProductRowProps = {
  item: CatalogItemWithRelations
}

const resolveCategoryName = (item: CatalogItemWithRelations): string => {
  if (item.category?.name) return item.category.name
  if (isApiEnabled()) return "—"
  return getCatalogCategory(item.category_id)?.name ?? "—"
}

export const CatalogProductRow = ({ item }: CatalogProductRowProps) => {
  const score = scoreCatalogItem(item)
  const level = scoreLevel(score)
  const meta = itemStatusMeta[item.status]
  const photo = item.media.find((m) => m.media_type === "image")
  const photoCount = item.media.filter((m) => m.media_type === "image").length
  const moq = getPricingMoq(item.pricing)
  const editHref = `/supplier/catalog/${item.id}`
  const needsImprove = score < 80

  return (
    <article className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4 sm:flex-nowrap">
      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-canvas">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.file_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-mute">
            <Package className="size-7" aria-hidden />
          </span>
        )}
      </div>

      <div className="grid min-w-[200px] flex-1 gap-1">
        <b className="line-clamp-2 text-[15.5px] leading-snug">{item.title}</b>
        <span className="text-[13.5px] text-mute">
          {resolveCategoryName(item)} · {formatItemPricing(item.pricing)}
          {item.pricing ? ` · мин. ${moq}` : null}
        </span>
        {item.status === "changes_requested" && item.rejection_reason ? (
          <span className="text-[13px] text-red-700">
            Модератор: {item.rejection_reason}
          </span>
        ) : null}
        <span className="mt-1 flex items-center gap-2">
          <StatusBadge status={item.status} label={meta.label} />
          <span className="text-[13px] text-mute">{photoCount} фото</span>
        </span>
      </div>

      <div className="grid w-44 gap-1.5">
        <span className="flex justify-between text-[13px]">
          <span className="text-mute">Качество</span>
          <b className={cn("tnum", level.textClass)}>{score}/100</b>
        </span>
        <span className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <span
            className={cn("block h-full", level.barClass)}
            style={{ width: `${score}%` }}
          />
        </span>
        <span className={cn("text-[12px]", level.textClass)}>{level.label}</span>
      </div>

      <div className="flex gap-2">
        <Button asChild variant={needsImprove ? "default" : "outline"} className="h-10">
          <Link href={editHref}>
            {needsImprove ? (
              <>
                <Sparkles className="size-4" aria-hidden />
                Улучшить
              </>
            ) : (
              "Изменить"
            )}
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-10 px-3" aria-label="Предпросмотр">
          <Link href={serviceUrl(item.id)} target="_blank" rel="noopener noreferrer">
            <Eye className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </article>
  )
}
