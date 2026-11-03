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

export const LandingPricing = () => (
  <section id="pricing" className="mt-16 bg-ink text-white">
    <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 lg:grid-cols-[340px_1fr] lg:px-8">
      <div className="grid content-start gap-4">
        <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">
          Как работает гарантия сделки
        </h2>
        <p className="text-[16px] text-white/70">
          Площадка не держит ваши деньги у себя — их удерживает банк‑партнёр до вашей приёмки.
        </p>
        <Button asChild variant="outline" className="justify-self-start border-white bg-white text-ink hover:bg-canvas">
          <Link href={guaranteeUrl()}>Подробнее</Link>
        </Button>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ Icon, title, text }, n) => (
          <li
            key={title}
            className="grid content-start gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-5"
          >
            <span className="flex items-center justify-between">
              <Icon className="size-6 text-brand-300" aria-hidden />
              <span className="text-[13px] font-semibold text-white/50">Шаг {n + 1}</span>
            </span>
            <b className="text-[16px]">{title}</b>
            <span className="text-[14px] text-white/65">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  </section>
)
