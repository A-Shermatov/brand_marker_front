import Link from "next/link"
import { BriefcaseIcon as Briefcase, PackageIcon as Package } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { newRfqRedirect, registerUrl, tariffsUrl } from "@/lib/marketplace-routes"

const BUYER_STEPS = [
  ["Найдите товар в каталоге или разместите заявку", "Поставщики сами пришлют цены"],
  ["Сравните предложения", "Цена, сроки и гарантия в одной таблице"],
  ["Оплатите с гарантией", "Поставщик получит деньги после вашей приёмки"],
] as const

const SELLER_STEPS = [
  ["Зарегистрируйте компанию", "Проверка документов — до 1 рабочего дня"],
  ["Добавьте товары и отвечайте на заявки", "Покупатели находят вас в каталоге"],
  ["Получайте оплату на счёт", "Деньги ждут вас в банке ещё до отгрузки"],
] as const

function PathCard({
  icon,
  title,
  steps,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: React.ReactNode
  title: string
  steps: readonly (readonly [string, string])[]
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
}) {
  return (
    <div className="grid content-start gap-6 rounded-2xl border border-line bg-card p-6 md:p-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-tile text-white">{icon}</span>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">{title}</h2>
      </div>
      <ol className="grid gap-4">
        {steps.map(([a, b], n) => (
          <li key={a} className="grid grid-cols-[32px_1fr] gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-canvas text-[14px] font-bold">
              {n + 1}
            </span>
            <div>
              <b className="text-[15px] font-semibold">{a}</b>
              <span className="block text-[14px] text-mute">{b}</span>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>
    </div>
  )
}

export const LandingHowItWorks = () => (
  <section id="how-it-works" className="mx-auto mt-16 max-w-[1200px] px-4 lg:px-8">
    <div className="grid gap-4 md:grid-cols-2">
      <PathCard
        icon={<Briefcase className="size-5" />}
        title="Я покупаю для компании"
        steps={BUYER_STEPS}
        primaryHref={newRfqRedirect()}
        primaryLabel="Разместить заявку"
        secondaryHref="/services"
        secondaryLabel="Открыть каталог"
      />
      <PathCard
        icon={<Package className="size-5" />}
        title="Я продаю товары или услуги"
        steps={SELLER_STEPS}
        primaryHref={registerUrl()}
        primaryLabel="Стать поставщиком"
        secondaryHref={tariffsUrl()}
        secondaryLabel="Сколько стоит"
      />
    </div>
  </section>
)
