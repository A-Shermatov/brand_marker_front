import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  ActorType,
  CompanyCertificate,
  CompanyUser,
  CompanyWithRelations,
  CompanyWizardInput,
  Review,
} from "@/types"
import type { CompanyRole } from "@/types/user"
import { mockCompanies, DEMO_BUYER_ACTOR_IDS } from "@/lib/mock/companies"
import { API_MODE } from "@/lib/api/config"
import {
  isSupplierCompany,
  matchesSupplierSearch,
} from "@/lib/supplier-directory"
import type { SubscriptionPlan } from "@/lib/store/subscription-store"
import { canCreateMoreCompanies } from "@/lib/subscription"
import { useAuthStore } from "@/lib/store/auth-store"

type SubmitReviewInput = {
  contractId: number
  reviewerActorId: number
  targetActorId: number
  rating: number
  comment: string | null
}

type CreateCompanyContext = {
  userId: number
  actorType: ActorType
}

type UpdateCompanyPatch = Partial<{
  title: string
  legal_name: string | null
  tax_number: string | null
  website: string | null
  description: string | null
  logo: string | null
  country: string | null
  city: string | null
  address: string | null
  profile: CompanyWithRelations["profile"]
  category_ids: number[]
}>

interface CompaniesState {
  companies: CompanyWithRelations[]
  contractReviewIds: Record<number, number>
  getCompany: (id: number) => CompanyWithRelations | undefined
  getMyCompany: (actorId: number) => CompanyWithRelations | undefined
  getCompaniesForUser: (userId: number) => CompanyWithRelations[]
  getOwnedCompaniesCount: (userId: number) => number
  canUserCreateCompany: (userId: number, plan: SubscriptionPlan) => boolean
  getSupplierCompanies: () => CompanyWithRelations[]
  getSupplierCompaniesByCategory: (
    categorySlug: string,
    getCategoriesForSupplier: (companyId: number) => { slug: string }[],
  ) => CompanyWithRelations[]
  searchSupplierCompanies: (query: string) => CompanyWithRelations[]
  createCompany: (
    input: CompanyWizardInput,
    ctx: CreateCompanyContext,
  ) => CompanyWithRelations
  updateCompany: (id: number, patch: UpdateCompanyPatch) => void
  updateCompanyFromWizard: (id: number, input: CompanyWizardInput) => void
  addCertificate: (
    companyId: number,
    cert: Omit<CompanyCertificate, "id" | "company_id">,
  ) => void
  updateCertificate: (
    companyId: number,
    certId: number,
    patch: Partial<Omit<CompanyCertificate, "id" | "company_id">>,
  ) => void
  removeCertificate: (companyId: number, certId: number) => void
  addTeamMember: (
    companyId: number,
    member: { email: string; role: CompanyRole; userId?: number },
  ) => void
  removeTeamMember: (companyId: number, companyUserId: number) => void
  submitReview: (input: SubmitReviewInput) => Review
  getReviewsGivenByBuyer: (buyerId: number) => Review[]
  hasReviewForContract: (buyerId: number, contractId: number) => boolean
}

const nextId = (ids: number[]): number => {
  if (ids.length === 0) return 1
  return Math.max(...ids) + 1
}

const nextReviewId = (companies: CompanyWithRelations[]): number => {
  const ids: number[] = []
  for (const company of companies) {
    for (const review of company.reviews) {
      ids.push(review.id)
    }
  }
  return nextId(ids)
}

const recalculateRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

const migrateCompany = (company: CompanyWithRelations): CompanyWithRelations => {
  const actor_types: CompanyWithRelations["actor_types"] =
    company.actor_types && company.actor_types.length > 0
      ? company.actor_types
      : company.actor_type
        ? [company.actor_type]
        : DEMO_BUYER_ACTOR_IDS.includes(company.id as (typeof DEMO_BUYER_ACTOR_IDS)[number])
          ? ["buyer"]
          : ["supplier"]
  return { ...company, actor_type: company.actor_type ?? actor_types[0], actor_types }
}

const buildCompanyFromWizard = (
  input: CompanyWizardInput,
  ctx: CreateCompanyContext,
  companyId: number,
  now: string,
): CompanyWithRelations => {
  const categories = input.category_ids.map((category_id, i) => ({
    id: companyId * 100 + i + 1,
    company_id: companyId,
    category_id,
  }))

  const certificates: CompanyCertificate[] = input.certificates.map((c, i) => ({
    id: companyId * 1000 + i + 1,
    company_id: companyId,
    title: c.title,
    issuer: c.issuer,
    issue_date: c.issue_date,
    expiry_date: c.expiry_date || null,
    file_url: c.file_url,
  }))

  const companyUsers: CompanyUser[] = input.team.map((m, i) => ({
    id: companyId * 10000 + i + 1,
    company_id: companyId,
    user_id: 0,
    role: m.role,
    email: m.email,
  }))

  const hasProfile =
    input.founded_year ||
    input.employees_count ||
    input.annual_revenue_range ||
    input.languages.length > 0 ||
    input.industries.length > 0

  return {
    id: companyId,
    title: input.title.trim(),
    actor_type: input.actor_types[0] ?? ctx.actorType,
    actor_types: input.actor_types.length > 0 ? input.actor_types : [ctx.actorType],
    owner_id: ctx.userId,
    team_members: [ctx.userId],
    legal_name: input.legal_name.trim() || null,
    tax_number: input.tax_number.trim() || null,
    website: input.website.trim() || null,
    description: input.description.trim() || null,
    logo: input.logo.trim() || null,
    country: input.country.trim() || null,
    city: input.city.trim() || null,
    address: input.address.trim() || null,
    verification_status: "pending",
    rating: 0,
    created_at: now,
    updated_at: now,
    profile: hasProfile
      ? {
          company_id: companyId,
          founded_year: input.founded_year ? Number(input.founded_year) : null,
          employees_count: input.employees_count
            ? Number(input.employees_count)
            : null,
          annual_revenue_range: input.annual_revenue_range.trim() || null,
          languages: input.languages,
          industries: input.industries,
        }
      : null,
    categories,
    stats: {
      company_id: companyId,
      completed_contracts: 0,
      active_contracts: 0,
      disputes_count: 0,
      average_rating: 0,
    },
    certificates,
    reviews: [],
    company_users: companyUsers,
  }
}

const wizardToUpdatePatch = (input: CompanyWizardInput): UpdateCompanyPatch => ({
  title: input.title.trim(),
  legal_name: input.legal_name.trim() || null,
  tax_number: input.tax_number.trim() || null,
  website: input.website.trim() || null,
  description: input.description.trim() || null,
  logo: input.logo.trim() || null,
  country: input.country.trim() || null,
  city: input.city.trim() || null,
  address: input.address.trim() || null,
  category_ids: input.category_ids,
  profile: {
    company_id: 0,
    founded_year: input.founded_year ? Number(input.founded_year) : null,
    employees_count: input.employees_count ? Number(input.employees_count) : null,
    annual_revenue_range: input.annual_revenue_range.trim() || null,
    languages: input.languages,
    industries: input.industries,
  },
})

export const useCompaniesStore = create<CompaniesState>()(
  persist(
    (set, get) => ({
      companies: API_MODE ? [] : mockCompanies.map(migrateCompany),
      contractReviewIds: {},

      getCompany: (id) => get().companies.find((c) => c.id === id),

      getMyCompany: (actorId) => get().companies.find((c) => c.id === actorId),

      getCompaniesForUser: (userId) => {
        const linkedIds = useAuthStore.getState().user?.companyIds ?? []
        return get().companies.filter(
          (c) =>
            linkedIds.includes(c.id) ||
            c.owner_id === userId ||
            c.team_members.includes(userId) ||
            c.company_users.some((u) => u.user_id === userId),
        )
      },

      getOwnedCompaniesCount: (userId) =>
        get().companies.filter((c) => c.owner_id === userId).length,

      canUserCreateCompany: (userId, plan) => {
        const owned = get().getOwnedCompaniesCount(userId)
        return canCreateMoreCompanies(owned, plan)
      },

      getSupplierCompanies: () =>
        get()
          .companies.filter(isSupplierCompany)
          .sort((a, b) => b.rating - a.rating),

      getSupplierCompaniesByCategory: (categorySlug, getCategoriesForSupplier) => {
        if (!categorySlug) return get().getSupplierCompanies()
        return get()
          .getSupplierCompanies()
          .filter((company) =>
            getCategoriesForSupplier(company.id).some((c) => c.slug === categorySlug),
          )
      },

      searchSupplierCompanies: (query) => {
        const suppliers = get().getSupplierCompanies()
        if (!query.trim()) return suppliers
        return suppliers.filter((c) => matchesSupplierSearch(c, query))
      },

      createCompany: (input, ctx) => {
        const now = new Date().toISOString()
        const companyId = nextId(get().companies.map((c) => c.id))
        const company = buildCompanyFromWizard(input, ctx, companyId, now)

        set((state) => ({
          companies: [...state.companies, company],
        }))

        useAuthStore.getState().linkCompany(companyId, {
          setActive: true,
          title: company.title,
        })

        return company
      },

      updateCompany: (id, patch) => {
        const now = new Date().toISOString()
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== id) return company

            const updated = { ...company, updated_at: now }

            if (patch.title !== undefined) updated.title = patch.title
            if (patch.legal_name !== undefined) updated.legal_name = patch.legal_name
            if (patch.tax_number !== undefined) updated.tax_number = patch.tax_number
            if (patch.website !== undefined) updated.website = patch.website
            if (patch.description !== undefined) updated.description = patch.description
            if (patch.logo !== undefined) updated.logo = patch.logo
            if (patch.country !== undefined) updated.country = patch.country
            if (patch.city !== undefined) updated.city = patch.city
            if (patch.address !== undefined) updated.address = patch.address

            if (patch.profile !== undefined) {
              updated.profile = patch.profile
                ? { ...patch.profile, company_id: id }
                : null
            }

            if (patch.category_ids !== undefined) {
              updated.categories = patch.category_ids.map((category_id, i) => ({
                id: id * 100 + i + 1,
                company_id: id,
                category_id,
              }))
            }

            return updated
          }),
        }))
      },

      updateCompanyFromWizard: (id, input) => {
        const patch = wizardToUpdatePatch(input)
        get().updateCompany(id, patch)

        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== id) return company

            const certificates: CompanyCertificate[] = input.certificates.map(
              (c, i) => ({
                id: company.certificates[i]?.id ?? id * 1000 + i + 1,
                company_id: id,
                title: c.title,
                issuer: c.issuer,
                issue_date: c.issue_date,
                expiry_date: c.expiry_date || null,
                file_url: c.file_url,
              }),
            )

            const company_users: CompanyUser[] = input.team.map((m, i) => ({
              id: company.company_users[i]?.id ?? id * 10000 + i + 1,
              company_id: id,
              user_id: company.company_users[i]?.user_id ?? 0,
              role: m.role,
              email: m.email,
            }))

            return {
              ...company,
              actor_type: input.actor_types[0] ?? company.actor_type,
              actor_types: input.actor_types,
              certificates,
              company_users,
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      addCertificate: (companyId, cert) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            const certId = nextId(company.certificates.map((c) => c.id))
            return {
              ...company,
              certificates: [
                ...company.certificates,
                { ...cert, id: certId, company_id: companyId },
              ],
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      updateCertificate: (companyId, certId, patch) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            return {
              ...company,
              certificates: company.certificates.map((c) =>
                c.id === certId ? { ...c, ...patch } : c,
              ),
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      removeCertificate: (companyId, certId) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            return {
              ...company,
              certificates: company.certificates.filter((c) => c.id !== certId),
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      addTeamMember: (companyId, member) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            const memberId = nextId(company.company_users.map((u) => u.id))
            const userId = member.userId ?? 0
            const companyUser: CompanyUser = {
              id: memberId,
              company_id: companyId,
              user_id: userId,
              role: member.role,
              email: member.email,
            }
            const team_members = userId
              ? [...new Set([...company.team_members, userId])]
              : company.team_members
            return {
              ...company,
              company_users: [...company.company_users, companyUser],
              team_members,
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      removeTeamMember: (companyId, companyUserId) => {
        set((state) => ({
          companies: state.companies.map((company) => {
            if (company.id !== companyId) return company
            const removed = company.company_users.find((u) => u.id === companyUserId)
            const team_members = removed?.user_id
              ? company.team_members.filter((id) => id !== removed.user_id)
              : company.team_members
            return {
              ...company,
              company_users: company.company_users.filter(
                (u) => u.id !== companyUserId,
              ),
              team_members,
              updated_at: new Date().toISOString(),
            }
          }),
        }))
      },

      submitReview: (input) => {
        const reviewId = nextReviewId(get().companies)
        const review: Review = {
          id: reviewId,
          contract_id: input.contractId,
          reviewer_actor_id: input.reviewerActorId,
          target_actor_id: input.targetActorId,
          rating: input.rating,
          comment: input.comment,
          created_at: new Date().toISOString(),
        }

        set((state) => ({
          contractReviewIds: {
            ...state.contractReviewIds,
            [input.contractId]: reviewId,
          },
          companies: state.companies.map((company) => {
            if (company.id !== input.targetActorId) return company
            const reviews = [...company.reviews, review]
            return {
              ...company,
              reviews,
              rating: recalculateRating(reviews),
            }
          }),
        }))

        return review
      },

      getReviewsGivenByBuyer: (buyerId) => {
        const reviews: Review[] = []
        for (const company of get().companies) {
          for (const review of company.reviews) {
            if (review.reviewer_actor_id === buyerId) {
              reviews.push(review)
            }
          }
        }
        return reviews.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      },

      hasReviewForContract: (buyerId, contractId) => {
        const { contractReviewIds } = get()
        if (contractReviewIds[contractId]) return true
        for (const company of get().companies) {
          if (
            company.reviews.some(
              (r) =>
                r.contract_id === contractId &&
                r.reviewer_actor_id === buyerId,
            )
          ) {
            return true
          }
        }
        return false
      },
    }),
    {
      name: "bm-companies",
      merge: (persisted, current) => {
        if (API_MODE) return current
        const merged = { ...current, ...(persisted as Partial<CompaniesState>) }
        if (merged.companies) {
          merged.companies = merged.companies.map(migrateCompany)
        }
        return merged
      },
    },
  ),
)
