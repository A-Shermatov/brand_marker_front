export type MarketplaceSubcategory = {
  id: string
  label: string
  slug: string
}

export type MarketplaceCategory = {
  id: string
  label: string
  slug: string
  icon: string
  count: string
  subcategories: MarketplaceSubcategory[]
  color: string
  iconBg: string
  iconColor: string
}

export type ServiceBadge = {
  label: string
  className: string
}

export type MarketplaceService = {
  id: number
  title: string
  description: string
  provider: string
  providerId: number
  city: string
  rating: number
  reviews: number
  price: string
  tags: string[]
  verified: boolean
  badge: ServiceBadge | null
  icon: string
  iconBg: string
  iconColor: string
  imageUrl: string | null
  moqLabel: string | null
  activityLabel: string | null
  saves: number
  views: string
  categoryId: string
  /** Accepts company invoice payment; defaults to true when omitted. */
  invoice?: boolean
  /** Reliability tier of the supplier: silver / gold / diamond */
  providerTier?: string
  /** Active subscription plan of the supplier */
  providerPlan?: string | null
}

export type MarketplacePerformer = {
  id: number
  name: string
  category: string
  categoryId: string
  city: string
  rating: number
  reviews: number
  clients: string
  years: string
  initials: string
  imageUrl?: string | null
  color: string
  specialties: string[]
  verified: boolean
  /** pending | verified | rejected | needs_documents */
  verificationStatus?: string
  featured: boolean
  vip?: boolean
  promoted?: boolean
  /** Reliability tier: silver / gold / diamond */
  tier?: string
  /** Active subscription plan */
  plan?: string | null
  worldwide: boolean
  icon: string
  description: string
}

export type MarketplaceRequest = {
  id: number
  title: string
  budget: string
  city: string
  time: string
  offers: number
  icon: string
  categoryId: string
}
