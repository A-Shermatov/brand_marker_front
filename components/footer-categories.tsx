"use client"

import Link from "next/link"
import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { useMarketplaceCategories } from "@/hooks/use-marketplace-categories"
import {
  categoriesUrl,
  categoryUrl,
  servicesUrl,
  verificationUrl,
} from "@/lib/marketplace-routes"

export const FooterCategories = () => {
  const { categories } = useMarketplaceCategories()
  const categoryLinks = categories.slice(0, 6)

  return (
    <div>
      <h3 className="text-sm font-bold text-white mb-4">Категории услуг</h3>
      <ul className="space-y-2.5">
        {categoryLinks.map((category) => (
          <li key={category.id}>
            <Link
              href={categoryUrl(category.slug)}
              className="text-sm text-white/50 hover:text-primary transition-colors flex items-center gap-1 group"
            >
              <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 text-primary -ml-3 group-hover:ml-0 transition-all" />
              {category.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href={categoriesUrl()} className="text-sm text-primary hover:underline">
            Все категории
          </Link>
        </li>
        <li>
          <Link href={servicesUrl()} className="text-sm text-white/50 hover:text-primary transition-colors">
            Все услуги
          </Link>
        </li>
        <li>
          <Link href={verificationUrl()} className="text-sm text-white/50 hover:text-primary transition-colors">
            Верификация
          </Link>
        </li>
      </ul>
    </div>
  )
}
