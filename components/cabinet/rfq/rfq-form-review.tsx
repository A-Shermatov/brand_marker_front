"use client"

import {
  BriefcaseIcon,
  InfoIcon,
  PackageIcon,
  PaperclipIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr"
import { FactGrid, type RequestFact } from "@/components/rfq/fact-tile"

export type ReviewPosition = { name: string; qty: string; unit: string }

type RfqReviewProps = {
  type: "product" | "service"
  title: string
  categoryLabel: string
  /** Goods: what to buy, line by line. */
  positions?: ReviewPosition[]
  /** A service's description, or the buyer's extra wishes for goods. */
  details?: string
  detailsLabel?: string
  filesCount: number
  /** Budget, deadlines, delivery, payment — the terms a supplier reads first. */
  facts: RequestFact[]
  /** What happens after "Опубликовать". */
  footnote: string
  onEdit: (step: 1 | 2) => void
}

function EditButton({ what, onClick }: { what: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Изменить: ${what}`}
      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
    >
      <PencilSimpleIcon weight="bold" className="size-3.5" aria-hidden />
      Изменить
    </button>
  )
}

/**
 * The last step of a new request: the request as suppliers will see it. A card
 * with the name on top, what is needed under it, then the terms as tiles —
 * each part with its own "Изменить" that leads back to the step it came from.
 */
export function RfqReview({
  type,
  title,
  categoryLabel,
  positions = [],
  details,
  detailsLabel = "Подробности",
  filesCount,
  facts,
  footnote,
  onEdit,
}: RfqReviewProps) {
  const TypeIcon = type === "product" ? PackageIcon : BriefcaseIcon
  const named = positions.filter((item) => item.name.trim())

  return (
    <div className="grid gap-4 bm-rise">
      <section
        aria-label="Что нужно"
        className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(14_22_48/0.04)]"
      >
        <header className="flex items-start gap-3 border-b border-line bg-brand-50/60 px-5 py-4 sm:px-6">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-card text-brand-600 shadow-[0_1px_2px_rgb(14_22_48/0.06)]"
            aria-hidden
          >
            <TypeIcon weight="duotone" className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-brand-700">
              {type === "product" ? "Товары" : "Услуга"}
              <span className="mx-1.5 text-mute" aria-hidden>
                ·
              </span>
              <span className="text-ink-soft">{categoryLabel}</span>
            </p>
            <h2 className="mt-0.5 wrap-break-word text-[19px] font-semibold leading-snug tracking-[-0.01em] text-ink">
              {title.trim() || "Без названия"}
            </h2>
          </div>
          <EditButton what="что нужно" onClick={() => onEdit(1)} />
        </header>

        <div className="grid gap-4 px-5 py-4 sm:px-6">
          {named.length > 0 ? (
            <div>
              <h3 className="mb-2 text-[12.5px] font-medium uppercase tracking-[0.04em] text-mute">
                Позиции · {named.length}
              </h3>
              <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {named.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="flex items-baseline gap-3 px-3.5 py-2.5">
                    <span className="w-5 shrink-0 text-[13px] text-mute tnum">{index + 1}</span>
                    <span className="min-w-0 flex-1 wrap-break-word text-[14.5px] text-ink">{item.name.trim()}</span>
                    <span className="shrink-0 whitespace-nowrap text-[14.5px] font-semibold text-ink tnum">
                      {item.qty || "1"} {item.unit}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {details?.trim() ? (
            <div>
              <h3 className="mb-1.5 text-[12.5px] font-medium uppercase tracking-[0.04em] text-mute">
                {detailsLabel}
              </h3>
              <p className="whitespace-pre-line wrap-break-word text-[14.5px] leading-relaxed text-ink-soft">
                {details.trim()}
              </p>
            </div>
          ) : null}

          <p className="flex items-center gap-2 text-[13.5px] text-mute">
            <PaperclipIcon className="size-4 shrink-0" aria-hidden />
            {filesCount > 0 ? `Приложено файлов: ${filesCount}` : "Файлы не приложены"}
          </p>
        </div>
      </section>

      <section
        aria-label="Условия"
        className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgb(14_22_48/0.04)] sm:p-6"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-ink">Условия</h2>
          <EditButton what="условия" onClick={() => onEdit(2)} />
        </div>
        <FactGrid facts={facts} columns={2} />
      </section>

      <p className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-ink-soft">
        <InfoIcon weight="duotone" className="mt-0.5 size-[18px] shrink-0 text-brand-600" aria-hidden />
        {footnote}
      </p>
    </div>
  )
}
