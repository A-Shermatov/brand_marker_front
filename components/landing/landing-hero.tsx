"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { CheckIcon as Check, LockIcon as Lock, MagnifyingGlassIcon as Search, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
import { CompanyName } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { servicesUrl } from "@/lib/marketplace-routes"

const QUICK = ["Бумага А4", "Цемент", "Ноутбуки", "Спецодежда", "Грузоперевозки"]

const TIMELINE = [
  { title: "Договор подписан", date: "15 сентября", state: 1 as const },
  { title: "Оплачено — деньги в банке‑партнёре", date: "16 сентября", state: 1 as const },
  { title: "Товар отгружен, накладная приложена", date: "25 сентября", state: 1 as const },
  { title: "Проверьте и примите заказ", date: "сейчас", state: 2 as const },
  { title: "Поставщик получит оплату", date: "после приёмки", state: 0 as const },
]

export const LandingHero = () => {
  const router = useRouter()
  const [q, setQ] = useState("")
  // The one moment of motion on the page: the deal walks through its steps
  // once on load, up to the step that waits for the buyer.
  const still = useReducedMotion()
  const step = (i: number) =>
    still
      ? {}
      : {
          initial: { opacity: 0, x: -6 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: 0.35 + i * 0.22, duration: 0.35, ease: "easeOut" as const },
        }

  const submit = (value = q) => {
    router.push(servicesUrl({ q: value.trim() || undefined }))
  }

  return (
    <section
      className="relative overflow-hidden bg-brand-field text-white"
      aria-label="Главный баннер"
    >
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-12 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:py-20">
        <div className="grid content-start gap-6">
          <span className="inline-flex items-center gap-2 justify-self-start rounded-full bg-white/15 px-3 py-1.5 text-[14px] font-medium text-white ring-1 ring-white/25">
            <ShieldCheck weight="fill" className="size-[18px] text-volt-400" aria-hidden />
            Каждая сделка под защитой банка‑партнёра
          </span>
          <h1 className="text-[38px] font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-[54px] [text-wrap:balance]">
            Закупки для бизнеса — просто и&nbsp;
            <span className="relative inline-block whitespace-nowrap">
              безопасно
              {/* A hand-drawn lime stroke under the promise. */}
              <svg
                aria-hidden
                viewBox="0 0 300 24"
                preserveAspectRatio="none"
                className="absolute -bottom-[0.2em] left-0 h-[0.3em] w-full"
              >
                <path
                  d="M4 16 C 70 6, 150 4, 296 12"
                  fill="none"
                  stroke="var(--volt-400)"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="max-w-xl text-[17px] leading-relaxed text-[#E3ECFF]">
            Найдите проверенного поставщика, сравните цены и платите только после того, как получили товар.
          </p>
          <div className="flex max-w-xl flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Что нужно купить</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Что нужно купить? Например: цемент М500"
                className="h-12 w-full rounded-lg border border-transparent bg-card pl-12 pr-3.5 text-[15.5px] text-ink shadow-[0_10px_30px_-12px_rgb(0_30_90/0.55)] outline-none transition placeholder:text-faint focus:ring-[3px] focus:ring-volt-400/70"
              />
            </label>
            <Button type="button" size="lg" className="h-12 border-volt-500/40 bg-volt-400 px-7 font-semibold text-volt-ink shadow-[0_10px_30px_-12px_rgb(0_30_90/0.55)] hover:bg-volt-300 dark:border-volt-500/40 dark:hover:bg-volt-300" onClick={() => submit()}>
              Найти
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[14px]">
            <span className="mr-1 text-[#D2E0FF]">Часто ищут:</span>
            {QUICK.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => submit(item)}
                className="h-8 rounded-full border border-white/30 bg-white/10 px-3 text-[13.5px] font-medium text-white transition-colors hover:border-volt-400 hover:bg-volt-400 hover:text-volt-ink"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl bg-card text-ink shadow-[0_2px_4px_rgb(0_30_90/0.15),0_40px_80px_-30px_rgb(0_25_80/0.6)] ring-1 ring-white/30">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <span className="text-[12.5px] text-mute tnum">Сделка БМ‑2041</span>
                <b className="block truncate text-[15px] font-semibold">Ноутбуки Lenovo, 20 шт</b>
                <CompanyName name="ТехноСнаб" verified tier="gold" size="sm" className="mt-1" nameClassName="font-medium text-ink-soft" />
              </div>
              <b className="shrink-0 text-[16px] font-semibold tnum">167 000 TJS</b>
            </div>
            <ol className="grid gap-0 px-5 py-4">
              {TIMELINE.map((item, i) => (
                <motion.li
                  key={item.title}
                  {...step(i)}
                  className={`relative grid grid-cols-[28px_1fr] gap-3 ${i < TIMELINE.length - 1 ? "pb-4" : ""}`}
                >
                  {i < TIMELINE.length - 1 ? (
                    <span
                      className={`absolute top-7 bottom-0 left-[13px] w-0.5 ${item.state === 1 ? "bg-brand-600" : "bg-line"}`}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative z-10 grid size-7 place-items-center rounded-full ${
                      item.state === 1
                        ? "bg-brand-600 text-white"
                        : item.state === 2
                          ? "border-2 border-brand-600 bg-card text-brand-700"
                          : "border border-dashed border-line-strong bg-card text-mute"
                    }`}
                  >
                    {item.state === 1 ? (
                      <Check weight="bold" className="size-3.5" />
                    ) : item.state === 2 ? (
                      <span className="size-2 rounded-full bg-brand-600" />
                    ) : null}
                  </span>
                  <div className="pt-0.5">
                    <b className={`text-[14.5px] font-medium ${item.state === 0 ? "text-mute" : ""}`}>
                      {item.title}
                    </b>
                    <span className="block text-[12.5px] text-mute">{item.date}</span>
                    {item.state === 2 ? (
                      <span className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-[14px] font-semibold text-white">
                        <Check className="size-4" />
                        Принять заказ
                      </span>
                    ) : null}
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="flex items-center gap-2 bg-canvas px-5 py-3 text-[13px] text-mute">
              <Lock className="size-4 text-brand-600" />
              Деньги в банке, пока вы не нажмёте «Принять»
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
