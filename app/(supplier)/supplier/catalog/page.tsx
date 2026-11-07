"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useItemsStore } from "@/lib/store/items-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUrlTab } from "@/hooks/use-url-tab"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useArchiveCatalogItemMutation,
  useDeleteCatalogItemMutation,
  useRestoreCatalogItemMutation,
  useSupplierCatalogQuery,
} from "@/hooks/api/use-supplier-catalog-query"
import {
  emptySupplierNavCounts,
  useMarkNavSectionSeen,
  useSupplierNavCounts,
} from "@/hooks/api/use-nav-counts-query"
import { CatalogProductCard } from "@/components/supplier/catalog/catalog-product-card"
import { ShowcaseEmpty } from "@/components/supplier/catalog/showcase-empty"
import { ListPagination } from "@/components/list-pagination"
import { Button } from "@/components/ui/button"
import { MetricTile } from "@/components/process"
import { PageFrame, PageHeader, SegmentedControl } from "@/components/layout"
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
  const archiveLocal = useItemsStore((s) => s.archiveItem)
  const archiveMutation = useArchiveCatalogItemMutation()
  const restoreMutation = useRestoreCatalogItemMutation()
  const deleteMutation = useDeleteCatalogItemMutation()
  const busy = archiveMutation.isPending || restoreMutation.isPending || deleteMutation.isPending
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
      views,
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
          label="Просмотров карточек"
          value={hydrated ? String(stats.views) : "—"}
          hint="по карточкам на этой странице"
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-canvas" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ShowcaseEmpty filtered={tab !== "all"} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <CatalogProductCard
              key={item.id}
              item={item}
              busy={busy}
              onArchive={(id) =>
                useApi ? archiveMutation.mutateAsync(id) : Promise.resolve(archiveLocal(id))
              }
              onRestore={(id) => (useApi ? restoreMutation.mutateAsync(id) : Promise.resolve())}
              onDelete={(id) =>
                useApi ? deleteMutation.mutateAsync(id) : Promise.resolve(archiveLocal(id))
              }
            />
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
