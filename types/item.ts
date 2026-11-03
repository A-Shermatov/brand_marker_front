export const CATALOG_ITEM_TYPES = ["product", "service"] as const

export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number]

export const ITEM_STATUSES = [
  "draft",
  "pending_review",
  "changes_requested",
  "active",
  "hidden",
  "archived",
  "deleted",
] as const

export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const CATALOG_REPORT_REASONS = [
  "spam",
  "fraud",
  "counterfeit",
  "abuse",
  "other",
] as const

export type CatalogReportReason = (typeof CATALOG_REPORT_REASONS)[number]

export const ITEM_ATTRIBUTE_VALUE_TYPES = [
  "text",
  "number",
  "boolean",
  "date",
] as const

export type ItemAttributeValueType =
  (typeof ITEM_ATTRIBUTE_VALUE_TYPES)[number]

export const PRICING_TYPES = ["fixed", "tiered", "hourly", "monthly"] as const

export type PricingType = (typeof PRICING_TYPES)[number]

export const ITEM_MEDIA_TYPES = ["image", "document", "video"] as const

export type ItemMediaType = (typeof ITEM_MEDIA_TYPES)[number]

export type Category = {
  id: number
  parent_id: number | null
  name: string
  slug: string
}

export type ItemAttribute = {
  id: number
  item_id: number
  name: string
  value: string
  value_type: ItemAttributeValueType
  sort_order: number
}

export type ItemPricingTier = {
  min_qty: number
  price: number
}

export type ItemPricing = {
  id: number
  item_id: number
  pricing_type: PricingType
  currency: string
  fixed_price: number | null
  hourly_rate: number | null
  monthly_rate: number | null
  tiers: ItemPricingTier[]
}

export type ItemMedia = {
  id: number
  item_id: number
  file_name: string
  file_url: string
  media_type: ItemMediaType
  sort_order: number
}

export type ItemStats = {
  item_id: number
  views: number
  leads: number
}

export type Item = {
  id: number
  actor_id: number
  type: CatalogItemType
  category_id: number
  title: string
  description: string | null
  status: ItemStatus
  invoice?: boolean
  created_at: string
}

export type ItemWithRelations = Item & {
  category?: Category
  attributes: ItemAttribute[]
}

/** Seller summary returned with a public catalog item. */
export type CatalogItemActor = {
  id: number
  name: string
  rating: number
  photo: string | null
  vip: boolean
  promoted: boolean
  subscription_plan?: string | null
}

export type CatalogItemWithRelations = ItemWithRelations & {
  pricing: ItemPricing | null
  media: ItemMedia[]
  stats: ItemStats | null
  rejection_reason?: string | null
  actor?: CatalogItemActor | null
}

export type ItemCreate = Omit<Item, "id" | "created_at"> & {
  status?: ItemStatus
}

export type ItemUpdate = Partial<Omit<Item, "id" | "created_at">>

export type CategoryCreate = Omit<Category, "id">

export type CategoryUpdate = Partial<CategoryCreate>

export type ItemAttributeCreate = Omit<ItemAttribute, "id">

export type ItemAttributeUpdate = Partial<
  Omit<ItemAttributeCreate, "item_id">
>

export type ItemPricingCreate = Omit<ItemPricing, "id" | "item_id">

export type ItemMediaCreate = Omit<ItemMedia, "id" | "item_id" | "sort_order"> & {
  sort_order?: number
}

export type CatalogItemInput = {
  type: CatalogItemType
  category_id: number
  title: string
  description: string
  status: ItemStatus
  invoice?: boolean
  attributes: Array<Omit<ItemAttributeCreate, "item_id" | "sort_order"> & { sort_order?: number }>
  media: ItemMediaCreate[]
  pricing: ItemPricingCreate
}
