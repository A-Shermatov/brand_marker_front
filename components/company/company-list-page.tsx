"use client"

import Link from "next/link"
import { BuildingsIcon as Building2, PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useSubscriptionStore } from "@/lib/store/subscription-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { isApiEnabled } from "@/lib/api/config"
import { useBuyerCompaniesQuery } from "@/hooks/api/use-buyer-companies-query"
import { useSupplierCompaniesQuery } from "@/hooks/api/use-supplier-companies-query"
import { useSupplierSubscriptionQuery } from "@/hooks/api/use-supplier-subscription-query"
import { CompanyCard } from "@/components/company/company-card"
import { Button } from "@/components/ui/button"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { filterCompaniesByActorType } from "@/lib/company-wizard-utils"
import { getCompanyLimit } from "@/lib/subscription"
import type { ActorType, CompanyWithRelations } from "@/types"

type CompanyListPageProps = {
  actorType: ActorType
  basePath: string
  roleLabel: string
}

export const CompanyListPage = ({
  actorType,
  basePath,
  roleLabel,
}: CompanyListPageProps) => {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const switchActor = useAuthStore((s) => s.switchActor)
  const getCompaniesForUser = useCompaniesStore((s) => s.getCompaniesForUser)
  const canUserCreateCompany = useCompaniesStore((s) => s.canUserCreateCompany)
  const getOwnedCompaniesCount = useCompaniesStore((s) => s.getOwnedCompaniesCount)
  const localPlan = useSubscriptionStore((s) => s.plan)

  const useApi = isApiEnabled()
  const { data: apiSupplierCompanies, isLoading: supplierLoading } =
    useSupplierCompaniesQuery(hydrated && useApi && actorType === "supplier")
  const { data: apiBuyerCompanies, isLoading: buyerLoading } =
    useBuyerCompaniesQuery(hydrated && useApi && actorType === "buyer")
  const { data: apiSub } = useSupplierSubscriptionQuery(
    hydrated && useApi && actorType === "supplier",
  )

  const apiCompanies =
    actorType === "supplier" ? apiSupplierCompanies : apiBuyerCompanies
  const isLoading = actorType === "supplier" ? supplierLoading : buyerLoading

  const plan = useApi && actorType === "supplier"
    ? ((apiSub?.is_active ? apiSub.plan : "none") as typeof localPlan)
    : localPlan

  if (!hydrated || !user) return null

  const localCompanies = filterCompaniesByActorType(
    getCompaniesForUser(user.userId),
    actorType,
  )
  const companies: CompanyWithRelations[] = useApi
    ? filterCompaniesByActorType(apiCompanies?.items ?? [], actorType)
    : localCompanies

  const ownedCount = useApi
    ? companies.filter((c) => c.owner_id === user.userId).length
    : getOwnedCompaniesCount(user.userId)
  const canCreate = useApi
    ? (() => {
        const limit = getCompanyLimit(plan)
        if (limit === null) return true
        return ownedCount < limit
      })()
    : canUserCreateCompany(user.userId, plan)
  const limit = getCompanyLimit(plan)

  if (useApi && isLoading) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-10 w-1/3 rounded-xl bg-secondary" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-40 rounded-xl bg-secondary" />
          <div className="h-40 rounded-xl bg-secondary" />
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Мои компании"
        description={`${roleLabel} · ${companies.length} компаний${limit !== null ? ` · лимит ${ownedCount}/${limit}` : ""}`}
        actions={
          canCreate ? (
            <Button asChild size="lg">
              <Link href={`${basePath}/new`}>
                <Plus size={16} />
                Создать компанию
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <Link href={actorType === "supplier" ? "/supplier/subscription" : `${basePath}/new`}>
                Лимит исчерпан
              </Link>
            </Button>
          )
        }
      />

      {companies.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<Building2 size={40} />}
            title="Нет компаний"
            description="Создайте профиль компании, чтобы участвовать в сделках на платформе"
          />
          {canCreate ? (
            <div className="flex justify-center pb-10">
              <Button asChild size="lg">
                <Link href={`${basePath}/new`}>
                  <Plus size={16} />
                  Создать первую компанию
                </Link>
              </Button>
            </div>
          ) : null}
        </PageSurface>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              isActive={company.id === user.activeCompanyId}
              editHref={`${basePath}/${company.id}`}
              onSwitch={() => {
                const actor = user.actors.find(
                  (a) => a.company_id === company.id && a.side === actorType,
                )
                if (actor) {
                  switchActor(actor.id)
                  return
                }
                switchActor(company.id)
              }}
            />
          ))}
        </div>
      )}
    </PageFrame>
  )
}
