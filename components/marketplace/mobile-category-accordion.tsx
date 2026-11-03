"use client"

import { useState } from "react"
import Link from "next/link"
import { CaretDownIcon as ChevronDown, CaretRightIcon as ChevronRight } from "@phosphor-icons/react/dist/ssr"
import { useMarketplaceCategories } from "@/hooks/use-marketplace-categories"
import { categoryUrl } from "@/lib/marketplace-routes"

type MobileCategoryAccordionProps = {
  onNavigate?: () => void
}

export const MobileCategoryAccordion = ({ onNavigate }: MobileCategoryAccordionProps) => {
  const { categories, isLoading } = useMarketplaceCategories()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleNavigate = () => onNavigate?.()

  if (isLoading) {
    return (
      <div className="space-y-2 px-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-10 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <p className="px-3 text-sm text-muted-foreground">Категории пока недоступны</p>
    )
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const isExpanded = expandedId === category.id
        return (
          <div key={category.id} className="rounded-xl border border-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => handleToggle(category.id)}
              className="w-full flex items-center justify-between py-2.5 px-3 text-sm hover:bg-secondary transition-colors"
              aria-expanded={isExpanded}
            >
              <span className="font-medium text-foreground">{category.label}</span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
            {isExpanded && (
              <div className="px-3 pb-2 space-y-0.5 bg-secondary/20">
                <Link
                  href={categoryUrl(category.slug)}
                  onClick={handleNavigate}
                  className="flex items-center justify-between py-2 px-2 rounded-lg text-sm text-primary font-semibold hover:bg-secondary transition-colors"
                >
                  <span>Все в категории</span>
                  <ChevronRight size={13} />
                </Link>
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={categoryUrl(category.slug, sub.slug)}
                    onClick={handleNavigate}
                    className="flex items-center justify-between py-2 px-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                  >
                    <span>{sub.label}</span>
                    <ChevronRight size={13} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
