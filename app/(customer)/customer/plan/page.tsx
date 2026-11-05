"use client"

import Link from "next/link"
import { CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { SurfaceCard } from "@/components/bm"
import { Button } from "@/components/ui/button"
import {
  BUYER_FREE_FEATURES,
  BUYER_PLUS_PLAN,
  BUYER_SERVICES,
} from "@/lib/buyer-plan"
import { helpUrl } from "@/lib/marketplace-routes"

/** Buyer tariff hub — read-only UI (API for paid plans not wired yet). */
export default function CustomerPlanPage() {
  const onPlus = false

  return (
    <div className="grid gap-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <SurfaceCard className="grid content-start gap-4">
          <span className="text-[13px] text-mute">Ваш тариф</span>
          <div className="flex flex-wrap items-center gap-3">
            <b className="text-[24px] font-bold text-ink">
              {onPlus ? BUYER_PLUS_PLAN.name : "Бесплатный"}
            </b>
            {onPlus ? (
              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-bold text-brand-700">
                Активен
              </span>
            ) : null}
          </div>
          <ul className="grid gap-2 text-[14.5px] text-ink">
            {(onPlus ? BUYER_PLUS_PLAN.features : BUYER_FREE_FEATURES).map(
              (item) => (
                <li key={item} className="flex gap-2.5">
                  <Check
                    className="mt-0.5 size-[18px] shrink-0 text-brand-600"
                    aria-hidden
                  />
                  {item}
                </li>
              ),
            )}
          </ul>
        </SurfaceCard>

        <section className="grid gap-4 rounded-2xl bg-ink p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <b className="text-[22px] font-bold">{BUYER_PLUS_PLAN.name}</b>
            <span className="text-[15px]">
              <b className="tnum text-[28px]">{BUYER_PLUS_PLAN.price}</b>{" "}
              <span className="text-white/60">
                {BUYER_PLUS_PLAN.currency}/{BUYER_PLUS_PLAN.period}
              </span>
            </span>
          </div>
          <ul className="grid gap-2.5 text-[14.5px] sm:grid-cols-2">
            {BUYER_PLUS_PLAN.features.map((feat) => (
              <li key={feat} className="flex gap-2.5">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-brand-300"
                  aria-hidden
                />
                <span className="text-white/85">{feat}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              asChild
              className="border-white bg-white text-ink hover:bg-canvas"
            >
              <Link href={helpUrl()}>Подключить через поддержку</Link>
            </Button>
            <p className="w-full text-[13px] text-white/55">
              Оплата тарифа покупателя пока оформляется через поддержку —
              онлайн‑оплата появится позже.
            </p>
          </div>
        </section>
      </div>

      <section className="grid gap-4">
        <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ink">
          Услуги площадки
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BUYER_SERVICES.map((svc) => (
            <SurfaceCard key={svc.id} className="grid gap-2 p-5">
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1">
                <b className="min-w-0 text-[16px] text-ink">{svc.name}</b>
                <span className="text-[13px] font-semibold text-brand-700">
                  {svc.price}
                </span>
              </div>
              <p className="text-[14px] text-mute">{svc.description}</p>
              <Button asChild variant="outline" size="sm" className="mt-2 justify-self-start">
                <Link href={helpUrl()}>Заказать</Link>
              </Button>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </div>
  )
}
