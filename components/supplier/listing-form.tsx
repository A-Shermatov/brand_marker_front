"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon as ArrowLeft, ShoppingCartIcon as ShoppingCart, BriefcaseIcon as Briefcase, CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"
import { useCategoryOptions } from "@/hooks/use-category-options"
import type { Listing, OrderKind } from "@/types"
import type { ListingInput } from "@/lib/store/listings-store"

interface ListingFormProps {
  initial?: Listing
  onSubmit: (input: ListingInput) => void
  submitLabel: string
}

export default function ListingForm({ initial, onSubmit, submitLabel }: ListingFormProps) {
  const router = useRouter()
  const { rfqCategories: categories } = useCategoryOptions()
  const [kind, setKind] = useState<OrderKind>(initial?.kind ?? "service")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [price, setPrice] = useState(initial?.price ? String(initial.price) : "")
  const [inStock, setInStock] = useState(initial?.inStock != null ? String(initial.inStock) : "")
  const [color, setColor] = useState(initial?.color ?? "")
  const [sku, setSku] = useState(initial?.sku ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (title.trim().length < 5) e.title = "Название не короче 5 символов"
    if (!categoryId) e.categoryId = "Выберите категорию"
    if (description.trim().length < 10) e.description = "Описание от 10 символов"
    const priceNum = Number(price)
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) e.price = "Укажите цену"
    if (kind === "product") {
      const stockNum = Number(inStock)
      if (inStock === "" || Number.isNaN(stockNum) || stockNum < 0) e.inStock = "Укажите количество"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    onSubmit({
      kind,
      title: title.trim(),
      description: description.trim(),
      categoryId,
      price: Number(price),
      inStock: kind === "product" ? Number(inStock) : undefined,
      color: kind === "product" ? color.trim() || undefined : undefined,
      sku: kind === "product" ? sku.trim() || undefined : undefined,
    })
  }

  const inputClass = (field: string) =>
    cn(
      "w-full h-11 px-4 rounded-xl border bg-card text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
      errors[field] ? "border-destructive" : "border-input focus:border-primary",
    )

  return (
    <div className="max-w-[820px] mx-auto">
      <Link
        href="/supplier/listings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} /> К списку позиций
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-1">
        {initial ? "Редактирование позиции" : "Новая позиция"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Выберите тип и заполните характеристики товара или услуги
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "service", title: "Услуга", desc: "Работа или сервис", Icon: Briefcase },
            { value: "product", title: "Товар", desc: "Физический товар", Icon: ShoppingCart },
          ] as const).map(({ value, title: t, desc, Icon }) => {
            const active = kind === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={cn(
                  "text-left rounded-xl border-2 p-4 transition-all",
                  active ? "border-primary bg-secondary shadow-sm" : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2.5", active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary")}>
                  <Icon size={18} />
                </div>
                <div className="text-sm font-bold text-foreground">{t}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
              </button>
            )
          })}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1.5">Название</label>
            <input maxLength={100} id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "product" ? "Напр. Офисное кресло ErgoPro" : "Напр. Разработка сайта под ключ"} className={inputClass("title")} />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1.5">Категория</label>
            <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={cn(inputClass("categoryId"), "appearance-none")}>
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1.5">Описание</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Опишите товар или услугу" className={cn("w-full px-4 py-3 rounded-xl border bg-card text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 resize-none", errors.description ? "border-destructive" : "border-input focus:border-primary")} />
            {errors.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-foreground mb-1.5">Цена, TJS</label>
              <input
                maxLength={MAX_NUMERIC_INPUT_LENGTH}
                id="price"
                type="text"
                inputMode="numeric"
                value={price}
                onChange={(e) => {
                  const next = sanitizeDigitInput(e.currentTarget.value)
                  if (next === null) return
                  setPrice(next)
                }}
                placeholder="50000"
                className={inputClass("price")}
              />
              {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
            </div>
            {kind === "product" && (
              <div>
                <label htmlFor="inStock" className="block text-sm font-medium text-foreground mb-1.5">Количество в наличии</label>
                <input
                  maxLength={MAX_NUMERIC_INPUT_LENGTH}
                  id="inStock"
                  type="text"
                  inputMode="numeric"
                  value={inStock}
                  onChange={(e) => {
                    const next = sanitizeDigitInput(e.currentTarget.value)
                    if (next === null) return
                    setInStock(next)
                  }}
                  placeholder="100"
                  className={inputClass("inStock")}
                />
                {errors.inStock && <p className="text-xs text-destructive mt-1">{errors.inStock}</p>}
              </div>
            )}
          </div>

          {kind === "product" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-foreground mb-1.5">
                  Цвет <span className="text-muted-foreground font-normal">(необязательно)</span>
                </label>
                <input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Чёрный" className={inputClass("color")} />
              </div>
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-foreground mb-1.5">
                  Артикул / ИД-номер <span className="text-muted-foreground font-normal">(необязательно)</span>
                </label>
                <input maxLength={200} id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-12345" className={inputClass("sku")} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.push("/supplier/listings")} className="h-11 px-5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors flex items-center">
            Отмена
          </button>
          <button type="submit" className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors flex items-center gap-2">
            <Check size={16} /> {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
