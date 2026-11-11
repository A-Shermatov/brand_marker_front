import Link from "next/link"
import {
  CaretRightIcon,
  CompassIcon,
  LifebuoyIcon,
  StorefrontIcon,
  UserCircleIcon,
} from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Страница не найдена — Brand Market" }

const WAYS = [
  {
    href: "/services",
    title: "Каталог",
    text: "Товары и услуги проверенных поставщиков",
    Icon: StorefrontIcon,
  },
  {
    href: "/customer",
    title: "Мой кабинет",
    text: "Заявки, сделки и сообщения",
    Icon: UserCircleIcon,
  },
  {
    href: "/help",
    title: "Помощь",
    text: "Как разместить заявку и как защищены деньги",
    Icon: LifebuoyIcon,
  },
] as const

/** A wrong or outdated link: say so plainly and show the ways back. */
export default function NotFound() {
  return (
    <PageShell>
      <section className="mx-auto grid w-full max-w-[720px] gap-7 px-4 py-14 sm:py-20">
        <div className="grid gap-3 bm-rise">
          <div className="relative grid size-[72px] place-items-center" aria-hidden>
            <span className="absolute inset-0 rounded-[22px] border border-dashed border-brand-200" />
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 bm-float">
              <CompassIcon weight="duotone" className="size-8" />
            </span>
          </div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[32px]">
            Такой страницы нет
          </h1>
          <p className="max-w-[52ch] text-[15.5px] leading-relaxed text-mute">
            Возможно, ссылка устарела или в адресе опечатка. Ничего не потерялось: ваши заявки и сделки
            на месте, в кабинете.
          </p>
          <div className="mt-1">
            <Button asChild size="lg">
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>

        <ul className="grid gap-2 bm-stagger" aria-label="Куда можно перейти">
          {WAYS.map(({ href, title, text, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex items-center gap-3.5 rounded-2xl border border-line bg-card p-4 transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-[0_10px_24px_-16px_rgb(0_80_200/0.45)]"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon weight="duotone" className="size-[22px]" aria-hidden />
                </span>
                <span className="grid min-w-0 flex-1">
                  <b className="text-[15px] font-semibold text-ink">{title}</b>
                  <span className="truncate text-[13.5px] text-mute">{text}</span>
                </span>
                <CaretRightIcon
                  className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  )
}
