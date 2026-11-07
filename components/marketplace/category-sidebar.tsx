"use client"

import { useState } from "react"
import Link from "next/link"
import { CaretRightIcon as ChevronRight } from "@phosphor-icons/react/dist/ssr"
import { useMarketplaceCategories } from "@/hooks/use-marketplace-categories"
import { getIcon } from "@/lib/icon-map"
import { categoryUrl } from "@/lib/marketplace-routes"
import type { MarketplaceCategory } from "@/types/marketplace"

const SKELETON_ROWS = 10

export const CategorySidebar = () => {
  const { categories, isLoading } = useMarketplaceCategories()
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory | null>(null)

  if (isLoading) {
    return (
      <aside className="hidden lg:block w-[210px] flex-shrink-0" aria-label="Категории услуг">
        <nav className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm h-full">
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-2.5 px-3.5 py-[9px] border-b border-border/60 last:border-0"
            >
              <div className="w-3.5 h-3.5 rounded bg-secondary animate-pulse flex-shrink-0" />
              <div className="h-3 flex-1 rounded bg-secondary animate-pulse" />
            </div>
          ))}
        </nav>
      </aside>
    )
  }

  if (categories.length === 0) {
    return (
      <aside className="hidden lg:block w-[210px] flex-shrink-0" aria-label="Категории услуг">
        <nav className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm p-4">
          <p className="text-xs text-muted-foreground text-center">Категории пока недоступны</p>
        </nav>
      </aside>
    )
  }

  const flyoutCategory = activeCategory ?? categories[0]
  const FlyoutIcon = getIcon(flyoutCategory.icon)

  return (
    <aside
      className="hidden lg:block w-[210px] flex-shrink-0 relative"
      aria-label="Категории услуг"
      onMouseLeave={() => setActiveCategory(null)}
    >
      <nav className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm h-full">
        {categories.map((category) => {
          const Icon = getIcon(category.icon)
          const isActive = flyoutCategory.id === category.id
          return (
            <Link
              key={category.id}
              href={categoryUrl(category.slug)}
              onMouseEnter={() => setActiveCategory(category)}
              onFocus={() => setActiveCategory(category)}
              className={`flex items-center gap-2.5 px-3.5 py-[9px] text-xs font-medium border-b border-border/60 last:border-0 transition-colors group ${
                isActive ? "bg-secondary text-primary" : "hover:bg-secondary hover:text-primary"
              }`}
            >
              <Icon
                size={14}
                className={`flex-shrink-0 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                }`}
              />
              <span className="text-foreground group-hover:text-primary transition-colors leading-tight">
                {category.label}
              </span>
              <ChevronRight
                size={12}
                className={`ml-auto transition-colors ${
                  isActive ? "text-primary/60" : "text-muted-foreground/40 group-hover:text-primary/60"
                }`}
              />
            </Link>
          )
        })}
      </nav>

      {activeCategory && activeCategory.subcategories.length > 0 && (
        <div
          className="absolute left-full top-0 ml-2 w-[220px] bg-card border border-border rounded-2xl shadow-xl z-30 p-4"
          role="region"
          aria-label={`Подкатегории: ${activeCategory.label}`}
        >
          <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-border">
            <div className={`${flyoutCategory.iconBg} w-8 h-8 rounded-lg flex items-center justify-center`}>
              <FlyoutIcon size={15} className={flyoutCategory.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{flyoutCategory.label}</p>
              <p className="text-[10px] text-muted-foreground">{flyoutCategory.count} услуг</p>
            </div>
          </div>
          <ul className="space-y-0.5">
            {flyoutCategory.subcategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={categoryUrl(flyoutCategory.slug, sub.slug)}
                  className="flex items-center justify-between px-2 py-2 rounded-lg text-xs text-foreground hover:bg-secondary hover:text-primary transition-colors group"
                >
                  <span className="truncate">{sub.label}</span>
                  <ChevronRight size={11} className="text-muted-foreground group-hover:text-primary flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
