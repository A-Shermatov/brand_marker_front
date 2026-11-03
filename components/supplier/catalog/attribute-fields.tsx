"use client"

import { PlusIcon as Plus, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { ItemAttributeValueType } from "@/types"

export type AttributeFieldRow = {
  name: string
  value: string
  value_type: ItemAttributeValueType
}

type AttributeFieldsProps = {
  attributes: AttributeFieldRow[]
  onChange: (attributes: AttributeFieldRow[]) => void
  errors?: Record<string, string>
}

const valueTypes: { value: ItemAttributeValueType; label: string }[] = [
  { value: "text", label: "Текст" },
  { value: "number", label: "Число" },
  { value: "boolean", label: "Да/Нет" },
  { value: "date", label: "Дата" },
]

export const AttributeFields = ({
  attributes,
  onChange,
  errors,
}: AttributeFieldsProps) => {
  const handleAdd = () => {
    onChange([...attributes, { name: "", value: "", value_type: "text" }])
  }

  const handleRemove = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index))
  }

  const handleUpdate = (index: number, patch: Partial<AttributeFieldRow>) => {
    onChange(
      attributes.map((attr, i) => (i === index ? { ...attr, ...patch } : attr)),
    )
  }

  const inputClass = (field: string) =>
    cn(
      "w-full h-10 px-3 rounded-xl border bg-card text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
      errors?.[field] ? "border-destructive" : "border-input focus:border-primary",
    )

  return (
    <div className="space-y-3">
      {attributes.map((attr, index) => (
        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
          <div className="sm:col-span-4">
            <input
              maxLength={255}
              type="text"
              value={attr.name}
              onChange={(e) => handleUpdate(index, { name: e.target.value })}
              placeholder="Название"
              className={inputClass(`attr-name-${index}`)}
            />
          </div>
          <div className="sm:col-span-4">
            <input
              maxLength={255}
              type="text"
              value={attr.value}
              onChange={(e) => handleUpdate(index, { value: e.target.value })}
              placeholder="Значение"
              className={inputClass(`attr-value-${index}`)}
            />
          </div>
          <div className="sm:col-span-3">
            <select
              value={attr.value_type}
              onChange={(e) =>
                handleUpdate(index, {
                  value_type: e.target.value as ItemAttributeValueType,
                })
              }
              className={inputClass(`attr-type-${index}`)}
            >
              {valueTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="h-10 w-10 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center justify-center"
              aria-label="Удалить атрибут"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
      >
        <Plus size={15} /> Добавить атрибут
      </button>
    </div>
  )
}
