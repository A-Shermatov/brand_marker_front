"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/hooks/api/use-admin-categories-query"
import type { AdminCategory } from "@/lib/api/admin"
import { SLUG_PATTERN, slugify } from "@/lib/slugify"

const ROOT_VALUE = "root"

export type CategoryDialogState =
  | { mode: "create"; parentId: number | null }
  | { mode: "edit"; category: AdminCategory }
  | null

type CategoryDialogProps = {
  state: CategoryDialogState
  categories: AdminCategory[]
  onClose: () => void
}

const collectDescendantIds = (categories: AdminCategory[], rootId: number): Set<number> => {
  const result = new Set<number>([rootId])
  let changed = true
  while (changed) {
    changed = false
    categories.forEach((category) => {
      if (category.parent_id != null && result.has(category.parent_id) && !result.has(category.id)) {
        result.add(category.id)
        changed = true
      }
    })
  }
  return result
}

export const CategoryDialog = ({ state, categories, onClose }: CategoryDialogProps) => {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [parentValue, setParentValue] = useState(ROOT_VALUE)
  const [submitted, setSubmitted] = useState(false)
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const isPending = createMutation.isPending || updateMutation.isPending
  const editing = state?.mode === "edit" ? state.category : null

  useEffect(() => {
    if (!state) return
    setSubmitted(false)
    if (state.mode === "edit") {
      setName(state.category.name)
      setSlug(state.category.slug)
      setSlugTouched(true)
      setParentValue(state.category.parent_id != null ? String(state.category.parent_id) : ROOT_VALUE)
      return
    }
    setName("")
    setSlug("")
    setSlugTouched(false)
    setParentValue(state.parentId != null ? String(state.parentId) : ROOT_VALUE)
  }, [state])

  const parentOptions = useMemo(() => {
    const excluded = editing ? collectDescendantIds(categories, editing.id) : new Set<number>()
    return categories.filter((category) => !excluded.has(category.id))
  }, [categories, editing])

  const nameError = submitted && !name.trim() ? "Введите название" : null
  const slugError = submitted && !SLUG_PATTERN.test(slug)
    ? "Только латиница в нижнем регистре, цифры и дефисы"
    : null

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value
    setName(nextName)
    if (!slugTouched) setSlug(slugify(nextName))
  }

  const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true)
    setSlug(event.target.value.toLowerCase())
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!name.trim() || !SLUG_PATTERN.test(slug)) return
    const payload = {
      name: name.trim(),
      slug,
      parent_id: parentValue === ROOT_VALUE ? null : Number(parentValue),
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ categoryId: editing.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onClose()
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <Dialog open={Boolean(state)} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
            <DialogDescription>
              Slug используется в URL и фильтрах каталога и должен быть уникальным.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="category-name">Название</Label>
            <Input
              id="category-name"
              value={name}
              onChange={handleNameChange}
              maxLength={100}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "category-name-error" : undefined}
              autoFocus
            />
            {nameError && (
              <p id="category-name-error" className="text-xs font-medium text-destructive">
                {nameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-slug">Адрес в ссылке (латиницей)</Label>
            <Input
              id="category-slug"
              value={slug}
              onChange={handleSlugChange}
              maxLength={100}
              aria-invalid={Boolean(slugError)}
              aria-describedby={slugError ? "category-slug-error" : undefined}
            />
            {slugError && (
              <p id="category-slug-error" className="text-xs font-medium text-destructive">
                {slugError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-parent">Родительская категория</Label>
            <Select value={parentValue} onValueChange={setParentValue}>
              <SelectTrigger id="category-parent" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT_VALUE}>Без родителя (корневая)</SelectItem>
                {parentOptions.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
