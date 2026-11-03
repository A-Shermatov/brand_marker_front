import Link from "next/link"
import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

export type ChecklistItem = {
  id: string
  label: string
  done: boolean
  href?: string
  cta?: string
}

type ProfileChecklistProps = {
  items: ChecklistItem[]
  title?: string
  description?: string
}

export const ProfileChecklist = ({
  items,
  title = "Подготовьте профиль",
  description = "Заказчики чаще выбирают исполнителей с полным профилем",
}: ProfileChecklistProps) => {
  const total = items.length
  const done = items.filter((i) => i.done).length
  if (total === 0 || done === total) return null
  const percent = Math.round((done / total) * 100)

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-white p-5" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-semibold text-ink">{title}</h2>
          <p className="text-[13.5px] text-mute">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 w-32 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Готовность профиля"
          >
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-[13px] font-medium text-ink-soft tnum">
            {done} из {total}
          </span>
        </div>
      </div>
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="flex min-h-10 items-center gap-3 border-b border-line py-2 last:border-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-0">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full",
                item.done ? "bg-brand-600 text-white" : "border border-dashed border-faint",
              )}
              aria-hidden="true"
            >
              {item.done ? <Check size={12} weight="bold" /> : null}
            </span>
            <span className={cn("flex-1 text-[14px]", item.done ? "text-mute line-through decoration-line-strong" : "text-ink")}>
              {item.label}
              <span className="sr-only">{item.done ? " — готово" : " — не сделано"}</span>
            </span>
            {!item.done && item.href ? (
              <Link href={item.href} className="text-[13.5px] font-semibold text-brand-700 hover:underline">
                {item.cta ?? "Добавить"}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
