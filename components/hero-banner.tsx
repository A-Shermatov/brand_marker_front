"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, CheckCircleIcon as CheckCircle2, UsersIcon as Users, StackIcon as Layers, ThumbsUpIcon as ThumbsUp, TrendUpIcon as TrendingUp, CaretRightIcon as ChevronRightIcon, ShieldCheckIcon as ShieldCheck, FileTextIcon as FileText } from "@phosphor-icons/react/dist/ssr"
import { CategorySidebar } from "@/components/marketplace/category-sidebar"
import {
  categoryUrl,
  guaranteeUrl,
  performersUrl,
  verificationUrl,
} from "@/lib/marketplace-routes"
import { createRfqHref } from "@/lib/create-rfq-href"

const slides = [
  {
    id: 1,
    image: "/images/hero-banner-1.jpg",
    badge: "Топ-1 платформа",
    title: "Найдите лучших\nB2B поставщиков",
    subtitle: "Более 50 000 проверенных компаний и специалистов по всему Таджикистану",
    cta: "Найти поставщика",
    ctaHref: performersUrl(),
    ctaSecondary: "Разместить заказ",
    ctaSecondaryHref: "create-rfq" as const,
    bg: "oklch(0.18 0.04 160)",
    bgTo: "oklch(0.30 0.08 155)",
  },
  {
    id: 2,
    image: "/images/hero-banner-2.jpg",
    badge: "ИТ-услуги",
    title: "Разработка\nи цифровизация",
    subtitle: "Сайты, приложения, 1С, CRM — всё для вашего бизнеса под ключ",
    cta: "Смотреть ИТ услуги",
    ctaHref: categoryUrl("it"),
    ctaSecondary: "Стать партнёром",
    ctaSecondaryHref: "/login",
    bg: "oklch(0.20 0.04 155)",
    bgTo: "oklch(0.32 0.07 150)",
  },
  {
    id: 3,
    image: "/images/hero-banner-3.jpg",
    badge: "Логистика",
    title: "Логистика\nи цепочки поставок",
    subtitle: "Грузоперевозки, таможня, склад — надёжная логистика по всей стране",
    cta: "Заказать перевозку",
    ctaHref: categoryUrl("logistics"),
    ctaSecondary: "Рассчитать стоимость",
    ctaSecondaryHref: "create-rfq" as const,
    bg: "oklch(0.25 0.06 155)",
    bgTo: "oklch(0.38 0.10 150)",
  },
]

const stats = [
  { value: "50 000+", label: "Поставщиков", Icon: Users },
  { value: "120+", label: "Категорий услуг", Icon: Layers },
  { value: "98%", label: "Довольных клиентов", Icon: ThumbsUp },
  { value: "15 млрд  TJS", label: "Сделок в месяц", Icon: TrendingUp },
]

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = (index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrent(index)
    setTimeout(() => setIsAnimating(false), 500)
  }

  const next = () => goTo((current + 1) % slides.length)
  const prev = () => goTo((current - 1 + slides.length) % slides.length)

  useEffect(() => {
    timerRef.current = setInterval(next, 5500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current])

  const slide = slides[current]
  const secondaryHref =
    slide.ctaSecondaryHref === "create-rfq" ? createRfqHref() : slide.ctaSecondaryHref
  const placeOrderHref = createRfqHref()

  return (
    <section className="bg-background">
      <div className="max-w-[1440px] mx-auto px-6 py-5">
        <div className="flex gap-4">
          <CategorySidebar />

          {/* Main banner */}
          <div className="flex-1 relative rounded-2xl overflow-hidden min-h-[330px] group shadow-lg">
            <div
              className="absolute inset-0 transition-all duration-700"
              style={{ background: `linear-gradient(135deg, ${slide.bg} 0%, ${slide.bgTo} 100%)` }}
            />
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover mix-blend-overlay opacity-30 transition-opacity duration-500"
              priority
            />
            <div className="relative z-10 p-8 flex flex-col justify-center h-full min-h-[330px]">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-semibold px-3 py-1 rounded-full w-fit mb-4">
                <CheckCircle2 size={12} />
                {slide.badge}
              </span>
              <h1 className="text-white text-[2.1rem] font-bold leading-[1.15] mb-3 whitespace-pre-line">
                {slide.title}
              </h1>
              <p className="text-white/75 text-sm mb-6 max-w-xs leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={slide.ctaHref}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-md hover:shadow-lg hover:-translate-y-px"
                >
                  {slide.cta}
                </Link>
                <Link
                  href={secondaryHref}
                  className="bg-white/15 hover:bg-white/25 text-white font-medium px-6 py-2.5 rounded-xl transition-all text-sm border border-white/25 hover:-translate-y-px"
                >
                  {slide.ctaSecondary}
                </Link>
              </div>
            </div>

            {/* Arrows */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/45 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
              aria-label="Предыдущий слайд"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/25 hover:bg-black/45 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm"
              aria-label="Следующий слайд"
            >
              <ChevronRight size={18} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${i === current ? "w-7 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/45 hover:bg-white/70"}`}
                  aria-label={`Слайд ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right promo blocks */}
          <div className="hidden xl:flex flex-col gap-3 w-[210px] flex-shrink-0">
            <PromoCard
              href={guaranteeUrl()}
              bg="bg-primary/5"
              border="border-primary/15"
              accentClass="text-primary"
              title="Гарантия сделки"
              subtitle="Оплата после выполнения работы"
              Icon={ShieldCheck}
              iconClass="text-primary"
              cta="Подробнее"
            />
            <PromoCard
              href={verificationUrl()}
              bg="bg-secondary"
              border="border-border"
              accentClass="text-foreground"
              title="Верифицированные"
              subtitle="Проверенные юрлица и ИП"
              Icon={CheckCircle2}
              iconClass="text-foreground"
              cta="Смотреть"
            />
            <PromoCard
              href={placeOrderHref}
              bg="bg-primary/5"
              border="border-primary/15"
              accentClass="text-primary"
              title="Разместите заказ"
              subtitle="10+ предложений за 24 часа"
              Icon={FileText}
              iconClass="text-primary"
              cta="Разместить"
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-4 bg-card border border-border rounded-2xl py-4 px-8 flex items-center justify-around flex-wrap gap-4 shadow-sm">
          {stats.map(({ value, label, Icon }, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="text-center flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              </div>
              {i < stats.length - 1 && <div className="hidden md:block h-9 w-px bg-border ml-3" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PromoCard({
  href, bg, border, accentClass, title, subtitle, Icon, iconClass, cta,
}: {
  href: string
  bg: string; border: string; accentClass: string; title: string
  subtitle: string; Icon: React.ElementType; iconClass: string; cta: string
}) {
  return (
    <Link
      href={href}
      className={`${bg} rounded-2xl p-4 flex flex-col gap-2.5 border ${border} hover:shadow-md transition-all flex-1 group`}
      aria-label={title}
    >
      <div className={`w-9 h-9 rounded-xl bg-card/70 flex items-center justify-center border ${border}`}>
        <Icon size={17} className={iconClass} />
      </div>
      <div>
        <div className={`text-sm font-bold ${accentClass} leading-tight`}>{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{subtitle}</div>
      </div>
      <span className={`text-xs font-semibold ${accentClass} group-hover:underline flex items-center gap-1`}>
        {cta} <ChevronRightIcon size={11} />
      </span>
    </Link>
  )
}
