"use client"

import { useEffect, useState } from "react"
import { BellRingingIcon as BellRing, FunnelIcon as Funnel, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { CategoryTree } from "@/lib/api/public"
import { CategoryChecklist, categoryNames } from "./category-checklist"

const summary = (tree: CategoryTree[], ids: number[], empty: string) => {
  const names = categoryNames(tree, ids)
  if (names.length === 0) return empty
  if (names.length <= 2) return names.join(", ")
  return `${names.slice(0, 2).join(", ")} и ещё ${names.length - 2}`
}

type FilterProps = {
  tree: CategoryTree[]
  value: number[]
  onChange: (next: number[]) => void
}

/** Narrow the board to some categories. Empty means every open request. */
export const RfqCategoryFilter = ({ tree, value, onChange }: FilterProps) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<number[]>(value)
  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10" aria-label="Фильтр по категориям">
            <Funnel className="size-4" aria-hidden />
            {value.length ? `Категории: ${summary(tree, value, "")}` : "Все категории"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(92vw,380px)] p-0">
          <div className="max-h-[min(60vh,440px)] overflow-y-auto p-2">
            <CategoryChecklist tree={tree} value={draft} onChange={setDraft} />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-line p-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft([])}>
              Сбросить
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange(draft)
                setOpen(false)
              }}
            >
              Показать заявки
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {value.length ? (
        <Button variant="ghost" size="sm" onClick={() => onChange([])}>
          <X className="size-3.5" aria-hidden />
          Все категории
        </Button>
      ) : null}
    </div>
  )
}

type AlertsProps = {
  tree: CategoryTree[]
  value: number[]
  saving?: boolean
  onSave: (next: number[]) => Promise<unknown> | void
}

/** The employee picks categories to be notified about new requests in them. */
export const RfqCategoryAlerts = ({ tree, value, saving, onSave }: AlertsProps) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<number[]>(value)
  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  return (
    <>
      <Button variant="outline" className="h-10" onClick={() => setOpen(true)}>
        <BellRing className="size-4" aria-hidden />
        {value.length
          ? `Уведомления: ${summary(tree, value, "")}`
          : "Настроить уведомления"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Уведомления о новых заявках</DialogTitle>
            <DialogDescription>
              Отметьте категории. Когда покупатель опубликует заявку в одной из них, вы получите
              уведомление. Настройка личная: коллеги выбирают категории сами.
            </DialogDescription>
          </DialogHeader>
          <div className="-mx-2 max-h-[min(55vh,420px)] overflow-y-auto">
            <CategoryChecklist tree={tree} value={draft} onChange={setDraft} />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setDraft([])} disabled={!draft.length}>
              Снять все
            </Button>
            <Button
              disabled={saving}
              onClick={async () => {
                await onSave(draft)
                setOpen(false)
              }}
            >
              {draft.length ? "Сохранить" : "Не уведомлять"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
