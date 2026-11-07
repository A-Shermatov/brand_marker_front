import Link from "next/link"
import {
  CameraIcon,
  ListChecksIcon,
  PlusIcon,
  StorefrontIcon,
  TagIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"

const TIPS = [
  {
    Icon: CameraIcon,
    title: "Три фото и больше",
    text: "Первое фото видно в каталоге: товар целиком, на светлом фоне.",
  },
  {
    Icon: TagIcon,
    title: "Цена и минимальный заказ",
    text: "Покупатель сразу видит, подходит ли ему. Можно указать «по запросу».",
  },
  {
    Icon: ListChecksIcon,
    title: "Характеристики и описание",
    text: "Пять и больше характеристик поднимают карточку в поиске.",
  },
] as const

/**
 * An empty showcase: a first-step guide to a good product card rather than a
 * bare "empty" note. On a filtered tab only a short line is shown.
 */
export function ShowcaseEmpty({ filtered }: { filtered: boolean }) {
  if (filtered) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-12 text-center text-[14.5px] text-mute">
        В этом разделе пока нет карточек.
      </p>
    )
  }
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white" aria-label="Первый товар">
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            <StorefrontIcon weight="fill" className="size-7" aria-hidden />
          </span>
          <div className="grid gap-1">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">Добавьте первый товар или услугу</h2>
            <p className="max-w-xl text-[15px] text-mute">
              Покупатели выбирают поставщиков по карточкам в каталоге. Новая карточка проходит проверку обычно
              за один рабочий день.
            </p>
          </div>
        </div>
        <Button asChild size="lg">
          <Link href="/supplier/catalog/new">
            <PlusIcon weight="bold" />
            Добавить товар
          </Link>
        </Button>
      </div>
      <ul className="grid gap-px border-t border-line bg-line md:grid-cols-3">
        {TIPS.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-3 bg-canvas/50 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon weight="duotone" className="size-5" aria-hidden />
            </span>
            <span className="grid gap-0.5">
              <b className="text-[14.5px] font-semibold text-ink">{title}</b>
              <span className="text-[13.5px] leading-snug text-mute">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-6 py-3 text-[13px] text-mute md:px-8">
        Карточки с оценкой качества 80 и выше показываются выше в поиске и получают больше заявок.
      </p>
    </section>
  )
}
