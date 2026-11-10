"use client"

import Link from "next/link"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { CategoryCard } from "@/components/marketplace/category-card"
import { useMarketplaceCategories } from "@/hooks/use-marketplace-categories"
import { servicesUrl } from "@/lib/marketplace-routes"

export default function CategoriesPage() {
  const { categories, isLoading } = useMarketplaceCategories()

  return (
    <PageShell>
      <section className="bg-card border-b border-border py-9">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Категории услуг</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Выберите направление и найдите подходящего поставщика
              </p>
            </div>
            <Link
              href={servicesUrl()}
              className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5"
            >
              Все услуги <ArrowRight size={14} />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="rounded-2xl p-4 bg-secondary animate-pulse h-[120px]" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-border bg-secondary/30 p-10 text-center">
              <p className="text-sm text-muted-foreground">Категории пока недоступны</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  )
}
