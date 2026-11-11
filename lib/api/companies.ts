import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type {
  CompanyCertificate,
  CompanyInvitation,
  CompanyUser,
  CompanyWizardInput,
  CompanyWithRelations,
  ItemReviewEligibility,
  PublicCompanyDetail,
  Review,
} from "@/types"
import { apiFetch } from "./client"

export type TeamMemberPayload = { email: string; role: string }
export type TeamMemberUpdatePayload = {
  role?: string
  /** null: the company role applies again on this side. */
  buyer_role?: string | null
  supplier_role?: string | null
}
export type CertificateCreatePayload = {
  title: string
  issuer: string
  issue_date: string
  expiry_date?: string | null
  file_url: string
}
export type CertificateUpdatePayload = {
  title?: string | null
  issuer?: string | null
  issue_date?: string | null
  expiry_date?: string | null
  file_url?: string | null
}

export type CompanyChangeRequestPayload = {
  title?: string
  legal_name?: string
  tax_number?: string
  address?: string
  city?: string
  country?: string
  reason?: string
}

/** Pictures in a change request: what is shown now and what was sent. */
export type ChangeRequestMedia = Record<
  string,
  { before: string | string[] | null; after: string | string[] | null }
>

export type CompanyChangeRequest = {
  id: number
  kind?: "company" | "user"
  company_id: number | null
  target_user_id?: number | null
  company_title?: string | null
  requested_by_user_id: number
  status: string
  proposed: Record<string, unknown>
  current_snapshot: Record<string, unknown>
  media?: ChangeRequestMedia
  reason_from_user: string | null
  admin_reason: string | null
  reviewed_by_user_id: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  field_labels?: Record<string, string>
}

const PREFIX = "/buyer/companies"

type CompanyUpdatePayload = {
  title?: string
  legal_name?: string | null
  tax_number?: string | null
  website?: string | null
  description?: string | null
  logo?: string | null
  cover?: string | null
  country?: string | null
  city?: string | null
  address?: string | null
  founded_year?: number | null
  employees_count?: number | null
  annual_revenue_range?: string | null
  languages?: string[]
  industries?: string[]
  category_ids?: number[]
  actor_types?: string[]
}

const wizardToUpdate = (data: CompanyWizardInput): CompanyUpdatePayload => ({
  title: data.title,
  legal_name: data.legal_name || null,
  tax_number: data.tax_number || null,
  website: data.website || null,
  description: data.description || null,
  logo: data.logo || null,
  country: data.country || null,
  city: data.city || null,
  address: data.address || null,
  founded_year: data.founded_year ? Number(data.founded_year) : null,
  employees_count: data.employees_count ? Number(data.employees_count) : null,
  annual_revenue_range: data.annual_revenue_range || null,
  languages: data.languages,
  industries: data.industries,
  category_ids: data.category_ids,
  actor_types: data.actor_types,
})

export const buyerCompaniesApi = {
  mine: (params: PageParams = {}) =>
    apiFetch<Page<CompanyWithRelations>>(`${PREFIX}/me${buildPageQuery(params)}`),

  get: (companyId: number) =>
    apiFetch<CompanyWithRelations>(`${PREFIX}/${companyId}`),

  create: (data: CompanyWizardInput) =>
    apiFetch<CompanyWithRelations>(`${PREFIX}/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (companyId: number, data: CompanyWizardInput) =>
    apiFetch<CompanyWithRelations>(`${PREFIX}/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify(wizardToUpdate(data)),
    }),

  uploadLogo: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<{ logo: string }>(`${PREFIX}/logo`, {
      method: "POST",
      body: form,
    })
  },

  /** Invites a person; they join the team after accepting. */
  addTeamMember: (companyId: number, data: TeamMemberPayload) =>
    apiFetch<CompanyInvitation>(`${PREFIX}/${companyId}/team`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  invitations: (companyId: number) =>
    apiFetch<CompanyInvitation[]>(`${PREFIX}/${companyId}/invitations`),

  /** A new link; the old one stops working. */
  resendInvitation: (companyId: number, invitationId: number) =>
    apiFetch<CompanyInvitation>(`${PREFIX}/${companyId}/invitations/${invitationId}/resend`, {
      method: "POST",
    }),

  cancelInvitation: (companyId: number, invitationId: number) =>
    apiFetch<void>(`${PREFIX}/${companyId}/invitations/${invitationId}`, {
      method: "DELETE",
    }),

  updateTeamMember: (
    companyId: number,
    targetUserId: number,
    data: TeamMemberUpdatePayload,
  ) =>
    apiFetch<CompanyUser>(`${PREFIX}/${companyId}/team/${targetUserId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  removeTeamMember: (companyId: number, targetUserId: number) =>
    apiFetch<void>(`${PREFIX}/${companyId}/team/${targetUserId}`, {
      method: "DELETE",
    }),

  uploadCertificateFile: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<{ file_url: string }>(`${PREFIX}/certificates/upload`, {
      method: "POST",
      body: form,
    })
  },

  addCertificate: (companyId: number, data: CertificateCreatePayload) =>
    apiFetch<{ id: number }>(`${PREFIX}/${companyId}/certificates`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCertificate: (
    companyId: number,
    certificateId: number,
    data: CertificateUpdatePayload,
  ) =>
    apiFetch<CompanyCertificate>(
      `${PREFIX}/${companyId}/certificates/${certificateId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),

  removeCertificate: (companyId: number, certificateId: number) =>
    apiFetch<void>(`${PREFIX}/${companyId}/certificates/${certificateId}`, {
      method: "DELETE",
    }),

  submitChangeRequest: (companyId: number, data: CompanyChangeRequestPayload) =>
    apiFetch<CompanyChangeRequest>(`${PREFIX}/${companyId}/change-requests`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listChangeRequests: (companyId: number) =>
    apiFetch<CompanyChangeRequest[]>(`${PREFIX}/${companyId}/change-requests`),

  pendingChangeRequest: (companyId: number) =>
    apiFetch<CompanyChangeRequest | null>(
      `${PREFIX}/${companyId}/change-requests/pending`,
    ),
}

export const companiesApi = {
  mine: (params?: PageParams) => buyerCompaniesApi.mine(params),

  get: (id: number) => apiFetch<PublicCompanyDetail>(`/public/companies/${id}`),

  suppliers: (q?: string, category?: string, params: PageParams = {}) =>
    apiFetch<Page<CompanyWithRelations>>(
      `/public/suppliers${buildPageQuery({ ...params, q, category })}`,
    ),
}

export type ReviewCreatePayload = {
  contract_id: number
  target_actor_id: number
  rating: number
  service_rating?: number | null
  delivery_rating?: number | null
  quality_rating?: number | null
  tags?: string[]
  comment?: string | null
  photos?: Array<{ file_name: string; file_url: string }>
}

export const reviewsApi = {
  listGiven: (params: PageParams = {}) =>
    apiFetch<Page<Review>>(`/buyer/reviews/${buildPageQuery(params)}`),

  listReceived: (params: PageParams = {}) =>
    apiFetch<Page<Review>>(`/buyer/reviews/received${buildPageQuery(params)}`),

  create: (data: ReviewCreatePayload) =>
    apiFetch<Review>("/buyer/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadMedia: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<{ file_name: string; file_url: string }>("/buyer/reviews/media", {
      method: "POST",
      body: form,
    })
  },

  voteHelpful: (reviewId: number) =>
    apiFetch<Review>(`/buyer/reviews/${reviewId}/helpful`, { method: "POST" }),

  /** The finished deal for this catalog item the buyer can still review. */
  itemEligibility: (itemId: number) =>
    apiFetch<ItemReviewEligibility>(`/buyer/reviews/catalog-items/${itemId}/eligibility`),
}

export const supplierReviewsApi = {
  listGiven: (params: PageParams = {}) =>
    apiFetch<Page<Review>>(`/supplier/reviews/${buildPageQuery(params)}`),

  listReceived: (params: PageParams = {}) =>
    apiFetch<Page<Review>>(
      `/supplier/reviews/received${buildPageQuery(params)}`,
    ),

  create: (data: ReviewCreatePayload) =>
    apiFetch<Review>("/supplier/reviews/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadMedia: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<{ file_name: string; file_url: string }>(
      "/supplier/reviews/media",
      { method: "POST", body: form },
    )
  },

  voteHelpful: (reviewId: number) =>
    apiFetch<Review>(`/supplier/reviews/${reviewId}/helpful`, { method: "POST" }),
}
