"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckIcon as Check, CaretDownIcon as ChevronDown, FileTextIcon as FileText, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { ListPagination } from "@/components/list-pagination"
import { PageShell } from "@/components/marketplace/page-shell"
import { ServiceCard } from "@/components/marketplace/service-card"
import { PerformerCard } from "@/components/marketplace/performer-card"
import { searchServices } from "@/lib/mock/marketplace-services"
import { filterPerformers } from "@/lib/mock/marketplace-performers"
import { getAllCategories } from "@/lib/mock/categories"
import { isApiEnabled } from "@/lib/api/config"
import {
  usePublicCatalogQuery,
  usePublicCategoriesQuery,
  usePublicSuppliersQuery,
} from "@/hooks/api/use-public-query"
import { useMappedMarketplaceServices } from "@/hooks/api/use-supplier-name"
import { mapCategoryTreeToMarketplace, mapPublicSupplierToPerformer } from "@/lib/marketplace-hybrid"
import {
  newRfqRedirect,
  servicesUrl,
  type CatalogSort,
  type CatalogView,
  type ServicesUrlParams,
} from "@/lib/marketplace-routes"
import { formatCount } from "@/lib/format"

const SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "pop", label: "Сначала популярные" },
  { value: "cheap", label: "Сначала дешевле" },
  { value: "rating", label: "Лучший рейтинг" },
]

export const ServicesPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? ""
  const view: CatalogView =
    searchParams.get("view") === "suppliers" ? "suppliers" : "items"
  const verified = searchParams.get("verified") === "true"
  const invoice = searchParams.get("invoice") === "true"
  const sortParam = searchParams.get("sort")
  const sort: CatalogSort =
    sortParam === "cheap" || sortParam === "rating" ? sortParam : "pop"

  const useApi = isApiEnabled()
  const filterKey = [query, category, view, verified, invoice, sort].join("|")
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 })
  // Reset to page 1 whenever filters, view, or sort change.
  const page = pageState.key === filterKey ? pageState.page : 1
  const setPage = (next: number) => setPageState({ key: filterKey, page: next })

  const { data: apiCatalog } = usePublicCatalogQuery(
    query || undefined,
    category || undefined,
    useApi && view === "items",
    { verified, invoice, sort, page },
  )
  const { data: apiSuppliers } = usePublicSuppliersQuery(
    query || undefined,
    category || undefined,
    useApi && view === "suppliers",
    { verified, page },
  )
  const totalPages = !useApi
    ? 1
    : view === "items"
      ? (apiCatalog?.total_pages ?? 0)
      : (apiSuppliers?.total_pages ?? 0)
  const { data: apiCategories } = usePublicCategoriesQuery(useApi)

  const categories = useMemo(() => {
    if (!useApi) return getAllCategories()
    if (!apiCategories?.length) return []
    return mapCategoryTreeToMarketplace(apiCategories)
  }, [useApi, apiCategories])

  const apiServices = useMappedMarketplaceServices(
    useApi && view === "items" ? apiCatalog?.items : null,
  )

  const services = useMemo(() => {
    if (!useApi) {
      return searchServices(query, category || undefined, { verified, invoice, sort })
    }
    return apiServices
  }, [query, category, useApi, apiServices, verified, invoice, sort])

  const performers = useMemo(() => {
    if (!useApi) {
      return filterPerformers({
        q: query || undefined,
        verified,
        category: category || undefined,
      })
    }
    return (apiSuppliers?.items ?? []).map(mapPublicSupplierToPerformer)
  }, [useApi, apiSuppliers, query, verified, category])

  const count = view === "items" ? services.length : performers.length
  const categoryLabel =
    categories.find((cat) => cat.id === category || cat.slug === category)?.label

  const currentParams = (): ServicesUrlParams => ({
    ...(query ? { q: query } : {}),
    ...(category ? { category } : {}),
    view,
    ...(verified ? { verified: true } : {}),
    ...(invoice ? { invoice: true } : {}),
    ...(sort !== "pop" ? { sort } : {}),
  })

  const go = (patch: Partial<ServicesUrlParams>) => {
    const next: ServicesUrlParams = { ...currentParams(), ...patch }
    if (patch.view === "suppliers") {
      delete next.sort
      delete next.invoice
    }
    if (patch.verified === false) delete next.verified
    if (patch.invoice === false) delete next.invoice
    if (patch.sort === "pop") delete next.sort
    if (patch.category === "") delete next.category
    router.replace(servicesUrl(next))
  }

  const title = query
    ? `Результаты: «${query}»`
    : categoryLabel
      ? categoryLabel
      : "Каталог"

  const selectClass =
    "h-10 appearance-none rounded-lg border border-line bg-white pl-3.5 pr-9 text-[14px] font-semibold text-ink outline-none hover:border-line-strong"

  return (
    <PageShell>
      <section className="bg-canvas py-6 sm:py-8">
        <div className="mx-auto max-w-[1200px] px-4 lg:px-8">
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-ink sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-1 text-[15px] text-mute">
            {formatCount(
              count,
              view === "items" ? "предложение" : "поставщик",
              view === "items" ? "предложения" : "поставщика",
              view === "items" ? "предложений" : "поставщиков",
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-xl bg-surface-muted p-1"
              role="tablist"
              aria-label="Раздел каталога"
            >
              {(
                [
                  ["items", "Товары и услуги"],
                  ["suppliers", "Поставщики"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => go({ view: key })}
                  className={`h-9 rounded-lg px-4 text-[14px] font-semibold transition ${
                    view === key
                      ? "bg-white text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="relative">
              <span className="sr-only">Категория</span>
              <select
                className={selectClass}
                value={category}
                onChange={(e) => go({ category: e.target.value || "" })}
              >
                <option value="">Все категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mute"
                aria-hidden
              />
            </label>

            <FilterChip
              pressed={verified}
              onClick={() => go({ verified: !verified })}
              label="Только проверенные"
            />
            {view === "items" ? (
              <FilterChip
                pressed={invoice}
                onClick={() => go({ invoice: !invoice })}
                label="Оплата по счёту"
              />
            ) : null}

            {view === "items" ? (
              <>
                <span className="hidden flex-1 sm:block" />
                <label className="relative">
                  <span className="sr-only">Сортировка</span>
                  <select
                    className={selectClass}
                    value={sort}
                    onChange={(e) => go({ sort: e.target.value as CatalogSort })}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mute"
                    aria-hidden
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="mt-6">
            {view === "items" ? (
              services.length === 0 ? (
                <EmptyState kind="items" />
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )
            ) : performers.length === 0 ? (
              <EmptyState kind="suppliers" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {performers.map((performer) => (
                  <PerformerCard key={performer.id} performer={performer} />
                ))}
              </div>
            )}
            <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-canvas text-ink">
              <FileText className="size-5" aria-hidden />
            </span>
            <div className="min-w-[240px] flex-1">
              <b className="text-[16px] text-ink">Не нашли нужное?</b>
              <p className="text-[14.5px] text-mute">
                Опишите закупку — поставщики пришлют предложения, обычно в течение дня.
              </p>
            </div>
            <Link
              href={newRfqRedirect()}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-[15px] font-semibold text-white hover:bg-brand-700"
            >
              Разместить заявку
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  )
}

const FilterChip = ({
  pressed,
  onClick,
  label,
}: {
  pressed: boolean
  onClick: () => void
  label: string
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    onClick={onClick}
    className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3.5 text-[14px] font-semibold transition ${
      pressed
        ? "border-ink bg-ink text-white"
        : "border-line bg-white text-ink hover:border-line-strong"
    }`}
  >
    {pressed ? <Check className="size-4" aria-hidden /> : null}
    {label}
  </button>
)

const EmptyState = ({ kind }: { kind: "items" | "suppliers" }) => (
  <div className="grid justify-items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
    <Search size={28} className="text-mute" />
    <b className="text-[17px] text-ink">
      {kind === "items" ? "Ничего не нашли" : "Поставщиков не нашли"}
    </b>
    <p className="max-w-md text-[15px] text-mute">
      {kind === "items"
        ? "Попробуйте другое слово или разместите заявку — поставщики сами пришлют цены."
        : "Попробуйте другую категорию."}
    </p>
    {kind === "items" ? (
      <Link
        href={newRfqRedirect()}
        className="mt-2 inline-flex h-10 items-center justify-center rounded-lg border border-line bg-white px-4 text-[14px] font-semibold text-ink hover:border-line-strong"
      >
        Разместить заявку
      </Link>
    ) : null}
  </div>
)
