import { CheckCircleIcon as CheckCircle2, BriefcaseIcon as Briefcase, StarIcon as Star, ChatTextIcon as MessageSquare, WarningIcon as AlertTriangle } from "@phosphor-icons/react/dist/ssr"
import { formatRating } from "@/lib/format"
import type { PublicSupplier } from "@/types"

type SupplierStatsPanelProps = {
  supplier: PublicSupplier
}

const formatSuccessRate = (value: number): string =>
  Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`

export const SupplierStatsPanel = ({ supplier }: SupplierStatsPanelProps) => {
  const completed = supplier.completed_contracts ?? 0
  const active = supplier.active_contracts ?? 0
  const disputed = supplier.disputed_contracts ?? 0
  const successRate = supplier.success_rate ?? null

  const stats = [
    {
      key: "completed",
      label: "Завершённые",
      value: String(completed),
      Icon: CheckCircle2,
    },
    {
      key: "active",
      label: "В работе",
      value: String(active),
      Icon: Briefcase,
    },
    {
      key: "rating",
      label: "Рейтинг",
      value: formatRating(supplier.rating),
      Icon: Star,
    },
    {
      key: "reviews",
      label: "Отзывы",
      value: String(supplier.reviews_count),
      Icon: MessageSquare,
    },
  ]

  if (disputed > 0) {
    stats.push({
      key: "disputed",
      label: "Споры",
      value: String(disputed),
      Icon: AlertTriangle,
    })
  }

  return (
    <section
      className="bg-card border border-border rounded-xl p-5 sm:p-6"
      aria-label="Статистика исполнителя"
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8">
        {successRate != null && (
          <div className="sm:min-w-35">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Успешность
            </p>
            <p className="mt-1 text-3xl font-bold text-primary tabular-nums">
              {formatSuccessRate(successRate)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground leading-snug">
              Доля успешно завершённых сделок
            </p>
          </div>
        )}

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {stats.map(({ key, label, value, Icon }) => (
            <div
              key={key}
              className="rounded-xl bg-secondary/60 px-3 py-3"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon size={14} aria-hidden="true" />
                <span className="text-[11px] font-medium">{label}</span>
              </div>
              <p className="mt-1.5 text-lg font-bold text-foreground tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
