"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CaretDownIcon as ChevronDown, CaretRightIcon as ChevronRight, ListIcon as Menu } from "@phosphor-icons/react/dist/ssr"
import { useMarketplaceCategories } from "@/hooks/use-marketplace-categories"
import { getIcon } from "@/lib/icon-map"
import { categoriesUrl, categoryUrl } from "@/lib/marketplace-routes"
import type { MarketplaceCategory } from "@/types/marketplace"

type CategoryMegaMenuProps = {
  variant?: "search" | "nav"
  onNavigate?: () => void
  onCategoryScopeSelect?: (category: MarketplaceCategory) => void
}

export const CategoryMegaMenu = ({
  variant = "nav",
  onNavigate,
  onCategoryScopeSelect,
}: CategoryMegaMenuProps) => {
  const { categories, isLoading } = useMarketplaceCategories()
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const resolvedActive = activeCategory ?? categories[0] ?? null

  const handleClose = useCallback(() => setIsOpen(false), [])

  const handleToggle = () => setIsOpen((prev) => !prev)

  const handleNavigate = () => {
    handleClose()
    onNavigate?.()
  }

  const handleCategoryClick = (category: MarketplaceCategory) => {
    setActiveCategory(category)
    if (variant === "search" && onCategoryScopeSelect) {
      onCategoryScopeSelect(category)
      handleClose()
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose()
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) handleClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, handleClose])

  const triggerClass =
    variant === "search"
      ? "flex items-center gap-1.5 px-4 bg-secondary text-sm text-foreground border-r border-border whitespace-nowrap hover:bg-accent transition-colors h-11 font-medium"
      : "flex items-center gap-2 py-3 pr-5 border-r border-border text-sm font-semibold hover:text-primary transition-colors whitespace-nowrap"

  if (!resolvedActive) {
    return (
      <button
        type="button"
        className={triggerClass}
        disabled
        aria-label="Категории загружаются"
      >
        {variant === "nav" && <Menu size={15} />}
        <span className={variant === "search" ? "hidden md:block text-secondary-foreground" : undefined}>
          Все категории
        </span>
        <ChevronDown size={variant === "search" ? 14 : 12} />
      </button>
    )
  }

  const ActiveIcon = getIcon(resolvedActive.icon)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className={triggerClass}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Все категории"
      >
        {variant === "nav" && <Menu size={15} />}
        <span className={variant === "search" ? "hidden md:block text-secondary-foreground" : undefined}>
          Все категории
        </span>
        <ChevronDown size={variant === "search" ? 14 : 12} className={variant === "search" ? "text-secondary-foreground" : undefined} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full bg-white border border-border shadow-2xl z-[60] rounded-2xl overflow-hidden ${
            variant === "search" ? "left-0 mt-2 w-[min(720px,calc(100vw-3rem))]" : "left-0 mt-0 w-[min(720px,calc(100vw-3rem))]"
          }`}
          role="menu"
          aria-label="Категории услуг"
        >
          <div className="flex min-h-[320px]">
            <div className="w-[240px] border-r border-border bg-secondary/30 overflow-y-auto max-h-[400px]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="px-4 py-3">
                    <div className="h-4 rounded bg-secondary animate-pulse" />
                  </div>
                ))
              ) : (
                categories.map((category) => {
                  const Icon = getIcon(category.icon)
                  const isActive = resolvedActive.id === category.id
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onMouseEnter={() => setActiveCategory(category)}
                      onFocus={() => setActiveCategory(category)}
                      onClick={() => handleCategoryClick(category)}
                      className={`w-full flex items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors ${
                        isActive ? "bg-white text-primary font-semibold" : "text-foreground hover:bg-white/70"
                      }`}
                    >
                      <Icon size={15} className={isActive ? "text-primary" : "text-muted-foreground"} />
                      <span className="leading-tight">{category.label}</span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex-1 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`${resolvedActive.iconBg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                  <ActiveIcon size={18} className={resolvedActive.iconColor} />
                </div>
                <div>
                  <Link
                    href={categoryUrl(resolvedActive.slug)}
                    onClick={handleNavigate}
                    className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                  >
                    {resolvedActive.label}
                  </Link>
                  <p className="text-xs text-muted-foreground">{resolvedActive.count} услуг</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {resolvedActive.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={categoryUrl(resolvedActive.slug, sub.slug)}
                    onClick={handleNavigate}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors group"
                  >
                    <span>{sub.label}</span>
                    <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary" />
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-4 mt-5">
                <Link
                  href={categoriesUrl()}
                  onClick={handleNavigate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  Все категории <ChevronRight size={12} />
                </Link>
                {variant === "search" && onCategoryScopeSelect && (
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(resolvedActive)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    Искать в категории
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
