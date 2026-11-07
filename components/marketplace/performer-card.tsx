import Link from "next/link"
import Image from "next/image"
import { ClockIcon, MapPinIcon, PackageIcon, StarIcon } from "@phosphor-icons/react/dist/ssr"
import type { MarketplacePerformer } from "@/types/marketplace"
import { CompanyName } from "@/components/bm"
import { performerUrl } from "@/lib/marketplace-routes"
import { resolveFileUrl } from "@/lib/file-url"
import { formatCount } from "@/lib/format"

type PerformerCardProps = {
  performer: MarketplacePerformer
}

export const PerformerCard = ({ performer }: PerformerCardProps) => {
  const products = Number(performer.clients) || 0
  const rated = performer.reviews > 0 && performer.rating > 0

  return (
    <Link
      href={performerUrl(performer.id)}
      className="group grid content-start gap-4 rounded-2xl border border-line bg-card p-5 transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-[0_10px_24px_-12px_rgba(28,28,26,.18)]"
    >
      <div className="flex items-start gap-3.5">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-tile text-[14px] font-semibold text-white">
          {performer.imageUrl ? (
            <Image
              src={resolveFileUrl(performer.imageUrl)}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="size-12 object-cover"
            />
          ) : (
            performer.initials
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <CompanyName
            name={performer.name}
            verified={performer.verified}
            tier={performer.tier}
            plan={performer.plan}
            size="md"
            nameClassName="group-hover:text-brand-700"
          />
          <p className="truncate text-[13px] text-mute">{performer.category}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-mute">
            {rated ? (
              <span className="inline-flex items-center gap-1">
                <StarIcon weight="fill" className="size-3.5 text-amber-500" aria-hidden />
                <b className="font-semibold text-ink tnum">{performer.rating.toFixed(1)}</b>
                <span className="tnum">· {formatCount(performer.reviews, "отзыв", "отзыва", "отзывов")}</span>
              </span>
            ) : (
              <span>Пока без отзывов</span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-3.5" aria-hidden />
              {performer.city}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-line pt-3 text-[12.5px] text-mute">
        <span className="inline-flex items-center gap-1.5">
          <PackageIcon className="size-4 text-ink-soft" aria-hidden />
          {products > 0 ? formatCount(products, "товар", "товара", "товаров") : "Товаров пока нет"}
        </span>
        {!performer.verified ? (
          <span className="inline-flex items-center gap-1.5 text-amber-700">
            <ClockIcon className="size-4" aria-hidden />
            На проверке
          </span>
        ) : null}
      </div>

      {performer.specialties.length > 0 ? (
        <div className="-mt-1 flex flex-wrap gap-1.5">
          {performer.specialties.slice(0, 4).map((spec) => (
            <span key={spec} className="rounded-md bg-surface-muted px-2 py-0.5 text-[12px] text-ink-soft">
              {spec}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  )
}
