import { apiFetch } from "@/lib/api/client"
import type { PlatformSettings, PlatformSettingsInput } from "@/lib/api/public"
import type { Page } from "@/lib/pagination"

export type AdminDashboardMetrics = {
  total_users: number
  total_companies: number
  catalog_items: number
  active_rfqs: number
  active_contracts: number
  escrow_balance: number
  open_disputes: number
  monthly_revenue: number
  pending_verifications: number
  pending_catalog: number
  open_reports: number
  pending_payouts: number
  flagged_chats: number
  pending_company_changes: number
  users_without_2fa?: number
  failed_logins_24h?: number
}

export type AdminActivityType =
  | "registration"
  | "contract"
  | "payment"
  | "dispute"

export type AdminActivityItem = {
  id: string
  type: AdminActivityType
  title: string
  description: string
  happened_at: string
}

export type AdminDashboardResponse = {
  metrics: AdminDashboardMetrics
  recent_activity: AdminActivityItem[]
}

export type AdminUserStatus = "pending" | "active" | "blocked"

export type AdminUserRole =
  | "buyer"
  | "supplier"
  | "both"
  | "admin"
  | "superadmin"
  | "moderator"

export type AdminUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role: AdminUserRole
  status: AdminUserStatus
  banned_until?: string | null
  block_reason?: string | null
  created_at: string
  updated_at: string
  company_id?: number | null
  company_title?: string | null
  contracts_count?: number
  contracts_sum?: number
}

export type AdminUserStatusFilter = AdminUserStatus | "all"
export type AdminUserTabFilter = "all" | "buyer" | "supplier" | "blocked"

export type AdminUserStatusCounts = Record<AdminUserStatusFilter, number>
export type AdminUserTabCounts = Record<AdminUserTabFilter, number>

export type AdminUsersResponse = {
  items: AdminUser[]
  total: number
  page: number
  page_size: number
  pages: number
  status_counts: AdminUserStatusCounts
  tab_counts: AdminUserTabCounts
}

export type AdminUsersParams = {
  page: number
  pageSize: number
  status: AdminUserStatusFilter
  roleSide?: "buyer" | "supplier" | null
  query: string
}

export type AdminUserCompany = {
  id: number
  title: string
  verification_status: string
  rating: number
  reviews_count: number
  vip?: boolean
  vip_until?: string | null
}

export type AdminUserStats = {
  purchases_count: number
  sales_count: number
  contracts_sum: number
  disputes_count: number
  rating: number | null
  reviews_count: number
  chats_count: number
  flagged_chats_count: number
}

export type AdminUserContractItem = {
  id: number
  title: string
  status: string
  agreed_amount: number
  currency: string
  role: "buyer" | "supplier"
  counterparty: string
  counterparty_company_id: number | null
  created_at: string
  has_dispute: boolean
}

export type AdminUserHistoryItem = {
  id: number
  action: string
  details: Record<string, unknown>
  created_at: string
  actor: { id: number; email: string; name: string } | null
}

export type AdminUserChatItem = {
  id: string
  kind: string
  about: string
  ref_label: string
  party_a: string
  party_b: string
  last_text: string
  last_at: string | null
  flagged: boolean
}

export type AdminUserDocumentItem = {
  id: number | string
  title: string
  file_url: string | null
  kind: string
}

export type AdminUserDetail = AdminUser & {
  companies: AdminUserCompany[]
  stats: AdminUserStats
  contracts: AdminUserContractItem[]
  history: AdminUserHistoryItem[]
  chats: AdminUserChatItem[]
  documents: AdminUserDocumentItem[]
  verification_checklist: Record<string, boolean>
}

export type AdminCompanyVerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "needs_documents"

export type AdminCompanyOperationalStatus = "active" | "blocked" | "deactivated"
export type AdminCompanyStatusFilter =
  | "all"
  | "verified"
  | "pending"
  | "rejected"
  | "blocked"
export type AdminCompanyAction =
  | "approve"
  | "reject"
  | "request_documents"
  | "block"
  | "deactivate"
  | "reactivate"

export type AdminCompanyOwner = {
  id: number
  email: string
  name: string
}

export type AdminCompany = {
  id: number
  title: string
  actor_type: "buyer" | "supplier"
  actor_types: Array<"buyer" | "supplier">
  owner: AdminCompanyOwner
  legal_name: string | null
  tax_number: string | null
  logo: string | null
  country: string | null
  city: string | null
  verification_status: AdminCompanyVerificationStatus
  operational_status: AdminCompanyOperationalStatus
  rating: number
  vip?: boolean
  vip_until?: string | null
  created_at: string
  members_count?: number
  products_count?: number
  contracts_count?: number
}

export type AdminCompanySide = "buyer" | "supplier"
export type AdminCompanySort = "created_at" | "title" | "rating"

export type AdminCompaniesParams = {
  page: number
  pageSize: number
  status: AdminCompanyStatusFilter
  query: string
  actorType?: AdminCompanySide | null
  verificationStatus?: AdminCompanyVerificationStatus | null
  operationalStatus?: AdminCompanyOperationalStatus | null
  vip?: boolean | null
  sort?: AdminCompanySort
  order?: "asc" | "desc"
}

export type AdminCompaniesResponse = {
  items: AdminCompany[]
  total: number
  page: number
  page_size: number
  pages: number
  status_counts: Record<AdminCompanyStatusFilter, number>
}

export type AdminCompanyCatalogItem = {
  id: number
  title: string
  status: string
  category: string | null
  price: number | null
  currency: string | null
  views: number
  leads: number
  created_at: string
}

export type AdminCompanyDetail = AdminCompany & {
  website: string | null
  description: string | null
  address: string | null
  updated_at: string
  profile: {
    founded_year: number | null
    employees_count: number | null
    annual_revenue_range: string | null
    languages: string[]
    industries: string[]
  } | null
  stats: {
    completed_contracts: number
    active_contracts: number
    disputes_count: number
    average_rating: number
  } | null
  members: Array<{
    id: number
    user_id: number
    role: string
    email: string
    name: string
    status: string
    is_owner?: boolean
  }>
  categories?: Array<{ id: number; name: string }>
  certificates: Array<{
    id: number
    title: string
    issuer: string
    issue_date: string
    expiry_date: string | null
    file_url: string
  }>
  products: AdminCompanyCatalogItem[]
  services: AdminCompanyCatalogItem[]
  contracts: Array<{
    id: number
    title: string
    status: string
    agreed_amount: number
    currency: string
    buyer_actor_id: number
    supplier_actor_id: number
    created_at: string
  }>
  reviews: Array<{
    id: number
    contract_id: number
    reviewer_actor_id: number
    rating: number
    comment: string | null
    created_at: string
  }>
  verification_checklist: Record<
    "legal_name" | "tax_number" | "address" | "website" | "certificates",
    boolean
  >
}

export type AdminCompanyActionResponse = {
  id: number
  action: AdminCompanyAction
  verification_status: AdminCompanyVerificationStatus
  operational_status: AdminCompanyOperationalStatus
}

/** Slim row from GET /admin/companies/pending-verification */
export type AdminPendingVerificationCompany = {
  id: number
  title: string
  actor_type: string
  owner_id: number
  verification_status: AdminCompanyVerificationStatus
}

export type AdminPendingVerificationParams = {
  page: number
  pageSize: number
}

export type AdminCompanyChangeRequest = {
  id: number
  company_id: number
  company_title?: string | null
  requested_by_user_id: number
  status: string
  proposed: Record<string, string>
  current_snapshot: Record<string, string | null>
  reason_from_user: string | null
  admin_reason: string | null
  reviewed_by_user_id: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  field_labels?: Record<string, string>
}

export type AdminCompanyChangeRequestsParams = {
  page: number
  pageSize: number
  status?: "pending" | "approved" | "rejected"
  query?: string
}

export type AdminVerifyCompanyResponse = {
  id: number
  action: AdminCompanyAction
  verification_status: AdminCompanyVerificationStatus
  operational_status: AdminCompanyOperationalStatus
}

export type AdminCatalogView =
  | "all"
  | "products"
  | "services"
  | "draft"
  | "reported"
  | "hidden"

export type AdminCatalogAction =
  | "approve"
  | "hide"
  | "reject"
  | "delete"
  | "restore"

export type AdminCatalogItemStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "active"
  | "hidden"
  | "archived"
  | "deleted"

export type AdminCatalogSort =
  | "created_at"
  | "updated_at"
  | "price"
  | "title"
  | "views"
  | "reports"

export type AdminCatalogItemsParams = {
  page: number
  pageSize: number
  type?: "product" | "service"
  status?: AdminCatalogItemStatus[]
  companyId?: number
  actorId?: number
  supplier?: string
  categoryId?: number
  priceMin?: number
  priceMax?: number
  hasReports?: boolean
  query?: string
  sort?: AdminCatalogSort
  order?: "asc" | "desc"
  includeDeleted?: boolean
}

export type AdminCatalogManageItem = {
  id: number
  title: string
  type: "product" | "service"
  status: AdminCatalogItemStatus
  category_id: number | null
  category_name: string | null
  preview_url: string | null
  open_reports_count: number
  reports_count: number
  owner: AdminCatalogOwner | null
  pricing_type: string | null
  currency: string | null
  price: number | null
  created_at: string
  updated_at: string | null
  views: number
  leads: number
}

export type AdminCatalogStatusCounts = Record<AdminCatalogItemStatus | "all", number>

export type AdminCatalogItemsResponse = {
  items: AdminCatalogManageItem[]
  total: number
  page: number
  page_size: number
  pages: number
  status_counts: AdminCatalogStatusCounts
}

export type AdminCatalogPricingInput = {
  pricing_type: "fixed" | "tiered" | "hourly" | "monthly"
  currency: string
  fixed_price?: number | null
  hourly_rate?: number | null
  monthly_rate?: number | null
  tiers?: Array<{ min_qty: number; price: number }>
}

export type AdminCatalogItemUpdate = {
  type?: "product" | "service"
  category_id?: number
  title?: string
  description?: string
  invoice?: boolean
  pricing?: AdminCatalogPricingInput
  attributes?: Array<{ name: string; value: string; value_type?: string }>
  reason?: string
  notify_owner?: boolean
}

export type AdminCatalogBulkAction = "approve" | "hide" | "reject" | "delete" | "restore"

export type AdminCatalogBulkActionResponse = {
  action: AdminCatalogBulkAction
  succeeded: number[]
  failed: Array<{ id: number; error: string }>
}

export type AdminCatalogOwner = {
  actor_id: number
  actor_kind: string
  display_name: string
  company_id: number | null
  company_title: string | null
  user_id: number | null
  email: string | null
  name: string
}

export type AdminCatalogItem = {
  id: number
  title: string
  type: "product" | "service"
  status: string
  category_name: string | null
  preview_url: string | null
  open_reports_count: number
  owner: AdminCatalogOwner | null
  created_at: string
  views: number
  leads: number
}

export type AdminCatalogParams = {
  page: number
  pageSize: number
  view: AdminCatalogView
  query: string
}

export type AdminCatalogListResponse = {
  items: AdminCatalogItem[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminCatalogView, number>
}

export type AdminCatalogDetail = AdminCatalogItem & {
  description: string | null
  updated_at: string
  invoice: boolean
  category: { id: number; name: string; slug: string } | null
  attributes: Array<{
    id: number
    name: string
    value: string
    value_type: string
    sort_order: number
  }>
  pricing: {
    pricing_type: string
    currency: string
    fixed_price: number | null
    hourly_rate: number | null
    monthly_rate: number | null
    tiers: Array<{ min_qty: number; price: number }>
  } | null
  media: Array<{
    id: number
    file_name: string
    file_url: string
    media_type: string
    sort_order: number
  }>
  stats: { views: number; leads: number }
  reports: Array<{
    id: number
    reason: string
    details: string | null
    status: string
    created_at: string
    resolved_at: string | null
    reporter: { id: number; email: string; name: string }
  }>
  history: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminCatalogActionResponse = {
  id: number
  action: AdminCatalogAction
  status: string
}

export type AdminParty = {
  actor_id: number
  actor_kind: string
  display_name: string
  company_id: number | null
  company_title: string | null
  user_id: number | null
  email: string | null
  name: string
}

export type AdminRfqView =
  | "published"
  | "closed"
  | "draft"
  | "reported"
  | "archived"

export type AdminRfqAction = "hide" | "close" | "delete" | "warn_buyer"

export type AdminRfq = {
  id: string
  title: string
  type: "product" | "service"
  status: string
  category_id: string
  currency: string
  budget_from: number | null
  budget_to: number | null
  deadline: string
  proposals_count: number
  open_reports_count: number
  buyer: AdminParty | null
  created_at: string
  updated_at: string
}

export type AdminRfqParams = {
  page: number
  pageSize: number
  view: AdminRfqView
  query: string
}

export type AdminRfqListResponse = {
  items: AdminRfq[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminRfqView, number>
}

export type AdminRfqDetail = AdminRfq & {
  description: string | null
  requirements: {
    type: string
    category_id: string
    budget_type: string
    budget_from: number | null
    budget_to: number | null
    currency: string
    deadline: string
    visibility: string
    quantity: number | null
    delivery_country: string | null
    delivery_city: string | null
    delivery_address: string | null
    delivery_date: string | null
    project_duration: string | null
    start_date: string | null
    team_size_required: number | null
    experience_required: string | null
    attachments: Array<{
      id: string
      file_name: string
      file_url: string
      file_type: string
    }>
  }
  buyer: AdminParty | null
  proposals: Array<{
    id: number
    supplier_actor_id: number
    supplier: AdminParty | null
    price: number
    currency: string
    delivery_time: string | null
    message: string | null
    status: string
    created_at: string
    has_attachment: boolean
  }>
  messages: Array<{
    id: string
    source: string
    proposal_id?: number | null
    contract_id?: number | null
    sender_name: string
    text: string
    created_at: string
  }>
  reports: Array<{
    id: number
    reason: string
    details: string | null
    status: string
    created_at: string
    resolved_at: string | null
    reporter: { id: number; email: string; name: string }
  }>
  history: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminRfqActionResponse = {
  id: string
  action: AdminRfqAction
  status: string
}

export type AdminProposalView =
  | "all"
  | "pending"
  | "accepted"
  | "rejected"
  | "reported"

export type AdminProposalAction = "delete" | "investigate" | "block_supplier"

export type AdminProposal = {
  id: number
  rfq_id: string
  rfq_title: string | null
  price: number
  currency: string
  status: string
  open_reports_count: number
  has_contract: boolean
  supplier: AdminParty | null
  buyer: AdminParty | null
  created_at: string
}

export type AdminProposalParams = {
  page: number
  pageSize: number
  view: AdminProposalView
  query: string
}

export type AdminProposalListResponse = {
  items: AdminProposal[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminProposalView, number>
}

export type AdminProposalDetail = AdminProposal & {
  delivery_time: string | null
  message: string | null
  attachment: {
    id: number
    file_name: string
    file_url: string
    file_type: string
  } | null
  supplier: AdminParty | null
  buyer: AdminParty | null
  rfq: { id: string; title: string; status: string } | null
  contract: {
    id: number
    title: string
    status: string
    agreed_amount: number
    currency: string
    created_at: string
  } | null
  messages: Array<{
    id: string
    source: string
    text: string
    sender_name: string
    created_at: string
  }>
  reports: Array<{
    id: number
    reason: string
    details: string | null
    status: string
    created_at: string
    resolved_at: string | null
    reporter: { id: number; email: string; name: string }
  }>
  history: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminProposalActionResponse = {
  id: number
  action: AdminProposalAction
  status: string
  blocked_company_id: number | null
}

export type AdminContractView =
  | "active"
  | "completed"
  | "cancelled"
  | "disputed"

export type AdminContractAction =
  | "freeze"
  | "cancel"
  | "force_complete"
  | "open_investigation"

export type AdminContract = {
  id: number
  title: string
  status: string
  agreed_amount: number
  currency: string
  payment_type: string
  rfq_id: string
  proposal_id: number
  buyer: AdminParty | null
  supplier: AdminParty | null
  escrow_held: number
  created_at: string
}

export type AdminContractParams = {
  page: number
  pageSize: number
  view: AdminContractView
  query: string
}

export type AdminContractListResponse = {
  items: AdminContract[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminContractView, number>
}

export type AdminContractDetail = AdminContract & {
  description: string | null
  start_date: string
  due_date: string
  payment_type: string
  buyer: AdminParty | null
  supplier: AdminParty | null
  rfq: { id: string; title: string; status: string } | null
  proposal: { id: number; price: number; status: string } | null
  payment_plan: { id: number; payment_type: string } | null
  milestones: Array<{
    id: number
    title: string
    percentage: number
    amount: number
    trigger: string
    status: string
  }>
  files: Array<{
    id: number
    file_name: string
    file_url: string
    file_type: string
    uploaded_by: number
    uploaded_by_name?: string | null
    uploaded_by_side?: "buyer" | "supplier" | null
    created_at: string
  }>
  messages: Array<{
    id: number
    sender_id: number
    text: string
    created_at: string
  }>
  escrow: {
    held: number
    released: number
    disputed: number
    currency: string
  }
  history: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminContractActionResponse = {
  id: number
  action: AdminContractAction
  status: string
}

export type AdminDisputeView =
  | "open"
  | "under_review"
  | "resolved"
  | "appealed"

export type AdminDisputeAction =
  | "release_funds"
  | "refund_buyer"
  | "partial_refund"
  | "request_evidence"
  | "close_case"

export type AdminDispute = {
  id: number
  status: string
  contract_id: number
  contract_title: string | null
  contract_amount: number | null
  currency: string | null
  opened_by_actor_id: number | null
  opened_by: AdminParty | null
  buyer: AdminParty | null
  supplier: AdminParty | null
  created_at: string
  updated_at: string
}

export type AdminDisputeParams = {
  page: number
  pageSize: number
  view: AdminDisputeView
  query: string
}

export type AdminDisputeListResponse = {
  items: AdminDispute[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminDisputeView, number>
}

export type AdminDisputeDetail = AdminDispute & {
  buyer_statement: string | null
  supplier_statement: string | null
  admin_instructions: string | null
  resolution: string | null
  resolution_note: string | null
  partial_buyer_amount: number | null
  resolved_at: string | null
  buyer: AdminParty | null
  supplier: AdminParty | null
  chat_id?: string | null
  conversation_id?: number | null
  contract: {
    id: number
    title: string
    status: string
    agreed_amount: number
    currency: string
    rfq_id: string
    proposal_id: number
    description: string | null
  }
  evidence: Array<{
    id: number
    file_name: string
    file_url: string
    file_type: string
    note: string | null
    uploaded_by_actor_id: number | null
    created_at: string
  }>
  files: Array<{
    id: number
    file_name: string
    file_url: string
    file_type: string
    uploaded_by: number
    uploaded_by_name?: string | null
    uploaded_by_side?: "buyer" | "supplier" | null
    created_at: string
  }>
  messages: Array<{
    id: number
    sender_id: number
    text: string
    created_at: string
  }>
  escrow: {
    held: number
    released: number
    disputed: number
    currency: string
  }
  timeline: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminDisputeActionResponse = {
  id: number
  action: AdminDisputeAction
  status: string
  resolution: string | null
  contract_status: string
  partial_buyer_amount?: number | null
}

export const adminApi = {
  getDashboard: () => apiFetch<AdminDashboardResponse>("/admin/dashboard"),
  getUsers: ({ page, pageSize, status, roleSide, query }: AdminUsersParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (status !== "all") {
      searchParams.set("status", status)
    }
    if (roleSide) {
      searchParams.set("role_side", roleSide)
    }
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminUsersResponse>(`/admin/users?${searchParams.toString()}`)
  },
  getUser: (userId: number) =>
    apiFetch<AdminUserDetail>(`/admin/users/${userId}`),
  updateUserStatus: (
    userId: number,
    status: AdminUserStatus,
    reason?: string | null,
    options?: { durationDays?: number | null; permanent?: boolean },
  ) =>
    apiFetch<AdminUser>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
        ...(options?.durationDays
          ? { duration_days: options.durationDays }
          : {}),
        ...(options?.permanent ? { permanent: true } : {}),
      }),
    }),
  revokeUserSessions: (userId: number) =>
    apiFetch<{ user_id: number; token_version: number }>(
      `/admin/users/${userId}/sessions/revoke`,
      { method: "POST" },
    ),
  setCompanyVip: (
    companyId: number,
    payload: { vip: boolean; months?: number | null; reason?: string | null },
  ) =>
    apiFetch<{ id: number; vip: boolean; vip_until: string | null }>(
      `/admin/companies/${companyId}/vip`,
      {
        method: "POST",
        body: JSON.stringify({
          vip: payload.vip,
          ...(payload.months ? { months: payload.months } : {}),
          ...(payload.reason?.trim()
            ? { reason: payload.reason.trim() }
            : {}),
        }),
      },
    ),
  getCompanies: ({
    page,
    pageSize,
    status,
    query,
    actorType,
    verificationStatus,
    operationalStatus,
    vip,
    sort,
    order,
  }: AdminCompaniesParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      status,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    if (actorType) searchParams.set("actor_type", actorType)
    if (verificationStatus) searchParams.set("verification_status", verificationStatus)
    if (operationalStatus) searchParams.set("operational_status", operationalStatus)
    if (vip != null) searchParams.set("vip", String(vip))
    if (sort) searchParams.set("sort", sort)
    if (order) searchParams.set("order", order)
    return apiFetch<AdminCompaniesResponse>(
      `/admin/companies?${searchParams.toString()}`,
    )
  },
  getCompany: (companyId: number) =>
    apiFetch<AdminCompanyDetail>(`/admin/companies/${companyId}`),
  getPendingVerificationCompanies: ({
    page,
    pageSize,
  }: AdminPendingVerificationParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    return apiFetch<Page<AdminPendingVerificationCompany>>(
      `/admin/companies/pending-verification?${searchParams.toString()}`,
    )
  },
  getCompanyChangeRequests: ({
    page,
    pageSize,
    status = "pending",
    query = "",
  }: AdminCompanyChangeRequestsParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      status,
    })
    if (query.trim()) searchParams.set("query", query.trim())
    return apiFetch<Page<AdminCompanyChangeRequest>>(
      `/admin/companies/change-requests?${searchParams.toString()}`,
    )
  },
  getCompanyChangeRequest: (requestId: number) =>
    apiFetch<AdminCompanyChangeRequest>(
      `/admin/companies/change-requests/${requestId}`,
    ),
  applyCompanyChangeRequestAction: (
    requestId: number,
    action: "approve" | "reject",
    reason?: string,
  ) =>
    apiFetch<AdminCompanyChangeRequest>(
      `/admin/companies/change-requests/${requestId}/action`,
      {
        method: "POST",
        body: JSON.stringify({ action, reason: reason?.trim() || null }),
      },
    ),
  applyCompanyAction: (
    companyId: number,
    action: AdminCompanyAction,
    reason?: string,
  ) =>
    apiFetch<AdminCompanyActionResponse>(`/admin/companies/${companyId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason: reason?.trim() || null }),
    }),
  /** Legacy approve/reject; prefer applyCompanyAction for full action set. */
  verifyCompany: (companyId: number, approved: boolean) =>
    apiFetch<AdminVerifyCompanyResponse>(`/admin/companies/${companyId}/verify`, {
      method: "POST",
      body: JSON.stringify({ approved }),
    }),
  getCatalog: ({ page, pageSize, view, query }: AdminCatalogParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminCatalogListResponse>(
      `/admin/catalog?${searchParams.toString()}`,
    )
  },
  getCatalogItem: (itemId: number) =>
    apiFetch<AdminCatalogDetail>(`/admin/catalog/${itemId}`),
  applyCatalogAction: (
    itemId: number,
    action: AdminCatalogAction,
    reason?: string,
  ) =>
    apiFetch<AdminCatalogActionResponse>(`/admin/catalog/${itemId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason: reason?.trim() || null }),
    }),
  getCatalogItems: (params: AdminCatalogItemsParams) => {
    const searchParams = new URLSearchParams({
      page: String(params.page),
      page_size: String(params.pageSize),
    })
    if (params.type) searchParams.set("type", params.type)
    params.status?.forEach((status) => searchParams.append("status", status))
    if (params.companyId) searchParams.set("company_id", String(params.companyId))
    if (params.actorId) searchParams.set("actor_id", String(params.actorId))
    if (params.supplier?.trim()) searchParams.set("supplier", params.supplier.trim())
    if (params.categoryId) searchParams.set("category_id", String(params.categoryId))
    if (params.priceMin != null) searchParams.set("price_min", String(params.priceMin))
    if (params.priceMax != null) searchParams.set("price_max", String(params.priceMax))
    if (params.hasReports != null) searchParams.set("has_reports", String(params.hasReports))
    if (params.query?.trim()) searchParams.set("query", params.query.trim())
    if (params.sort) searchParams.set("sort", params.sort)
    if (params.order) searchParams.set("order", params.order)
    if (params.includeDeleted) searchParams.set("include_deleted", "true")
    return apiFetch<AdminCatalogItemsResponse>(
      `/admin/catalog/items?${searchParams.toString()}`,
    )
  },
  updateCatalogItem: (itemId: number, data: AdminCatalogItemUpdate) =>
    apiFetch<AdminCatalogDetail>(`/admin/catalog/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadCatalogMedia: (itemId: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<AdminCatalogDetail>(`/admin/catalog/${itemId}/media`, {
      method: "POST",
      body: form,
    })
  },
  deleteCatalogMedia: (itemId: number, mediaId: number) =>
    apiFetch<AdminCatalogDetail>(`/admin/catalog/${itemId}/media/${mediaId}`, {
      method: "DELETE",
    }),
  reorderCatalogMedia: (itemId: number, mediaIds: number[]) =>
    apiFetch<AdminCatalogDetail>(`/admin/catalog/${itemId}/media/order`, {
      method: "PUT",
      body: JSON.stringify({ media_ids: mediaIds }),
    }),
  bulkCatalogAction: (ids: number[], action: AdminCatalogBulkAction, reason?: string) =>
    apiFetch<AdminCatalogBulkActionResponse>("/admin/catalog/bulk-action", {
      method: "POST",
      body: JSON.stringify({ ids, action, reason: reason?.trim() || null }),
    }),
  getRfqs: ({ page, pageSize, view, query }: AdminRfqParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminRfqListResponse>(`/admin/rfqs?${searchParams.toString()}`)
  },
  getRfq: (rfqId: string) => apiFetch<AdminRfqDetail>(`/admin/rfqs/${rfqId}`),
  applyRfqAction: (rfqId: string, action: AdminRfqAction, reason?: string) =>
    apiFetch<AdminRfqActionResponse>(`/admin/rfqs/${rfqId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason: reason?.trim() || null }),
    }),
  getProposals: ({ page, pageSize, view, query }: AdminProposalParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminProposalListResponse>(
      `/admin/proposals?${searchParams.toString()}`,
    )
  },
  getProposal: (proposalId: number) =>
    apiFetch<AdminProposalDetail>(`/admin/proposals/${proposalId}`),
  applyProposalAction: (
    proposalId: number,
    action: AdminProposalAction,
    reason?: string,
  ) =>
    apiFetch<AdminProposalActionResponse>(`/admin/proposals/${proposalId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason: reason?.trim() || null }),
    }),
  getContracts: ({ page, pageSize, view, query }: AdminContractParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminContractListResponse>(
      `/admin/contracts?${searchParams.toString()}`,
    )
  },
  getContract: (contractId: number) =>
    apiFetch<AdminContractDetail>(`/admin/contracts/${contractId}`),
  applyContractAction: (
    contractId: number,
    action: AdminContractAction,
    reason?: string,
  ) =>
    apiFetch<AdminContractActionResponse>(`/admin/contracts/${contractId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason: reason?.trim() || null }),
    }),
  getDisputes: ({ page, pageSize, view, query }: AdminDisputeParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminDisputeListResponse>(
      `/admin/disputes?${searchParams.toString()}`,
    )
  },
  getDispute: (disputeId: number) =>
    apiFetch<AdminDisputeDetail>(`/admin/disputes/${disputeId}`),
  applyDisputeAction: (
    disputeId: number,
    action: AdminDisputeAction,
    reason?: string,
    partialBuyerAmount?: number,
  ) =>
    apiFetch<AdminDisputeActionResponse>(`/admin/disputes/${disputeId}/action`, {
      method: "POST",
      body: JSON.stringify({
        action,
        reason: reason?.trim() || null,
        partial_buyer_amount: partialBuyerAmount ?? null,
      }),
    }),
  uploadDisputeEvidence: (disputeId: number, file: File, note?: string) => {
    const form = new FormData()
    form.append("file", file)
    if (note?.trim()) form.append("note", note.trim())
    return apiFetch<AdminDisputeDetail>(`/admin/disputes/${disputeId}/evidence`, {
      method: "POST",
      body: form,
    })
  },
  getFinance: ({ page, pageSize, view, query }: AdminFinanceParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminFinanceListResponse>(
      `/admin/finance?${searchParams.toString()}`,
    )
  },
  getFinancePayment: (paymentId: number) =>
    apiFetch<AdminFinanceDetail>(`/admin/finance/${paymentId}`),
  applyFinanceAction: (
    paymentId: number,
    action: AdminFinanceAction,
    reason?: string,
  ) =>
    apiFetch<AdminFinanceActionResponse>(`/admin/finance/${paymentId}/action`, {
      method: "POST",
      body: JSON.stringify({ action, reason: reason?.trim() || null }),
    }),
  exportFinanceCsv: async ({
    view,
    query,
    paymentId,
  }: {
    view: AdminFinanceView
    query?: string
    paymentId?: number
  }) => {
    const { API_URL } = await import("./config")
    const { ensureAccessToken } = await import("./client")
    const searchParams = new URLSearchParams({ view })
    if (query?.trim()) searchParams.set("query", query.trim())
    if (paymentId) searchParams.set("payment_id", String(paymentId))
    const headers = new Headers()
    const token = await ensureAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const res = await fetch(
      `${API_URL}/admin/finance/export?${searchParams.toString()}`,
      { headers },
    )
    if (!res.ok) {
      throw { status: res.status, message: res.statusText }
    }
    return {
      blob: await res.blob(),
      filename:
        paymentId != null ? `finance-${paymentId}.csv` : `finance-${view}.csv`,
    }
  },
  getReports: ({ page, pageSize, view, query }: AdminReportParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminReportListResponse>(
      `/admin/reports?${searchParams.toString()}`,
    )
  },
  getReport: (targetType: AdminReportTargetType, reportId: number) =>
    apiFetch<AdminReportDetail>(`/admin/reports/${targetType}/${reportId}`),
  applyReportAction: (
    targetType: AdminReportTargetType,
    reportId: number,
    action: AdminReportAction,
    reason?: string,
  ) =>
    apiFetch<AdminReportActionResponse>(
      `/admin/reports/${targetType}/${reportId}/action`,
      {
        method: "POST",
        body: JSON.stringify({ action, reason: reason?.trim() || null }),
      },
    ),
  getSettings: () => apiFetch<AdminPlatformSettings>("/admin/settings"),
  updateSettings: (data: PlatformSettingsInput) =>
    apiFetch<AdminPlatformSettings>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getCategories: () => apiFetch<AdminCategoryListResponse>("/admin/categories"),
  createCategory: (data: AdminCategoryInput) =>
    apiFetch<AdminCategory>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategory: (categoryId: number, data: Partial<AdminCategoryInput>) =>
    apiFetch<AdminCategory>(`/admin/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCategory: (categoryId: number) =>
    apiFetch<{ id: number; deleted: boolean }>(`/admin/categories/${categoryId}`, {
      method: "DELETE",
    }),
  getEscrow: ({ page, pageSize, view, query }: AdminEscrowParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      view,
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminEscrowResponse>(`/admin/escrow?${searchParams.toString()}`)
  },
  getMerchantBalances: ({ page, pageSize, query }: AdminMerchantBalancesParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    })
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    return apiFetch<AdminMerchantBalancesResponse>(
      `/admin/merchant-balances?${searchParams.toString()}`,
    )
  },
  getAnalytics: (period: AdminAnalyticsPeriod) =>
    apiFetch<AdminAnalyticsResponse>(`/admin/analytics?period=${period}`),
  getRoles: (params: { page?: number; pageSize?: number } = {}) => {
    const search = new URLSearchParams()
    search.set("page", String(params.page ?? 1))
    search.set("page_size", String(params.pageSize ?? 20))
    return apiFetch<{
      items: AdminRole[]
      total: number
      page: number
      page_size: number
      total_pages: number
    }>(`/admin/roles?${search.toString()}`)
  },
  createRole: (data: AdminRoleInput) =>
    apiFetch<AdminRole>("/admin/roles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateRole: (roleId: number, data: Partial<AdminRoleInput>) =>
    apiFetch<AdminRole>(`/admin/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteRole: (roleId: number) =>
    apiFetch<void>(`/admin/roles/${roleId}`, {
      method: "DELETE",
    }),
  getRoleMatrix: (roleId: number) =>
    apiFetch<AdminRoleMatrix>(`/admin/roles/${roleId}/matrix`),
  updateRoleMatrix: (roleId: number, permissionIds: number[]) =>
    apiFetch<AdminRoleMatrix>(`/admin/roles/${roleId}/matrix`, {
      method: "PUT",
      body: JSON.stringify({ permission_ids: permissionIds }),
    }),
  getStaff: (query: string) => {
    const searchParams = new URLSearchParams()
    if (query.trim()) {
      searchParams.set("query", query.trim())
    }
    const suffix = searchParams.toString()
    return apiFetch<AdminStaffListResponse>(`/admin/staff${suffix ? `?${suffix}` : ""}`)
  },
  createStaff: (data: AdminStaffCreateInput) =>
    apiFetch<AdminStaffMember>("/admin/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStaff: (userId: number, data: AdminStaffUpdateInput) =>
    apiFetch<AdminStaffMember>(`/admin/staff/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getLogs: ({
    page,
    pageSize,
    audience,
    source = "http",
    kind,
    section,
    status,
    category,
    action,
    resourceType,
    resourceId,
    userId,
    period,
    query,
  }: AdminLogParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      audience,
      source,
      period,
    })
    if (source === "http") {
      if (kind) searchParams.set("kind", kind)
      if (section) searchParams.set("section", section)
      if (status) searchParams.set("status", status)
    } else {
      if (category) searchParams.set("category", category)
      if (action?.trim()) searchParams.set("action", action.trim())
    }
    if (resourceType?.trim()) searchParams.set("resource_type", resourceType.trim())
    if (resourceId?.trim()) searchParams.set("resource_id", resourceId.trim())
    if (userId) searchParams.set("user_id", String(userId))
    if (query.trim()) searchParams.set("query", query.trim())
    return apiFetch<AdminLogListResponse>(`/admin/logs?${searchParams.toString()}`)
  },
  getLog: (logId: number) => apiFetch<AnyAdminLogDetail>(`/admin/logs/${logId}`),
  getEntityLogs: ({ resourceType, resourceId, page, pageSize }: AdminEntityLogParams) => {
    const searchParams = new URLSearchParams({
      resource_type: resourceType,
      resource_id: String(resourceId),
      page: String(page),
      page_size: String(pageSize),
    })
    return apiFetch<AdminLogEntityResponse>(`/admin/logs/entity?${searchParams.toString()}`)
  },
  getGatewayLogs: ({
    page,
    pageSize,
    orderId,
    gateway,
    operation,
    direction,
    period,
    query,
  }: AdminGatewayLogParams) => {
    const searchParams = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      period,
    })
    if (orderId.trim()) searchParams.set("order_id", orderId.trim())
    if (gateway) searchParams.set("gateway", gateway)
    if (operation) searchParams.set("operation", operation)
    if (direction) searchParams.set("direction", direction)
    if (query?.trim()) searchParams.set("query", query.trim())
    return apiFetch<AdminGatewayLogListResponse>(`/admin/gateway-logs?${searchParams.toString()}`)
  },
  getGatewayLog: (logId: number) =>
    apiFetch<AdminGatewayLogDetail>(`/admin/gateway-logs/${logId}`),
  exportGatewayLogs: ({
    orderId,
    gateway,
    operation,
    direction,
    period,
    query,
  }: Omit<AdminGatewayLogParams, "page" | "pageSize">) => {
    const searchParams = new URLSearchParams({ period })
    if (orderId.trim()) searchParams.set("order_id", orderId.trim())
    if (gateway) searchParams.set("gateway", gateway)
    if (operation) searchParams.set("operation", operation)
    if (direction) searchParams.set("direction", direction)
    if (query?.trim()) searchParams.set("query", query.trim())
    return apiFetch<AdminGatewayLogExportResponse>(
      `/admin/gateway-logs/export?${searchParams.toString()}`,
    )
  },
}

export type AdminLogAudience = "users" | "staff"

export type AdminLogKind = "login" | "register" | "create" | "update" | "delete" | "view"

export type AdminLogStatus =
  | "success"
  | "invalid"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "rejected"
  | "server_error"

export type AdminLogSection =
  | "auth"
  | "rfqs"
  | "proposals"
  | "contracts"
  | "finance"
  | "catalog"
  | "companies"
  | "staff"
  | "roles"
  | "disputes"
  | "reports"
  | "reviews"
  | "notifications"
  | "subscription"
  | "users"
  | "settings"
  | "other"

export type AdminLogPeriod = "24h" | "7d" | "30d" | "all"

export type AdminLogSource = "events" | "http"

export type AdminLogEventCategory =
  | "auth"
  | "admin.company"
  | "admin.user"
  | "admin.catalog"
  | "admin.contract"
  | "admin.dispute"
  | "admin.finance"
  | "admin.rfq"
  | "admin.proposal"
  | "admin.report"
  | "admin.staff"
  | "rfq"
  | "proposal"
  | "contract"
  | "payment"
  | "catalog"
  | "company"
  | "review"
  | "dispute"
  | "finance"
  | "other"

export type AdminLogParams = {
  page: number
  pageSize: number
  audience: AdminLogAudience
  source?: AdminLogSource
  kind: AdminLogKind | null
  section: AdminLogSection | null
  status: AdminLogStatus | null
  category?: AdminLogEventCategory | null
  action?: string | null
  resourceType?: string | null
  resourceId?: string | null
  userId?: number | null
  period: AdminLogPeriod
  query: string
}

export type AdminEntityLogParams = {
  resourceType: string
  resourceId: string | number
  page: number
  pageSize: number
}

export type AdminLogUser = { id: number; email: string; name: string; role: string }

export type AdminLogItem = {
  source: "http"
  id: number
  created_at: string
  audience: AdminLogAudience
  user: AdminLogUser | null
  guest_email: string | null
  kind: AdminLogKind
  section: AdminLogSection
  status: AdminLogStatus
  object_id: string | null
  ip_address: string | null
}

export type AdminLogDetail = AdminLogItem & {
  fields: Array<{ key: string; value: string; hidden: boolean }>
}

export type AdminLogEventItem = {
  source: "event"
  id: number
  created_at: string
  audience: AdminLogAudience
  user: AdminLogUser | null
  action: string
  category: AdminLogEventCategory
  resource_type: string
  resource_id: string
  actor_id: number | null
  company_id: number | null
  details: Record<string, unknown>
  ip_address: string | null
}

export type AdminLogEventDetail = AdminLogEventItem & {
  user_agent: string | null
}

export type AnyAdminLogItem = AdminLogItem | AdminLogEventItem

export type AnyAdminLogDetail = AdminLogDetail | AdminLogEventDetail

export type AdminLogEntityResponse = {
  items: AdminLogEventItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type AdminLogListResponse = {
  items: AnyAdminLogItem[]
  total: number
  page: number
  page_size: number
  pages: number
  audience_counts: Record<AdminLogAudience, number>
}

export type AdminGatewayLogDirection = "outbound" | "inbound"

export type AdminGatewayPaymentKind = "milestone" | "subscription" | "unknown"

export type AdminGatewayLogParams = {
  page: number
  pageSize: number
  orderId: string
  gateway: string | null
  operation: string | null
  direction: AdminGatewayLogDirection | null
  period: AdminLogPeriod
  query?: string
}

export type AdminGatewayLogItem = {
  id: number
  created_at: string
  responded_at: string | null
  gateway: string
  direction: AdminGatewayLogDirection
  operation: string
  order_id: string | null
  method: string | null
  url: string | null
  response_status: number | null
  error: string | null
  external_transaction_id: string | null
  amount: number | null
  currency: string | null
}

export type AdminGatewayLogDetail = AdminGatewayLogItem & {
  request_headers: unknown
  request_body: unknown
  response_body: unknown
  response_raw: string | null
  payment_kind: AdminGatewayPaymentKind
  milestone_id: number | null
  contract_id: number | null
  subscription_user_id: number | null
  plan: string | null
  gateway_txn_status: string | null
  paid_at: string | null
}

export type AdminGatewayLogListResponse = {
  items: AdminGatewayLogItem[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type AdminGatewayLogExportResponse = {
  generated_at: string
  filters: Record<string, unknown>
  total: number
  items: AdminGatewayLogDetail[]
}

export type AdminRole = {
  id: number
  name: string
  description: string | null
  is_system: boolean
  is_active: boolean
  users_count: number
}

export type AdminRoleInput = {
  name: string
  description: string | null
}

export type AdminPermissionBucket = "read" | "write" | "delete"

export type AdminPermissionCell = {
  permission_id: number | null
  code: string | null
  enabled: boolean
}

export type AdminRoleMatrixRow = {
  resource: string
  alias_ru: string
} & Record<AdminPermissionBucket, AdminPermissionCell>

export type AdminRoleMatrix = {
  role_id: number
  role_name: string
  rows: AdminRoleMatrixRow[]
}

export type AdminStaffStatus = "active" | "blocked" | "pending"

export type AdminStaffMember = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  platform_role: string
  status: AdminStaffStatus
  role_id: number | null
  role_name: string | null
  role_description: string | null
  created_at: string
  updated_at: string
}

export type AdminStaffListResponse = {
  items: AdminStaffMember[]
  total: number
}

export type AdminStaffCreateInput = {
  email: string
  first_name: string
  last_name: string
  phone?: string | null
  password: string
  role_id: number
}

export type AdminStaffUpdateInput = Partial<{
  first_name: string
  last_name: string
  phone: string | null
  role_id: number
  status: Exclude<AdminStaffStatus, "pending">
  password: string
}>

export type AdminPlatformSettings = PlatformSettings & {
  updated_at: string | null
  updated_by_name: string | null
  can_update: boolean
}

export type AdminCategory = {
  id: number
  parent_id: number | null
  name: string
  slug: string
  catalog_items_count: number
  companies_count: number
  children_count: number
}

export type AdminCategoryListResponse = {
  items: AdminCategory[]
}

export type AdminCategoryInput = {
  name: string
  slug: string
  parent_id: number | null
}

export type AdminEscrowView = "held" | "disputed" | "awaiting"

export type AdminEscrowParams = {
  page: number
  pageSize: number
  view: AdminEscrowView
  query: string
}

export type AdminEscrowCurrencySummary = {
  currency: string
  held: number
  disputed: number
  awaiting: number
  expected_commission: number
}

export type AdminEscrowContract = {
  id: number
  title: string
  status: string
  currency: string
  agreed_amount: number
  amount: number
  commission: number
  milestones_count: number
  buyer_name: string | null
  supplier_name: string | null
  created_at: string
}

export type AdminEscrowResponse = {
  summary: AdminEscrowCurrencySummary[]
  view_counts: Record<AdminEscrowView, number>
  items: AdminEscrowContract[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type AdminMerchantRole =
  | "supplier_pool"
  | "platform_commission"
  | "platform_subscriptions"

export type AdminMerchantCard = {
  role: AdminMerchantRole
  source: "deals" | "subscriptions"
  label: string
  hint: string
  terminal_id: string | null
  terminal_masked: string | null
  held: number
  released: number
  refunded: number
  net_released: number
  currency: string
  configured: boolean
}

export type AdminMerchantTotals = {
  held: number
  released: number
  refunded: number
  supplier_available: number
  withdrawn: number
  deals_commission_released: number
  subscriptions_released: number
  currency: string
}

export type AdminSupplierBalanceItem = {
  actor_id: number
  display_name: string | null
  company_id: number | null
  company_title: string | null
  owner_email: string | null
  available: number
  pending: number
  escrow_locked: number
  released: number
  withdrawn: number
  currency: string
}

export type AdminMerchantBalancesResponse = {
  source: "ledger"
  note: string
  gateway_configured: boolean
  marketplace_enabled: boolean
  currency: string
  merchants: AdminMerchantCard[]
  totals: AdminMerchantTotals
  suppliers: {
    items: AdminSupplierBalanceItem[]
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

export type AdminMerchantBalancesParams = {
  page: number
  pageSize: number
  query: string
}

export type AdminAnalyticsPeriod = "30d" | "90d" | "12m"

export type AdminAnalyticsMetrics = {
  users: number
  companies: number
  rfqs: number
  contracts: number
  contract_volume: number
  released: number
  commission: number
}

export type AdminAnalyticsPoint = AdminAnalyticsMetrics & {
  bucket: string
}

export type AdminAnalyticsResponse = {
  period: AdminAnalyticsPeriod
  bucket: "day" | "week" | "month"
  currency: string
  totals: AdminAnalyticsMetrics
  previous_totals: AdminAnalyticsMetrics
  series: AdminAnalyticsPoint[]
}

export type AdminFinanceView =
  | "platform_revenue"
  | "subscriptions"
  | "commission"
  | "refunds"
  | "payouts"

export type AdminFinanceAction = "refund" | "retry" | "mark_paid"

export type AdminFinancePayment = {
  id: number
  type: string
  status: string
  gateway: string
  amount: number
  commission: number
  currency: string
  title: string
  invoice_id: number | null
  withdrawal_id: number | null
  contract_id: number | null
  actor: AdminParty | null
  created_at: string
  updated_at: string
}

export type AdminFinanceParams = {
  page: number
  pageSize: number
  view: AdminFinanceView
  query: string
}

export type AdminFinanceListResponse = {
  items: AdminFinancePayment[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminFinanceView, number>
}

export type AdminFinanceDetail = AdminFinancePayment & {
  description: string | null
  external_id: string | null
  paid_at: string | null
  failed_at: string | null
  refunded_at: string | null
  metadata: Record<string, unknown>
  actor: AdminParty | null
  invoice: {
    id: number
    number: string
    title: string
    status: string
    amount: number
    currency: string
  } | null
  withdrawal: {
    id: number
    amount: number
    status: string
    currency: string
  } | null
  contract: {
    id: number
    title: string
    status: string
  } | null
  subscription_user_id: number | null
  history: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminFinanceActionResponse = {
  id: number
  action: AdminFinanceAction
  status: string
  type: string
}

export type AdminReportView =
  | "all"
  | "spam"
  | "fraud"
  | "counterfeit"
  | "abuse"
  | "other"

export type AdminReportTargetType = "catalog" | "rfq" | "proposal"

export type AdminReportAction = "dismiss" | "warn" | "suspend" | "delete"

export type AdminReportReporter = {
  id: number
  email: string
  name: string
}

export type AdminReportedObject = {
  type: string
  id: string
  title: string
  href: string
  status?: string | null
  owner?: AdminParty | null
}

export type AdminReport = {
  id: number
  target_type: AdminReportTargetType
  reason: string
  status: string
  details_preview: string | null
  created_at: string
  reporter: AdminReportReporter
  reported_object: AdminReportedObject
}

export type AdminReportParams = {
  page: number
  pageSize: number
  view: AdminReportView
  query: string
}

export type AdminReportListResponse = {
  items: AdminReport[]
  total: number
  page: number
  page_size: number
  pages: number
  view_counts: Record<AdminReportView, number>
}

export type AdminReportDetail = {
  id: number
  target_type: AdminReportTargetType
  reason: string
  status: string
  details: string | null
  created_at: string
  resolved_at: string | null
  reporter: AdminReportReporter
  reported_object: AdminReportedObject
  owner: AdminParty | null
  evidence: {
    details: string | null
    files: Array<{
      file_name: string
      file_url: string
      file_type: string
    }>
  }
  history: Array<{
    id: number
    action: string
    details: Record<string, unknown>
    created_at: string
    actor: { id: number; email: string; name: string } | null
  }>
}

export type AdminReportActionResponse = {
  id: number
  target_type: AdminReportTargetType
  action: AdminReportAction
  status: string
}
