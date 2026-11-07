"use client"

import Link from "next/link"
import { getIcon } from "@/lib/icon-map"
import { useMarketplaceCategories } from "@/hooks/use-marketplace-categories"
import { categoryUrl, servicesUrl } from "@/lib/marketplace-routes"

export const LandingAbout = () => {
  const { categories, isLoading } = useMarketplaceCategories()
  const list = categories.slice(0, 10)

  return (
    <section id="about" className="mx-auto mt-16 max-w-[1200px] px-4 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">
          Категории
        </h2>
        <Link
          href={servicesUrl()}
          className="text-[15px] font-semibold text-brand-700 hover:underline"
        >
          Весь каталог
        </Link>
      </div>
      {isLoading && list.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-[128px] animate-pulse rounded-2xl border border-line bg-card"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((cat) => {
            const Icon = getIcon(cat.icon)
            return (
              <Link
                key={cat.id}
                href={categoryUrl(cat.slug)}
                className="grid gap-4 rounded-2xl border border-line bg-card p-4 text-left transition-colors hover:border-line-strong"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-brand-50">
                  <Icon weight="duotone" className="size-6 text-brand-700" aria-hidden />
                </span>
                <span>
                  <b className="block text-[15px] leading-snug">{cat.label}</b>
                  <span className="text-[13px] text-mute">
                    {cat.subcategories?.length
                      ? `${cat.subcategories.length} подкатегорий`
                      : "Смотреть предложения"}
                  </span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
