"use client"

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MagnifyingGlassIcon as Search, XIcon as X, StackIcon as Layers, BriefcaseIcon as Briefcase, UsersIcon as Users, ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { CategoryMegaMenu } from "@/components/marketplace/category-mega-menu"
import {
  filterCategoriesByQuery,
  useMarketplaceCategories,
} from "@/hooks/use-marketplace-categories"
import { isApiEnabled } from "@/lib/api/config"
import {
  usePublicCatalogQuery,
  usePublicSuppliersQuery,
} from "@/hooks/api/use-public-query"
import { mapCatalogItemToService, mapPublicSupplierToPerformer } from "@/lib/marketplace-hybrid"
import { searchServices } from "@/lib/mock/marketplace-services"
import { filterPerformers } from "@/lib/mock/marketplace-performers"
import {
  categoryUrl,
  performerUrl,
  performersUrl,
  serviceUrl,
  servicesUrl,
} from "@/lib/marketplace-routes"
import type { MarketplaceCategory } from "@/types/marketplace"

const POPULAR_QUERIES = [
  "Разработка сайтов",
  "SEO продвижение",
  "Бухгалтерские услуги",
  "Юридические консультации",
  "Перевозка грузов",
  "1С внедрение",
  "Аудит",
  "Подбор персонала",
]

type SuggestionItem =
  | { type: "popular"; id: string; label: string }
  | { type: "category"; id: string; label: string; href: string; parent?: string }
  | { type: "service"; id: string; label: string; href: string; meta?: string }
  | { type: "performer"; id: string; label: string; href: string; meta?: string }
  | { type: "search-services"; id: string; label: string; href: string }
  | { type: "search-performers"; id: string; label: string; href: string }

type MarketplaceSearchProps = {
  onNavigate?: () => void
  className?: string
  variant?: "default" | "compact"
}

export const MarketplaceSearch = ({
  onNavigate,
  className,
  variant = "default",
}: MarketplaceSearchProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { categories } = useMarketplaceCategories()
  const useApi = isApiEnabled()

  const urlQuery = useMemo(() => {
    if (pathname.startsWith("/services") || pathname.startsWith("/performers")) {
      return searchParams.get("q") ?? ""
    }
    return ""
  }, [pathname, searchParams])

  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery)
  const [categoryScope, setCategoryScope] = useState<MarketplaceCategory | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    setSearchQuery(urlQuery)
    setDebouncedQuery(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: apiCatalog, isFetching: catalogFetching } = usePublicCatalogQuery(
    debouncedQuery || undefined,
    categoryScope?.id,
    useApi && debouncedQuery.trim().length > 0,
  )
  const { data: apiSuppliers, isFetching: suppliersFetching } = usePublicSuppliersQuery(
    debouncedQuery || undefined,
    categoryScope?.id,
    useApi && debouncedQuery.trim().length > 0,
  )

  const mockServices = useMemo(() => {
    if (useApi || !debouncedQuery.trim()) return []
    return searchServices(debouncedQuery, categoryScope?.id).slice(0, 4)
  }, [useApi, debouncedQuery, categoryScope?.id])

  const mockPerformers = useMemo(() => {
    if (useApi || !debouncedQuery.trim()) return []
    return filterPerformers({ q: debouncedQuery }).slice(0, 3)
  }, [useApi, debouncedQuery])

  const apiServices = useMemo(() => {
    const items = apiCatalog?.items ?? []
    if (!useApi || !items.length) return []
    return items.map((item) => mapCatalogItemToService(item)).slice(0, 4)
  }, [useApi, apiCatalog])

  const apiPerformers = useMemo(() => {
    const items = apiSuppliers?.items ?? []
    if (!useApi || !items.length) return []
    return items.map(mapPublicSupplierToPerformer).slice(0, 3)
  }, [useApi, apiSuppliers])

  const filteredCategories = useMemo(
    () => filterCategoriesByQuery(categories, searchQuery, 5),
    [categories, searchQuery],
  )

  const suggestions = useMemo((): SuggestionItem[] => {
    const trimmed = searchQuery.trim()
    const items: SuggestionItem[] = []

    if (!trimmed) {
      POPULAR_QUERIES.slice(0, 6).forEach((label) => {
        items.push({ type: "popular", id: `popular-${label}`, label })
      })
      categories.slice(0, 4).forEach((cat) => {
        items.push({
          type: "category",
          id: `cat-${cat.id}`,
          label: cat.label,
          href: categoryUrl(cat.slug),
        })
      })
      return items
    }

    filteredCategories.forEach((cat) => {
      items.push({
        type: "category",
        id: `cat-${cat.id}`,
        label: cat.label,
        href: categoryUrl(cat.slug),
      })
      cat.subcategories.slice(0, 2).forEach((sub) => {
        items.push({
          type: "category",
          id: `sub-${cat.id}-${sub.id}`,
          label: sub.label,
          href: categoryUrl(cat.slug, sub.slug),
          parent: cat.label,
        })
      })
    })

    const services = useApi ? apiServices : mockServices
    services.forEach((service) => {
      items.push({
        type: "service",
        id: `service-${service.id}`,
        label: service.title,
        href: serviceUrl(service.id),
        meta: service.provider,
      })
    })

    const performers = useApi ? apiPerformers : mockPerformers
    performers.forEach((performer) => {
      items.push({
        type: "performer",
        id: `performer-${performer.id}`,
        label: performer.name,
        href: performerUrl(performer.id),
        meta: performer.category,
      })
    })

    items.push({
      type: "search-services",
      id: "search-services",
      label: `Искать «${trimmed}» в услугах`,
      href: servicesUrl({
        q: trimmed,
        ...(categoryScope ? { category: categoryScope.id } : {}),
      }),
    })
    items.push({
      type: "search-performers",
      id: "search-performers",
      label: `Искать «${trimmed}» среди исполнителей`,
      href: performersUrl({ q: trimmed }),
    })

    return items
  }, [
    searchQuery,
    categories,
    filteredCategories,
    useApi,
    apiServices,
    mockServices,
    apiPerformers,
    mockPerformers,
    categoryScope,
  ])

  const isLoading = searchQuery.trim().length > 0 && (catalogFetching || suppliersFetching)

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
  }, [])

  const handleNavigate = useCallback(() => {
    closeDropdown()
    onNavigate?.()
  }, [closeDropdown, onNavigate])

  const submitSearch = useCallback(
    (query?: string) => {
      const value = (query ?? searchQuery).trim()
      if (!value) {
        router.push(servicesUrl(categoryScope ? { category: categoryScope.id } : undefined))
      } else {
        router.push(
          servicesUrl({
            q: value,
            ...(categoryScope ? { category: categoryScope.id } : {}),
          }),
        )
      }
      handleNavigate()
    },
    [searchQuery, categoryScope, router, handleNavigate],
  )

  const handleSelectSuggestion = useCallback(
    (item: SuggestionItem) => {
      if (item.type === "popular") {
        setSearchQuery(item.label)
        submitSearch(item.label)
        return
      }
      if (item.type === "search-services" || item.type === "search-performers" || item.type === "category" || item.type === "service" || item.type === "performer") {
        router.push(item.href)
        handleNavigate()
      }
    },
    [router, handleNavigate, submitSearch],
  )

  const handleCategoryScopeSelect = useCallback((category: MarketplaceCategory) => {
    setCategoryScope(category)
    closeDropdown()
    inputRef.current?.focus()
  }, [closeDropdown])

  const handleClearScope = useCallback(() => {
    setCategoryScope(null)
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true)
      return
    }

    if (event.key === "Escape") {
      closeDropdown()
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelectSuggestion(suggestions[activeIndex])
        return
      }
      submitSearch()
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) closeDropdown()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, closeDropdown])

  const getItemIcon = (item: SuggestionItem) => {
    if (item.type === "category") return Layers
    if (item.type === "service") return Briefcase
    if (item.type === "performer") return Users
    return Search
  }

  const getGroupLabel = (item: SuggestionItem): string | null => {
    if (item.type === "popular") return "Популярные запросы"
    if (item.type === "category") return "Категории"
    if (item.type === "service") return "Услуги"
    if (item.type === "performer") return "Исполнители"
    if (item.type === "search-services" || item.type === "search-performers") return "Поиск"
    return null
  }

  const isCompact = variant === "compact"

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <div
        className={
          isCompact
            ? "relative flex items-center rounded-lg border border-transparent bg-canvas focus-within:border-brand-600 focus-within:bg-card"
            : "flex items-center overflow-hidden rounded-lg border border-line bg-card shadow-[0_1px_2px_rgba(28,28,26,.04)]"
        }
      >
        {!isCompact ? (
          <CategoryMegaMenu
            variant="search"
            onNavigate={handleNavigate}
            onCategoryScopeSelect={handleCategoryScopeSelect}
          />
        ) : (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute">
            <Search size={18} />
          </span>
        )}

        {categoryScope && !isCompact && (
          <div className="hidden sm:flex items-center gap-1 pl-2 pr-1 border-r border-border flex-shrink-0 max-w-[140px]">
            <span className="text-[11px] font-semibold text-primary truncate">
              {categoryScope.label}
            </span>
            <button
              type="button"
              onClick={handleClearScope}
              className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label={`Убрать фильтр ${categoryScope.label}`}
            >
              <X size={12} />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          placeholder={
            isCompact
              ? "Поиск товаров"
              : "Поиск товаров, услуг и поставщиков..."
          }
          className={
            isCompact
              ? "h-10 w-full min-w-0 bg-transparent pl-10 pr-3 text-[14.5px] outline-none"
              : "h-11 min-w-0 flex-1 bg-card px-3 text-[15px] outline-none sm:px-4"
          }
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Поиск услуг и исполнителей"
        />

        {!isCompact ? (
          <button
            type="button"
            onClick={() => submitSearch()}
            className="flex h-11 shrink-0 items-center gap-2 bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 dark:hover:bg-brand-500 sm:px-5"
            aria-label="Найти"
          >
            <Search size={16} />
            <span className="hidden md:block">Найти</span>
          </button>
        ) : null}
      </div>

      {categoryScope && (
        <div className="sm:hidden mt-1.5 flex items-center gap-1">
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[200px]">
            {categoryScope.label}
          </span>
          <button
            type="button"
            onClick={handleClearScope}
            className="text-[11px] text-muted-foreground hover:text-foreground"
            aria-label="Убрать фильтр категории"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Подсказки поиска"
          className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card border border-border shadow-xl z-50 rounded-xl overflow-hidden max-h-[min(420px,70vh)] overflow-y-auto"
        >
          {suggestions.map((item, index) => {
            const Icon = getItemIcon(item)
            const groupLabel = getGroupLabel(item)
            const showLabel = index === 0 || getGroupLabel(suggestions[index - 1]) !== groupLabel
            const isActive = index === activeIndex

            return (
              <div key={item.id}>
                {showLabel && groupLabel && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {groupLabel}
                    </p>
                  </div>
                )}
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                    isActive ? "bg-secondary text-primary" : "hover:bg-secondary"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <Icon size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{item.label}</span>
                    {"meta" in item && item.meta && (
                      <span className="block text-[11px] text-muted-foreground truncate">{item.meta}</span>
                    )}
                    {"parent" in item && item.parent && (
                      <span className="block text-[11px] text-muted-foreground truncate">{item.parent}</span>
                    )}
                  </span>
                  {(item.type === "search-services" || item.type === "search-performers") && (
                    <ArrowRight size={13} className="text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              </div>
            )
          })}
          {isLoading && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
              Загрузка результатов...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
