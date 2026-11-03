import Link from "next/link"
import Image from "next/image"
import { BadgeCheck, Clock, Crown, MapPin, Star, Users } from "lucide-react"
import type { MarketplacePerformer } from "@/types/marketplace"
import { getIcon } from "@/lib/icon-map"
import { performerUrl } from "@/lib/marketplace-routes"
import { resolveFileUrl } from "@/lib/file-url"

type PerformerCardProps = {
  performer: MarketplacePerformer
}

export const PerformerCard = ({ performer }: PerformerCardProps) => {
  const Icon = getIcon(performer.icon)

  return (
    <Link
      href={performerUrl(performer.id)}
      className="border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-200 group bg-white"
    >
      <div className="flex items-start gap-4">
        <div className={`${performer.color} w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
          {performer.imageUrl ? (
            <Image
              src={resolveFileUrl(performer.imageUrl)}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : performer.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {performer.name}
            </span>
            {performer.verified && <BadgeCheck size={14} className="text-primary flex-shrink-0" />}
            {performer.vip && (
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Crown size={10} aria-hidden="true" />
                VIP
              </span>
            )}
            {performer.promoted && !performer.vip && (
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                Продвигается
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon size={11} className="text-muted-foreground" />
            <div className="text-xs text-muted-foreground">{performer.category}</div>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-0.5">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold">{performer.rating}</span>
              <span className="text-xs text-muted-foreground">({performer.reviews})</span>
            </div>
            <span className="text-muted-foreground/40 text-xs">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={10} />
              {performer.city}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
        <span className="flex items-center gap-1.5">
          <Users size={12} className="text-primary" />
          <span className="font-semibold text-foreground">{performer.clients}</span> клиентов
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-primary" />
          на рынке <span className="font-semibold text-foreground">{performer.years}</span>
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {performer.specialties.map((spec) => (
          <span key={spec} className="text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded-lg font-medium">
            {spec}
          </span>
        ))}
      </div>
    </Link>
  )
}
