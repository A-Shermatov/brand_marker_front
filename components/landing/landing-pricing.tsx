import Link from "next/link"
import { CreditCardIcon as CreditCard, LockIcon as Lock, TruckIcon as Truck, CheckCircleIcon as CircleCheck } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { guaranteeUrl } from "@/lib/marketplace-routes"

const STEPS = [
  { Icon: CreditCard, title: "Вы оплачиваете", text: "Картой или по счёту" },
  { Icon: Lock, title: "Банк удерживает", text: "Поставщик видит: деньги есть" },
  { Icon: Truck, title: "Поставщик отгружает", text: "С накладной в сделке" },
  { Icon: CircleCheck, title: "Вы принимаете", text: "И только тогда деньги уходят" },
]

/** How the deal guarantee works: four steps in order, joined by a line. */
export const LandingPricing = () => (
  <section id="pricing" className="mt-16 border-y border-line bg-white">
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 lg:grid-cols-[320px_1fr] lg:px-8">
      <div className="grid content-start gap-4">
        <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] text-ink">
          Как работает гарантия сделки
        </h2>
        <p className="text-[16px] text-mute">
          Площадка не держит ваши деньги у себя — их удерживает банк‑партнёр до вашей приёмки.
        </p>
        <Button asChild className="justify-self-start">
          <Link href={guaranteeUrl()}>Подробнее</Link>
        </Button>
      </div>
      <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* The line that joins the steps, behind the numbers. */}
        <span aria-hidden className="absolute left-5 right-5 top-5 hidden h-0.5 bg-brand-100 lg:block" />
        {STEPS.map(({ Icon, title, text }, n) => (
          <li key={title} className="relative grid content-start gap-3">
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-[15px] font-semibold text-white ring-4 ring-white tnum">
                {n + 1}
              </span>
              <Icon className="size-6 text-brand-600" aria-hidden />
            </span>
            <b className="text-[16px] font-semibold text-ink">{title}</b>
            <span className="text-[14px] text-mute">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  </section>
)
