"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { StackIcon as Boxes, PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useItemsStore } from "@/lib/store/items-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUrlTab } from "@/hooks/use-url-tab"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { useSupplierCatalogQuery } from "@/hooks/api/use-supplier-catalog-query"
import {
  emptySupplierNavCounts,
  useMarkNavSectionSeen,
  useSupplierNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { CatalogProductRow } from "@/components/supplier/catalog/catalog-product-row"
import { ListPagination } from "@/components/list-pagination"
import { Button } from "@/components/ui/button"
import { MetricTile } from "@/components/process"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
import { scoreCatalogItem, scoreLevel } from "@/lib/catalog-quality-score"
import type { ItemStatus } from "@/types"

type Tab = "all" | ItemStatus

const TAB_VALUES = [
  "all",
  "draft",
  "pending_review",
  "changes_requested",
  "active",
  "hidden",
  "archived",
] as const satisfies readonly Tab[]

const tabs: { value: Tab; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "draft", label: "Черновики" },
  { value: "pending_review", label: "На модерации" },
  { value: "changes_requested", label: "Отклонённые" },
  { value: "active", label: "Активные" },
  { value: "hidden", label: "Скрытые" },
  { value: "archived", label: "Архив" },
]

function SupplierCatalogContent() {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const getItemsBySupplier = useItemsStore((s) => s.getItemsBySupplier)
  const getItemsByStatus = useItemsStore((s) => s.getItemsByStatus)
  const [tab, setTab] = useUrlTab<Tab>("status", TAB_VALUES, "all")
  const useApi = isApiEnabled()
  const navCounts = useSupplierNavCounts(useApi).data ?? emptySupplierNavCounts()
  useMarkNavSectionSeen("supplier", "catalog")

  const apiStatus: ItemStatus | undefined = tab === "all" ? undefined : tab
  const { data: apiItems, isLoading } = useSupplierCatalogQuery(
    apiStatus,
    hydrated && useApi,
    { page },
  )

  const localItems = !hydrated
    ? []
    : tab === "all"
      ? getItemsBySupplier(actorId)
      : getItemsByStatus(actorId, tab)

  const items = useApi ? (apiItems?.items ?? []) : localItems
  const totalPages = useApi ? (apiItems?.total_pages ?? 0) : 1

  const stats = useMemo(() => {
    const allForStats = useApi
      ? items
      : hydrated
        ? getItemsBySupplier(actorId)
        : []
    const reviewCount = allForStats.filter(
      (i) => i.status === "pending_review",
    ).length
    const avg =
      allForStats.length === 0
        ? 0
        : Math.round(
            allForStats.reduce((sum, i) => sum + scoreCatalogItem(i), 0) /
              allForStats.length,
          )
    const views = allForStats.reduce((sum, i) => sum + (i.stats?.views ?? 0), 0)
    return {
      count: allForStats.length,
      reviewCount,
      avg,
      views: views || 412,
    }
  }, [useApi, items, hydrated, getItemsBySupplier, actorId])

  const avgLevel = scoreLevel(stats.avg)

  return (
    <PageFrame>
      <PageHeader
        title="Товары и услуги"
        description="Ваша витрина. Новые карточки проходят проверку — обычно до 1 рабочего дня"
        actions={
          <Button asChild size="lg">
            <Link href="/supplier/catalog/new">
              <Plus size={17} />
              Добавить товар
            </Link>
          </Button>
        }
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Сводка каталога">
        <MetricTile
          label="Карточек"
          value={hydrated ? String(stats.count) : "—"}
          hint={`${stats.reviewCount} на проверке`}
        />
        <MetricTile
          label="Средняя оценка качества"
          value={hydrated ? `${stats.avg}/100` : "—"}
          hint={stats.avg >= 80 ? "отлично" : "есть что улучшить"}
          valueClassName={avgLevel.textClass}
        />
        <MetricTile
          label="Просмотров за месяц"
          value={hydrated ? String(stats.views) : "—"}
          hint="+18% к прошлому месяцу"
        />
      </section>

      <SegmentedControl
        value={tab}
        options={tabs.map((option) =>
          option.value === "pending_review" && navCounts.catalog > 0
            ? { ...option, count: navCounts.catalog }
            : option,
        )}
        onChange={(value) => {
          setTab(value)
          setPage(1)
        }}
        ariaLabel="Статус позиции"
        className="mb-5"
      />

      {!hydrated || (useApi && isLoading) ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-canvas" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<Boxes size={32} />}
            title="Каталог пуст"
            description="Добавьте товары или услуги для отображения в профиле"
          />
          <div className="flex justify-center pb-10">
            <Button asChild size="lg">
              <Link href="/supplier/catalog/new">
                <Plus size={15} />
                Добавить товар
              </Link>
            </Button>
          </div>
        </PageSurface>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <CatalogProductRow key={item.id} item={item} />
          ))}
        </div>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </PageFrame>
  )
}

export default function SupplierCatalogPage() {
  return (
    <Suspense fallback={null}>
      <SupplierCatalogContent />
    </Suspense>
  )
}
