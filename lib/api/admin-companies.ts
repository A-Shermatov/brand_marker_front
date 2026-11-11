import { apiFetch } from "@/lib/api/client"
import type {
  AdminCompanyDetail,
  AdminCompanyVerificationStatus,
} from "@/lib/api/admin"

export type AdminCompanyMemberRole = "admin" | "moderator" | "accountant" | "viewer"

export const ADMIN_COMPANY_MEMBER_ROLE_LABELS: Record<string, string> = {
  director: "Директор",
  admin: "Администратор",
  moderator: "Модератор",
  accountant: "Бухгалтер",
  viewer: "Наблюдатель",
}

export type AdminCompanyUpdateInput = Partial<{
  title: string
  legal_name: string | null
  tax_number: string | null
  website: string | null
  description: string | null
  country: string | null
  city: string | null
  address: string | null
  founded_year: number | null
  employees_count: number | null
  annual_revenue_range: string | null
  languages: string[]
  industries: string[]
}>

export type AdminCompanyDocumentInput = {
  file: File
  title: string
  issuer: string
  issueDate: string
  expiryDate?: string | null
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

export const adminCompaniesApi = {
  update: (companyId: number, data: AdminCompanyUpdateInput) =>
    apiFetch<AdminCompanyDetail>(`/admin/companies/${companyId}`, json("PATCH", data)),
  uploadLogo: (companyId: number, file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<{ logo: string; logo_url: string | null }>(
      `/admin/companies/${companyId}/logo`,
      { method: "POST", body: form },
    )
  },
  addMember: (companyId: number, email: string, role: AdminCompanyMemberRole) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/members`,
      json("POST", { email: email.trim(), role }),
    ),
  updateMember: (companyId: number, userId: number, role: AdminCompanyMemberRole) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/members/${userId}`,
      json("PATCH", { role }),
    ),
  removeMember: (companyId: number, userId: number) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/members/${userId}`,
      json("DELETE"),
    ),
  changeOwner: (
    companyId: number,
    payload: { userId?: number; email?: string; reason?: string },
  ) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/owner`,
      json("POST", {
        ...(payload.userId ? { user_id: payload.userId } : {}),
        ...(payload.email?.trim() ? { email: payload.email.trim() } : {}),
        reason: payload.reason?.trim() || null,
      }),
    ),
  setCategories: (companyId: number, categoryIds: number[]) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/categories`,
      json("PUT", { category_ids: categoryIds }),
    ),
  addDocument: (companyId: number, input: AdminCompanyDocumentInput) => {
    const form = new FormData()
    form.append("file", input.file)
    form.append("title", input.title.trim())
    form.append("issuer", input.issuer.trim())
    form.append("issue_date", input.issueDate.trim())
    if (input.expiryDate?.trim()) form.append("expiry_date", input.expiryDate.trim())
    return apiFetch<AdminCompanyDetail>(`/admin/companies/${companyId}/documents`, {
      method: "POST",
      body: form,
    })
  },
  deleteDocument: (companyId: number, documentId: number) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/documents/${documentId}`,
      json("DELETE"),
    ),
  setVerificationStatus: (
    companyId: number,
    status: AdminCompanyVerificationStatus,
    reason?: string,
  ) =>
    apiFetch<AdminCompanyDetail>(
      `/admin/companies/${companyId}/verification-status`,
      json("POST", { status, reason: reason?.trim() || null }),
    ),
}
