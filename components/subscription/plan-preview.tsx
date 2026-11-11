import { PromotedTag, promotedCardClass } from "@/components/bm/promoted"
import { PLAN_SIDE_COPY, type PlanSide } from "@/lib/subscription"
import { cn } from "@/lib/utils"

/** A card of a list, drawn without data: only what a plan changes about it. */
function MockCard({ title, promoted, place }: { title: string; promoted?: boolean; place: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-card p-3.5 transition-colors",
        promoted && promotedCardClass,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="h-[18px] w-20 rounded-md bg-surface-muted" aria-hidden />
        {promoted ? <PromotedTag /> : null}
        <span className="ml-auto text-[12px] text-mute">{place}</span>
      </div>
      <p className="mt-2 truncate text-[15px] font-semibold text-ink">{title}</p>
      <div className="mt-2 grid gap-1.5" aria-hidden>
        <span className="h-2 w-3/4 rounded-full bg-surface-muted" />
        <span className="h-2 w-1/2 rounded-full bg-surface-muted" />
      </div>
    </div>
  )
}

/**
 * "Without a plan" next to "with a plan": the same card in the list the other
 * side reads. Shows the two things a plan changes — the place and the colour —
 * and nothing it does not.
 */
export function PlanPreview({ side, title }: { side: PlanSide; title?: string | null }) {
  const copy = PLAN_SIDE_COPY[side]
  const name = title?.trim() || (side === "buyer" ? "Ваша заявка" : "Ваш товар или услуга")
  return (
    <section aria-label="Как это выглядит" className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-[16px] font-semibold text-ink">Как это видят {copy.audience}</h2>
      <p className="mt-0.5 text-[13.5px] text-mute">
        {side === "buyer"
          ? "Лента заявок у поставщиков: слева заявка без подписки, справа — с подпиской."
          : "Каталог и список предложений у покупателей: слева без подписки, справа — с подпиской."}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <figure className="grid content-start gap-2">
          <figcaption className="text-[12.5px] font-medium text-mute">Без подписки</figcaption>
          <MockCard title={name} place="по дате, среди остальных" />
        </figure>
        <figure className="grid content-start gap-2">
          <figcaption className="text-[12.5px] font-medium text-amber-800">С подпиской</figcaption>
          <MockCard title={name} promoted place="в начале списка" />
        </figure>
      </div>
    </section>
  )
}
