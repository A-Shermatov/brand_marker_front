"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleNotchIcon as Loader2, MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { CompanyConfirmDialog } from "@/components/admin/companies/company-confirm-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useAdminCategoriesQuery } from "@/hooks/api/use-admin-categories-query"
import { useAdminCompanyCategoriesMutation } from "@/hooks/api/use-admin-companies-query"
import type { AdminCategory, AdminCompanyDetail } from "@/lib/api/admin"

type CategoryOption = AdminCategory & { depth: number }

const flattenTree = (items: AdminCategory[]): CategoryOption[] => {
  const byParent = new Map<number | null, AdminCategory[]>()
  for (const item of items) {
    const key = item.parent_id ?? null
    byParent.set(key, [...(byParent.get(key) ?? []), item])
  }
  const known = new Set(items.map((item) => item.id))
  const result: CategoryOption[] = []
  const walk = (parentId: number | null, depth: number) => {
    const children = (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name, "ru"))
    for (const child of children) {
      result.push({ ...child, depth })
      walk(child.id, depth + 1)
    }
  }
  walk(null, 0)
  for (const item of items) {
    if (item.parent_id != null && !known.has(item.parent_id)) result.push({ ...item, depth: 0 })
  }
  return result
}

type CompanyCategoriesDialogProps = {
  company: AdminCompanyDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CompanyCategoriesDialog = ({
  company,
  open,
  onOpenChange,
}: CompanyCategoriesDialogProps) => {
  const categoriesQuery = useAdminCategoriesQuery()
  const mutation = useAdminCompanyCategoriesMutation()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) return
    setSelected(new Set((company.categories ?? []).map((category) => category.id)))
    setSearch("")
    // Seed the selection only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const options = useMemo(
    () => flattenTree(categoriesQuery.data?.items ?? []),
    [categoriesQuery.data],
  )
  const needle = search.trim().toLowerCase()
  const visible = needle
    ? options.filter((option) => option.name.toLowerCase().includes(needle))
    : options

  const toggle = (id: number, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({ companyId: company.id, categoryIds: [...selected] })
      toast.success("Категории обновлены")
      onOpenChange(false)
    } catch {
      // MutationCache toast
    }
  }

  return (
    <CompanyConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Категории компании"
      description={`Выбрано: ${selected.size}. Категории влияют на поиск и подбор компании.`}
      confirmLabel="Сохранить"
      pending={mutation.isPending}
      confirmDisabled={categoriesQuery.isLoading}
      onConfirm={() => void handleSave()}
    >
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск категории"
            className="pl-9"
            aria-label="Поиск категории"
          />
        </div>
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
          {categoriesQuery.isLoading ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="animate-spin" aria-label="Загрузка категорий" />
            </div>
          ) : visible.length ? (
            visible.map((option) => {
              const id = `company-category-${option.id}`
              return (
                <label
                  key={option.id}
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60"
                  style={{ paddingLeft: needle ? undefined : `${0.5 + option.depth * 1.25}rem` }}
                >
                  <Checkbox
                    id={id}
                    checked={selected.has(option.id)}
                    onCheckedChange={(checked) => toggle(option.id, checked === true)}
                  />
                  <span className={option.depth === 0 ? "font-semibold" : undefined}>
                    {option.name}
                  </span>
                </label>
              )
            })
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Ничего не найдено</p>
          )}
        </div>
      </div>
    </CompanyConfirmDialog>
  )
}
