"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleNotchIcon as Loader2, PlusIcon as Plus, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAdminCatalogUpdateMutation } from "@/hooks/api/use-admin-catalog-query"
import { useAdminCategoriesQuery } from "@/hooks/api/use-admin-categories-query"
import type {
  AdminCatalogDetail,
  AdminCatalogItemUpdate,
  AdminCatalogPricingInput,
} from "@/lib/api/admin"
import { pricingTypeMeta } from "@/lib/item-display"

type PricingType = AdminCatalogPricingInput["pricing_type"]

type FormState = {
  title: string
  type: "product" | "service"
  categoryId: string
  description: string
  invoice: boolean
  pricingType: PricingType
  currency: string
  amount: string
  tiers: Array<{ minQty: string; price: string }>
  attributes: Array<{ name: string; value: string; valueType: string }>
  reason: string
  notifyOwner: boolean
}

const PRICING_TYPES: PricingType[] = ["fixed", "tiered", "hourly", "monthly"]

const isPricingType = (value: string): value is PricingType =>
  (PRICING_TYPES as string[]).includes(value)

const initialState = (item: AdminCatalogDetail): FormState => {
  const pricing = item.pricing
  const pricingType: PricingType =
    pricing && isPricingType(pricing.pricing_type) ? pricing.pricing_type : "fixed"
  const amount =
    pricingType === "hourly"
      ? pricing?.hourly_rate
      : pricingType === "monthly"
        ? pricing?.monthly_rate
        : pricing?.fixed_price
  return {
    title: item.title,
    type: item.type,
    categoryId: item.category ? String(item.category.id) : "",
    description: item.description ?? "",
    invoice: item.invoice,
    pricingType,
    currency: pricing?.currency || "TJS",
    amount: amount != null ? String(amount) : "",
    tiers: (pricing?.tiers ?? []).map((tier) => ({
      minQty: String(tier.min_qty),
      price: String(tier.price),
    })),
    attributes: item.attributes.map((attribute) => ({
      name: attribute.name,
      value: attribute.value,
      valueType: attribute.value_type || "text",
    })),
    reason: "",
    notifyOwner: true,
  }
}

const parseAmount = (value: string): number | null => {
  if (value.trim() === "") return null
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const buildPricing = (form: FormState): AdminCatalogPricingInput | string => {
  const currency = form.currency.trim().toUpperCase()
  if (!currency) return "Укажите валюту"
  if (form.pricingType === "tiered") {
    const tiers = form.tiers.map((tier) => ({
      min_qty: Number(tier.minQty),
      price: parseAmount(tier.price),
    }))
    if (!tiers.length) return "Добавьте хотя бы одну ступень цены"
    if (tiers.some((tier) => !Number.isInteger(tier.min_qty) || tier.min_qty < 1 || tier.price == null)) {
      return "Проверьте ступени цены: минимальный заказ ≥ 1 и цена ≥ 0"
    }
    return {
      pricing_type: "tiered",
      currency,
      tiers: tiers.map((tier) => ({ min_qty: tier.min_qty, price: tier.price ?? 0 })),
    }
  }
  const amount = parseAmount(form.amount)
  if (amount == null) return "Укажите цену"
  return {
    pricing_type: form.pricingType,
    currency,
    fixed_price: form.pricingType === "fixed" ? amount : null,
    hourly_rate: form.pricingType === "hourly" ? amount : null,
    monthly_rate: form.pricingType === "monthly" ? amount : null,
    tiers: [],
  }
}

const fieldLabelClass = "text-sm font-semibold"

type CatalogEditDialogProps = {
  item: AdminCatalogDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CatalogEditDialog = ({ item, open, onOpenChange }: CatalogEditDialogProps) => {
  const [form, setForm] = useState<FormState>(() => initialState(item))
  const mutation = useAdminCatalogUpdateMutation(item.id)
  const categoriesQuery = useAdminCategoriesQuery()

  useEffect(() => {
    if (open) setForm(initialState(item))
  }, [open, item])

  const categoryOptions = useMemo(() => {
    const categories = categoriesQuery.data?.items ?? []
    const byId = new Map(categories.map((category) => [category.id, category]))
    return categories
      .map((category) => {
        const parent = category.parent_id ? byId.get(category.parent_id) : undefined
        return {
          value: String(category.id),
          label: parent ? `${parent.name} / ${category.name}` : category.name,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label, "ru"))
  }, [categoriesQuery.data])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async () => {
    const title = form.title.trim()
    if (title.length < 2) {
      toast.error("Название должно содержать минимум 2 символа")
      return
    }
    const categoryId = Number(form.categoryId)
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      toast.error("Выберите категорию")
      return
    }
    const pricing = buildPricing(form)
    if (typeof pricing === "string") {
      toast.error(pricing)
      return
    }
    const attributes = form.attributes
      .map((attribute) => ({
        name: attribute.name.trim(),
        value: attribute.value.trim(),
        value_type: attribute.valueType || "text",
      }))
      .filter((attribute) => attribute.name || attribute.value)
    if (attributes.some((attribute) => !attribute.name || !attribute.value)) {
      toast.error("У каждой характеристики должно быть название и значение")
      return
    }

    const payload: AdminCatalogItemUpdate = {
      title,
      type: form.type,
      category_id: categoryId,
      description: form.description,
      invoice: form.invoice,
      pricing,
      attributes,
      reason: form.reason.trim() || undefined,
      notify_owner: form.notifyOwner,
    }
    try {
      await mutation.mutateAsync(payload)
      toast.success("Изменения сохранены")
      onOpenChange(false)
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактирование позиции</DialogTitle>
          <DialogDescription>
            Изменения применяются сразу, статус позиции не меняется. Все правки попадают в журнал.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="catalog-edit-title" className={fieldLabelClass}>
              Название
            </label>
            <Input
              id="catalog-edit-title"
              value={form.title}
              maxLength={255}
              onChange={(event) => update("title", event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="catalog-edit-type" className={fieldLabelClass}>
                Тип
              </label>
              <Select
                value={form.type}
                onValueChange={(value) => update("type", value === "service" ? "service" : "product")}
              >
                <SelectTrigger id="catalog-edit-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Товар</SelectItem>
                  <SelectItem value="service">Услуга</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="catalog-edit-category" className={fieldLabelClass}>
                Категория
              </label>
              <Select value={form.categoryId} onValueChange={(value) => update("categoryId", value)}>
                <SelectTrigger id="catalog-edit-category" className="w-full">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="catalog-edit-description" className={fieldLabelClass}>
              Описание
            </label>
            <Textarea
              id="catalog-edit-description"
              value={form.description}
              rows={6}
              maxLength={20000}
              onChange={(event) => update("description", event.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.invoice}
              onCheckedChange={(checked) => update("invoice", checked === true)}
            />
            Работа по счёту (безнал)
          </label>

          <fieldset className="space-y-3 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-bold">Цена</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="catalog-edit-pricing-type" className={fieldLabelClass}>
                  Тип цены
                </label>
                <Select
                  value={form.pricingType}
                  onValueChange={(value) => {
                    if (isPricingType(value)) update("pricingType", value)
                  }}
                >
                  <SelectTrigger id="catalog-edit-pricing-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICING_TYPES.map((pricingType) => (
                      <SelectItem key={pricingType} value={pricingType}>
                        {pricingTypeMeta[pricingType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="catalog-edit-currency" className={fieldLabelClass}>
                  Валюта
                </label>
                <Input
                  id="catalog-edit-currency"
                  value={form.currency}
                  maxLength={10}
                  onChange={(event) => update("currency", event.target.value)}
                />
              </div>
              {form.pricingType !== "tiered" && (
                <div className="space-y-2">
                  <label htmlFor="catalog-edit-amount" className={fieldLabelClass}>
                    {form.pricingType === "hourly"
                      ? "Ставка за час"
                      : form.pricingType === "monthly"
                        ? "Ставка в месяц"
                        : "Цена"}
                  </label>
                  <Input
                    id="catalog-edit-amount"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(event) => update("amount", event.target.value)}
                  />
                </div>
              )}
            </div>
            {form.pricingType === "tiered" && (
              <div className="space-y-2">
                {form.tiers.map((tier, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={tier.minQty}
                      placeholder="Мин. заказ, шт."
                      aria-label="Минимальный заказ"
                      onChange={(event) =>
                        update(
                          "tiers",
                          form.tiers.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, minQty: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      value={tier.price}
                      placeholder="Цена за единицу"
                      aria-label="Цена за единицу"
                      onChange={(event) =>
                        update(
                          "tiers",
                          form.tiers.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, price: event.target.value } : row,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Удалить ступень"
                      onClick={() =>
                        update(
                          "tiers",
                          form.tiers.filter((_, rowIndex) => rowIndex !== index),
                        )
                      }
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => update("tiers", [...form.tiers, { minQty: "", price: "" }])}
                >
                  <Plus aria-hidden="true" />
                  Добавить ступень
                </Button>
              </div>
            )}
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-bold">Характеристики</legend>
            {form.attributes.map((attribute, index) => (
              <div key={index} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-2">
                <Input
                  value={attribute.name}
                  maxLength={255}
                  placeholder="Название"
                  aria-label="Название характеристики"
                  onChange={(event) =>
                    update(
                      "attributes",
                      form.attributes.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, name: event.target.value } : row,
                      ),
                    )
                  }
                />
                <Input
                  value={attribute.value}
                  maxLength={500}
                  placeholder="Значение"
                  aria-label="Значение характеристики"
                  onChange={(event) =>
                    update(
                      "attributes",
                      form.attributes.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, value: event.target.value } : row,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Удалить характеристику"
                  onClick={() =>
                    update(
                      "attributes",
                      form.attributes.filter((_, rowIndex) => rowIndex !== index),
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                update("attributes", [...form.attributes, { name: "", value: "", valueType: "text" }])
              }
            >
              <Plus aria-hidden="true" />
              Добавить характеристику
            </Button>
          </fieldset>

          <div className="space-y-2">
            <label htmlFor="catalog-edit-reason" className={fieldLabelClass}>
              Комментарий для поставщика
            </label>
            <Textarea
              id="catalog-edit-reason"
              value={form.reason}
              rows={3}
              maxLength={2000}
              placeholder="Что и почему исправлено (необязательно)"
              onChange={(event) => update("reason", event.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.notifyOwner}
              onCheckedChange={(checked) => update("notifyOwner", checked === true)}
            />
            Уведомить поставщика об изменениях
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="button" disabled={mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
