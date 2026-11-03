"use client"

import Link from "next/link"
import { CreditCardIcon as CreditCard, LockIcon as Lock, TruckIcon as Truck, CheckCircleIcon as CircleCheck, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { PageHead, SurfaceCard } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { createRfqHref } from "@/lib/create-rfq-href"
import { forSuppliersUrl } from "@/lib/marketplace-routes"

const STEPS = [
  {
    Icon: CreditCard,
    title: "Вы оплачиваете",
    text: "Картой или переводом по счёту — деньги уходят в банк‑партнёр.",
  },
  {
    Icon: Lock,
    title: "Банк удерживает",
    text: "Поставщик видит оплату и может отгружать. Площадка деньги не хранит.",
  },
  {
    Icon: Truck,
    title: "Поставщик отгружает",
    text: "Накладная и фото приёмки появляются в сделке.",
  },
  {
    Icon: CircleCheck,
    title: "Вы принимаете",
    text: "Только после вашей приёмки банк переводит оплату поставщику.",
  },
]

export default function GuaranteePage() {
  return (
    <PageShell>
      <section className="py-10 lg:py-14">
        <div className="mx-auto max-w-[960px] px-4 lg:px-8">
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-brand-50 px-3 text-[13.5px] font-semibold text-brand-700">
            <ShieldCheck className="size-4" aria-hidden />
            Гарантия сделки
          </span>
          <PageHead
            className="mt-4"
            title="Вы платите — но деньги получат только после вашей приёмки"
            description="Площадка не держит средства у себя. Их удерживает банк‑партнёр, пока вы не примете заказ."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {STEPS.map(({ Icon, title, text }, i) => (
              <SurfaceCard key={title} className="grid content-start gap-3">
                <span className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-[13px] font-semibold text-mute">
                    Шаг {i + 1}
                  </span>
                </span>
                <b className="text-[16px] text-ink">{title}</b>
                <p className="text-[14px] text-mute">{text}</p>
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-[20px] font-bold text-ink">
                Готовы закупить с гарантией?
              </h2>
              <p className="mt-1 text-[14.5px] text-mute">
                Разместите заявку или купите из каталога — деньги будут защищены до
                приёмки.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={createRfqHref()}>Разместить заявку</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/services">Открыть каталог</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={forSuppliersUrl()}>Продавцам</Link>
              </Button>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </PageShell>
  )
}
