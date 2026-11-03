"use client"

import { useCallback, useMemo, useState } from "react"
import { CaretDownIcon as ChevronDown, TreeStructureIcon as FolderTree, CircleNotchIcon as Loader2, PencilSimpleIcon as Pencil, PlusIcon as Plus, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import {
  CategoryDialog,
  type CategoryDialogState,
} from "@/components/admin/categories/category-dialog"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useAdminCategoriesQuery,
  useDeleteCategoryMutation,
} from "@/hooks/api/use-admin-categories-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminCategory } from "@/lib/api/admin"
import { cn } from "@/lib/utils"

type CategoryNode = AdminCategory & { depth: number; hasChildren: boolean }

const DEPTH_INDENT = ["pl-0", "pl-6", "pl-12", "pl-18", "pl-24"]

const buildTreeRows = (categories: AdminCategory[]): CategoryNode[] => {
  const byParent = new Map<number | null, AdminCategory[]>()
  categories.forEach((category) => {
    const siblings = byParent.get(category.parent_id) ?? []
    siblings.push(category)
    byParent.set(category.parent_id, siblings)
  })
  const knownIds = new Set(categories.map((category) => category.id))
  const rows: CategoryNode[] = []
  const visit = (parentId: number | null, depth: number) => {
    const children = [...(byParent.get(parentId) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "ru"),
    )
    children.forEach((category) => {
      const childCount = (byParent.get(category.id) ?? []).length
      rows.push({
        ...category,
        depth,
        hasChildren: childCount > 0 || category.children_count > 0,
      })
      visit(category.id, depth + 1)
    })
  }
  visit(null, 0)
  categories
    .filter((category) => category.parent_id != null && !knownIds.has(category.parent_id))
    .forEach((category) =>
      rows.push({
        ...category,
        depth: 0,
        hasChildren: category.children_count > 0,
      }),
    )
  return rows
}

const matchesQuery = (category: AdminCategory, query: string) =>
  category.name.toLowerCase().includes(query) || category.slug.includes(query)

const isCategoryInUse = (category: AdminCategory) =>
  category.children_count > 0 || category.catalog_items_count > 0 || category.companies_count > 0

const usageLabel = (category: AdminCategory) =>
  [
    category.children_count ? `подкатегорий: ${category.children_count}` : null,
    category.catalog_items_count ? `позиций: ${category.catalog_items_count}` : null,
    category.companies_count ? `компаний: ${category.companies_count}` : null,
  ]
    .filter(Boolean)
    .join(", ")

const CategoriesSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка категорий">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

const CountPill = ({ label, value }: { label: string; value: number }) => (
  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
    {label}: <strong className="text-foreground">{value}</strong>
  </span>
)

const CategoryRow = ({
  category,
  collapsed,
  onToggleCollapse,
  canUpdate,
  canDelete,
  onAddChild,
  onEdit,
  onDelete,
}: {
  category: CategoryNode
  collapsed: boolean
  onToggleCollapse: (id: number) => void
  canUpdate: boolean
  canDelete: boolean
  onAddChild: (category: AdminCategory) => void
  onEdit: (category: AdminCategory) => void
  onDelete: (category: AdminCategory) => void
}) => {
  const inUse = isCategoryInUse(category)
  const hasActions = canUpdate || canDelete

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className={cn("min-w-0", DEPTH_INDENT[Math.min(category.depth, DEPTH_INDENT.length - 1)])}>
        <div className="flex min-w-0 items-center gap-1">
          {category.hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleCollapse(category.id)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-mute transition-colors hover:bg-secondary hover:text-ink"
              aria-expanded={!collapsed}
              aria-label={
                collapsed
                  ? `Развернуть «${category.name}»`
                  : `Свернуть «${category.name}»`
              }
            >
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform duration-200",
                  collapsed && "-rotate-90",
                )}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="size-7 shrink-0" aria-hidden="true" />
          )}
          <p
            className={cn(
              "min-w-0 truncate text-foreground",
              category.depth === 0 ? "font-bold" : "font-medium",
            )}
          >
            {category.name}
          </p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 pl-7">
          <code className="text-xs text-muted-foreground">{category.slug}</code>
          <CountPill label="Позиции" value={category.catalog_items_count} />
          <CountPill label="Компании" value={category.companies_count} />
        </div>
      </div>
      {hasActions && (
        <div className="flex shrink-0 gap-1">
          {canUpdate && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onAddChild(category)}
                aria-label={`Добавить подкатегорию в «${category.name}»`}
              >
                <Plus aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                aria-label={`Редактировать «${category.name}»`}
              >
                <Pencil aria-hidden="true" />
              </Button>
            </>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category)}
              disabled={inUse}
              title={inUse ? `Нельзя удалить: ${usageLabel(category)}` : undefined}
              aria-label={
                inUse
                  ? `Нельзя удалить «${category.name}»: ${usageLabel(category)}`
                  : `Удалить «${category.name}»`
              }
              className="text-destructive hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

export default function AdminCategoriesPage() {
  const categoriesQuery = useAdminCategoriesQuery()
  const deleteMutation = useDeleteCategoryMutation()
  const [search, setSearch] = useState("")
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(() => new Set())
  const [dialogState, setDialogState] = useState<CategoryDialogState>(null)
  const [deleting, setDeleting] = useState<AdminCategory | null>(null)
  const canUpdate = useAdminPermission("admin_catalog.update")
  const canDelete = useAdminPermission("admin_catalog.delete")

  const categories = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data])
  const byId = useMemo(() => {
    const map = new Map<number, AdminCategory>()
    categories.forEach((category) => map.set(category.id, category))
    return map
  }, [categories])

  const rows = useMemo(() => {
    const tree = buildTreeRows(categories)
    const query = search.trim().toLowerCase()

    if (query) {
      const matchingIds = new Set(
        tree.filter((category) => matchesQuery(category, query)).map((category) => category.id),
      )
      const visibleIds = new Set(matchingIds)
      for (const category of tree) {
        if (!matchingIds.has(category.id)) continue
        let parentId = category.parent_id
        while (parentId != null) {
          visibleIds.add(parentId)
          parentId = byId.get(parentId)?.parent_id ?? null
        }
      }
      return tree.filter((category) => visibleIds.has(category.id))
    }

    return tree.filter((category) => {
      let parentId = category.parent_id
      while (parentId != null) {
        if (collapsedIds.has(parentId)) return false
        parentId = byId.get(parentId)?.parent_id ?? null
      }
      return true
    })
  }, [byId, categories, collapsedIds, search])

  const toggleCollapse = useCallback((id: number) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      setDeleting(null)
    } catch {
      // error toast via MutationCache
    }
  }

  if (categoriesQuery.isLoading) return <CategoriesSkeleton />

  if (categoriesQuery.isError || !categoriesQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <FolderTree className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить категории</h1>
          <Button type="button" className="mt-5" onClick={() => categoriesQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Категории"
        description="Дерево категорий каталога и профилей компаний"
        actions={
          canUpdate ? (
            <Button type="button" onClick={() => setDialogState({ mode: "create", parentId: null })}>
              <Plus aria-hidden="true" />
              Добавить категорию
            </Button>
          ) : undefined
        }
      />

      <PageSurface>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Название или slug"
              className="pl-11"
              aria-label="Поиск категорий"
            />
          </div>
        </div>

        {rows.length ? (
          <ul className="divide-y divide-border" aria-label="Дерево категорий">
            {rows.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                collapsed={collapsedIds.has(category.id)}
                onToggleCollapse={toggleCollapse}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onAddChild={(parent) => setDialogState({ mode: "create", parentId: parent.id })}
                onEdit={(target) => setDialogState({ mode: "edit", category: target })}
                onDelete={setDeleting}
              />
            ))}
          </ul>
        ) : (
          <PageEmptyState
            title={search ? "Ничего не найдено" : "Категорий пока нет"}
            description={search ? "Измените запрос." : "Создайте первую категорию."}
          />
        )}
      </PageSurface>

      <CategoryDialog
        state={dialogState}
        categories={categories}
        onClose={() => setDialogState(null)}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleting?.name}» будет удалена без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Удалить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageFrame>
  )
}
