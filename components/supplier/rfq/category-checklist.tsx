"use client"

import { useId } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import type { CategoryTree } from "@/lib/api/public"
import { cn } from "@/lib/utils"

type CategoryChecklistProps = {
  tree: CategoryTree[]
  value: number[]
  onChange: (next: number[]) => void
  className?: string
}

/**
 * Category tree with checkboxes. Ticking a parent covers all its subcategories,
 * so they show as ticked and locked; untick the parent to pick them one by one.
 */
export const CategoryChecklist = ({ tree, value, onChange, className }: CategoryChecklistProps) => {
  const uid = useId()
  const selected = new Set(value)

  const toggleParent = (node: CategoryTree, on: boolean) => {
    const childIds = new Set((node.children ?? []).map((c) => c.id))
    const rest = value.filter((id) => id !== node.id && !childIds.has(id))
    onChange(on ? [...rest, node.id] : rest)
  }

  const toggleChild = (id: number, on: boolean) => {
    onChange(on ? [...value.filter((v) => v !== id), id] : value.filter((v) => v !== id))
  }

  return (
    <ul className={cn("grid gap-1", className)}>
      {tree.map((node) => {
        const parentOn = selected.has(node.id)
        const parentId = `${uid}-${node.id}`
        return (
          <li key={node.id} className="grid gap-1">
            <label
              htmlFor={parentId}
              className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-canvas"
            >
              <Checkbox
                id={parentId}
                checked={parentOn}
                onCheckedChange={(state) => toggleParent(node, state === true)}
              />
              <span className="text-[15px] font-semibold">{node.name}</span>
              {node.children?.length ? (
                <span className="text-[12.5px] text-mute">
                  {parentOn ? "все подкатегории" : `${node.children.length} подкат.`}
                </span>
              ) : null}
            </label>
            {node.children?.length ? (
              <ul className="ml-7 grid gap-0.5">
                {node.children.map((child) => {
                  const childId = `${uid}-${child.id}`
                  const on = parentOn || selected.has(child.id)
                  return (
                    <li key={child.id}>
                      <label
                        htmlFor={childId}
                        className={cn(
                          "flex min-h-9 items-center gap-3 rounded-lg px-2 text-[14.5px]",
                          parentOn ? "text-mute" : "cursor-pointer hover:bg-canvas",
                        )}
                      >
                        <Checkbox
                          id={childId}
                          checked={on}
                          disabled={parentOn}
                          onCheckedChange={(state) => toggleChild(child.id, state === true)}
                        />
                        {child.name}
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/** Names of the picked categories, parents first, for buttons and hints. */
export const categoryNames = (tree: CategoryTree[], ids: number[]): string[] => {
  const wanted = new Set(ids)
  const names: string[] = []
  for (const node of tree) {
    if (wanted.has(node.id)) {
      names.push(node.name)
      continue
    }
    for (const child of node.children ?? []) {
      if (wanted.has(child.id)) names.push(child.name)
    }
  }
  return names
}
