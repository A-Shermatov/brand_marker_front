import type { CompanyRole, UserPublic } from "./user"

export const ACTOR_TYPES = ["buyer", "supplier"] as const

export type ActorType = (typeof ACTOR_TYPES)[number]

export const VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "needs_documents",
  /** Individual actor that never applied for identity verification. */
  "unverified",
] as const

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export type CompanyProfileGalleryItem = {
  src: string
  name: string
}

export type CompanyProfile = {
  company_id: number
  founded_year: number | null
  employees_count: number | null
  annual_revenue_range: string | null
  languages: string[]
  industries: string[]
  warehouse_area?: string | null
  markets?: string | null
  brands?: string | null
  notable_clients?: string | null
  gallery?: CompanyProfileGalleryItem[]
}

export type CompanyCategory = {
  id: number
  company_id: number
  category_id: number
}

export type CompanyStats = {
  company_id: number
  completed_contracts: number
  active_contracts: number
  disputes_count: number
  average_rating: number
}

export type CompanyCertificate = {
  id: number
  company_id: number
  title: string
  issuer: string
  issue_date: string
  expiry_date: string | null
  file_url: string
}

export type CompanyUser = {
  id: number
  company_id: number
  user_id: number
  role: CompanyRole
  email?: string
  /** First and last name, when the user filled them in. */
  name?: string | null
  /** Role on purchases / sales when it differs from the company role; "none" closes the side. */
  buyer_role?: SideRole | null
  supplier_role?: SideRole | null
}

export type SideRole = "admin" | "moderator" | "accountant" | "viewer" | "none"

/** An invitation to the team, as the company's director or admin sees it. */
export type CompanyInvitation = {
  id: number
  company_id: number
  email: string
  role: Exclude<CompanyRole, "director">
  status: "pending" | "expired" | "declined" | "accepted" | "cancelled"
  invited_by_name: string | null
  created_at: string
  expires_at: string
  responded_at: string | null
  /** Only in the answer to "invite" and "send again". */
  invite_url: string | null
  /** The platform sent a letter with the link. */
  email_sent: boolean
}

/** An invitation waiting for my answer. */
export type MyInvitation = {
  id: number
  company_id: number
  company_title: string
  company_logo: string | null
  role: Exclude<CompanyRole, "director">
  invited_by_name: string | null
  created_at: string
  expires_at: string
}

/** What an invitation link shows before signing in. */
export type InvitationPreview = {
  status: CompanyInvitation["status"]
  company_title: string
  company_logo: string | null
  role: Exclude<CompanyRole, "director">
  email: string
  invited_by_name: string | null
  expires_at: string
}

export type PortfolioItem = {
  title: string
  description: string | null
  /** Public link to the picture; null when the work has none. */
  image: string | null
  link: string | null
}

export type RateUnit = "hour" | "project"

/** A private person's own page: what they do, skills, rate, portfolio. */
export type IndividualPage = {
  headline: string | null
  about: string | null
  skills: string[]
  city: string | null
  website: string | null
  rate_amount: number | null
  rate_currency: string
  rate_unit: RateUnit
  portfolio: PortfolioItem[]
  /** Listed among suppliers as a private person. */
  accepts_orders: boolean
  supplier_actor_id?: number | null
  /** Edits wait for an admin; the public page shows the last approved one. */
  pending_review?: boolean
}

export type ReviewPhoto = {
  id?: number | null
  file_name: string
  file_url: string
  sort_order?: number
}

export type ReviewParty = {
  actor_id: number
  kind: string
  display_name: string
  company_title?: string | null
  user_name?: string | null
}

export type Review = {
  id: number
  contract_id: number
  reviewer_actor_id: number
  target_actor_id: number
  rating: number
  service_rating?: number | null
  delivery_rating?: number | null
  quality_rating?: number | null
  tags?: string[]
  comment: string | null
  created_at: string
  photos?: ReviewPhoto[]
  helpful_count?: number
  viewer_voted?: boolean
  reviewer?: ReviewParty | null
  target?: ReviewParty | null
  /** The employee who wrote it for the reviewing company (newer reviews only). */
  author?: ReviewAuthor | null
  /** Set when the deal came from this catalog item: the review rates it too. */
  catalog_item_id?: number | null
}

/** How buyers rated one catalog item. `distribution` maps stars (5..1) to counts. */
export type ItemReviewSummary = {
  average: number
  count: number
  distribution: Record<string, number>
}

/** The finished deal for an item the buyer can still review, if any. */
export type ItemReviewEligibility = {
  contract_id: number | null
  target_actor_id: number | null
  already_reviewed: boolean
}

export type ReviewAuthor = {
  user_id: number
  name?: string | null
  role?: string | null
  company_title?: string | null
}

export type Company = {
  id: number
  title: string
  actor_type: ActorType
  actor_types?: ActorType[]
  owner_id: number
  team_members: number[]
  legal_name: string | null
  tax_number: string | null
  website: string | null
  description: string | null
  logo: string | null
  /** The wide picture at the top of the company page. */
  cover?: string | null
  country: string | null
  city: string | null
  address: string | null
  verification_status: VerificationStatus
  rating: number
  created_at: string
  updated_at: string
}

export type CompanyWithRelations = Company & {
  profile: CompanyProfile | null
  categories: CompanyCategory[]
  stats: CompanyStats | null
  certificates: CompanyCertificate[]
  reviews: Review[]
  company_users: CompanyUser[]
  /** Reputation per role (supplier / buyer). */
  reputation?: SideReputation[]
  owner?: UserPublic
  team?: UserPublic[]
  /** Fields of the page waiting for an admin; others still see the old ones. */
  pending_changes?: string[]
}

export type CompanyPublic = Company

export type PublicCompanyDetail = Pick<
  Company,
  | "id"
  | "title"
  | "actor_type"
  | "actor_types"
  | "legal_name"
  | "website"
  | "description"
  | "logo"
  | "cover"
  | "country"
  | "city"
  | "verification_status"
  | "rating"
  | "created_at"
  | "updated_at"
> & {
  has_tax_number: boolean
  profile: CompanyProfile | null
  categories: CompanyCategory[]
  stats: CompanyStats | null
  certificates: CompanyCertificate[]
  /** Reputation per role, for a company that both sells and buys. */
  reputation?: SideReputation[]
}

export type SideReputation = {
  side: "supplier" | "buyer" | string
  rating: number | null
  reviews_count: number
  completed_deals: number
}

export type CompanyCreate = Omit<
  Company,
  "id" | "rating" | "created_at" | "updated_at"
> & {
  rating?: number
}

export type CompanyUpdate = Partial<
  Omit<Company, "id" | "created_at" | "updated_at">
>

export type CompanyProfileCreate = Omit<CompanyProfile, "company_id">

export type CompanyProfileUpdate = Partial<CompanyProfileCreate>

export type CompanyCertificateCreate = Omit<CompanyCertificate, "id">

export type CompanyCertificateUpdate = Partial<CompanyCertificateCreate>

export type ReviewCreate = Omit<Review, "id" | "created_at">

export type CompanyWizardCertificate = {
  title: string
  issuer: string
  issue_date: string
  expiry_date: string
  file_url: string
}

export type CompanyWizardTeamMember = {
  email: string
  role: CompanyRole
}

export type CompanyWizardInput = {
  title: string
  legal_name: string
  tax_number: string
  description: string
  logo: string
  country: string
  city: string
  address: string
  website: string
  founded_year: string
  employees_count: string
  annual_revenue_range: string
  languages: string[]
  industries: string[]
  category_ids: number[]
  certificates: CompanyWizardCertificate[]
  team: CompanyWizardTeamMember[]
  actor_types: ActorType[]
}

export const emptyCompanyWizardInput = (): CompanyWizardInput => ({
  title: "",
  legal_name: "",
  tax_number: "",
  description: "",
  logo: "",
  country: "",
  city: "",
  address: "",
  website: "",
  founded_year: "",
  employees_count: "",
  annual_revenue_range: "",
  languages: [],
  industries: [],
  category_ids: [],
  certificates: [],
  team: [],
  actor_types: ["buyer"],
})

export type PublicSupplier = {
  vip?: boolean
  promoted?: boolean
  /** Active paid plan: start / pro / business */
  subscription_plan?: string | null
  actor_id: number
  kind: "individual" | "company"
  display_name: string
  company_id: number | null
  city: string | null
  country: string | null
  description: string | null
  website: string | null
  logo?: string | null
  rating: number
  verification_status: VerificationStatus
  reviews_count: number
  industries: string[]
  active_catalog_count: number
  trust_level: string
  /** Free shield ladder: none | verified | shield | silver | gold */
  reputation_tier?: string
  completed_contracts?: number
  active_contracts?: number
  disputed_contracts?: number
  success_rate?: number | null
  /** Company: the wide picture at the top of its page. */
  cover?: string | null
  /** A private person's page (kind === "individual"); logo is then their photo. */
  headline?: string | null
  skills?: string[]
  rate_amount?: number | null
  rate_currency?: string | null
  rate_unit?: RateUnit | null
  portfolio?: PortfolioItem[]
}

export type PublicBuyer = {
  actor_id: number
  kind: "individual" | "company"
  display_name: string
  company_id: number | null
  city: string | null
  country: string | null
  description: string | null
  website: string | null
  legal_name?: string | null
  rating: number
  verification_status: VerificationStatus
  reviews_count: number
  trust_level: string
  reputation_tier?: string
  completed_contracts?: number
  active_contracts?: number
  disputed_contracts?: number
  success_rate?: number | null
  /** Active paid plan of the owner */
  subscription_plan?: string | null
}
