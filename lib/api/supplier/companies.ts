import { buildPageQuery, type Page, type PageParams } from "@/lib/pagination"
import type {
  CompanyCertificate,
  CompanyInvitation,
  CompanyUser,
  CompanyWizardInput,
  CompanyWithRelations,
} from "@/types"
import type {
  CertificateCreatePayload,
  CertificateUpdatePayload,
  CompanyChangeRequest,
  CompanyChangeRequestPayload,
  TeamMemberPayload,
  TeamMemberUpdatePayload,
} from "../companies"
import { apiFetch } from "../client"

const PREFIX = "/supplier/companies"

export type CompanyProfileExtras = {
  warehouse_area?: string | null
  markets?: string | null
  brands?: string | null
  notable_clients?: string | null
  gallery?: Array<{ src: string; name: string }>
  /** The wide picture at the top of the page; "" removes it. */
  cover?: string | null
}

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
} & CompanyProfileExtras

const wizardToUpdate = (
  data: CompanyWizardInput & CompanyProfileExtras,
): CompanyUpdatePayload => ({
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
  warehouse_area: data.warehouse_area ?? null,
  markets: data.markets ?? null,
  brands: data.brands ?? null,
  notable_clients: data.notable_clients ?? null,
  gallery: data.gallery ?? [],
  ...(data.cover !== undefined ? { cover: data.cover } : {}),
})

export const supplierCompaniesApi = {
  mine: (params: PageParams = {}) =>
    apiFetch<Page<CompanyWithRelations>>(`${PREFIX}/me${buildPageQuery(params)}`),

  get: (companyId: number) =>
    apiFetch<CompanyWithRelations>(`${PREFIX}/${companyId}`),

  create: (data: CompanyWizardInput) =>
    apiFetch<CompanyWithRelations>(`${PREFIX}/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (companyId: number, data: CompanyWizardInput & CompanyProfileExtras) =>
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
