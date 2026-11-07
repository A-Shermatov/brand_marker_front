"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { InfoIcon as Info, PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/auth-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { getApiErrorMessage } from "@/lib/api/client"
import {
  useAddBuyerTeamMemberMutation,
  useBuyerCompaniesQuery,
  useRemoveBuyerTeamMemberMutation,
  useUpdateBuyerTeamMemberMutation,
} from "@/hooks/api/use-buyer-companies-query"
import { buyerCompaniesApi } from "@/lib/api/companies"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { PageFrame, PageHeader } from "@/components/layout"
import { EmployeeList } from "@/components/cabinet/company/employee-list"
import { PurchaseRulesCard } from "@/components/cabinet/company/purchase-rules-card"
import {
  CompanyRequisitesCard,
  type CompanyRequisites,
} from "@/components/cabinet/company/company-requisites-card"
import { InviteEmployeeDialog } from "@/components/cabinet/company/invite-employee-dialog"
import {
  canManageTeam,
  COMPANY_ROLE_LABELS,
  COMPANY_ROLE_RIGHTS,
  mapCompanyUsersToEmployees,
  myCompanyRole,
  nameFromEmail,
  type CompanyTeamEmployee,
  type TeamSideKey,
} from "@/lib/company-team"
import {
  MOCK_BUYER_COMPANY_LOG,
  MOCK_BUYER_EMPLOYEES,
  readPurchaseRules,
  writePurchaseRules,
  type BuyerCompanyLogEntry,
  type PurchaseRuleId,
  type PurchaseRules,
} from "@/lib/mock/buyer-employees"
import type { CompanyRole, CompanyWithRelations } from "@/types"
import { SideReputationList } from "@/components/company/side-reputation"

const nowLogStamp = () => {
  const d = new Date()
  const months = [
    "янв",
    "фев",
    "мар",
    "апр",
    "май",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ]
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${d.getDate()} ${months[d.getMonth()]}, ${hh}:${mm}`
}

const mockEmployeesToTeam = (): CompanyTeamEmployee[] =>
  MOCK_BUYER_EMPLOYEES.map((e, index) => ({
    userId: index + 1,
    membershipId: index + 1,
    name: e.name,
    email: `${e.name.toLowerCase().replace(/\s+/g, ".")}@demo.tj`,
    role: (
      {
        Руководитель: "director",
        Закупщик: "moderator",
        Бухгалтер: "accountant",
        Наблюдатель: "accountant",
      } as const
    )[e.role],
    rights: COMPANY_ROLE_RIGHTS[
      (
        {
          Руководитель: "director",
          Закупщик: "moderator",
          Бухгалтер: "accountant",
          Наблюдатель: "accountant",
        } as const
      )[e.role]
    ],
    me: e.me,
  }))

export default function CustomerCompanyPage() {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const getMyCompany = useCompaniesStore((s) => s.getMyCompany)

  const {
    data: apiCompanies,
    isLoading,
    isError,
  } = useBuyerCompaniesQuery(hydrated && useApi)
  const addMember = useAddBuyerTeamMemberMutation()
  const updateMember = useUpdateBuyerTeamMemberMutation()
  const removeMember = useRemoveBuyerTeamMemberMutation()

  const [localEmployees, setLocalEmployees] = useState<CompanyTeamEmployee[]>(
    () => mockEmployeesToTeam(),
  )
  const [log, setLog] = useState<BuyerCompanyLogEntry[]>(MOCK_BUYER_COMPANY_LOG)
  const [rules, setRules] = useState<PurchaseRules>(() => ({
    rule1: true,
    rule2: true,
    rule3: false,
  }))
  const [inviteOpen, setInviteOpen] = useState(false)

  useEffect(() => {
    if (hydrated) setRules(readPurchaseRules())
  }, [hydrated])

  const company = useMemo((): CompanyWithRelations | null => {
    if (useApi) {
      const items = apiCompanies?.items ?? []
      const activeId = user?.activeCompanyId ?? user?.companyId
      return (
        items.find((c) => c.id === activeId) ??
        items[0] ??
        null
      )
    }
    if (!hydrated || !actorId) return null
    return getMyCompany(actorId) ?? null
  }, [useApi, apiCompanies, user?.activeCompanyId, user?.companyId, hydrated, actorId, getMyCompany])

  const employees = useMemo(() => {
    if (useApi && company) {
      return mapCompanyUsersToEmployees(company.company_users ?? [], user?.userId)
    }
    return localEmployees
  }, [useApi, company, user?.userId, localEmployees])

  // Purchases and sales are set apart only when the company does both.
  const companySides = (["buyer", "supplier"] as const).filter((side) =>
    (company?.actor_types ?? []).includes(side),
  ) as TeamSideKey[]

  const myRole = useApi
    ? myCompanyRole(company?.company_users ?? [], user?.userId)
    : employees.find((e) => e.me)?.role ?? null
  const canManage = canManageTeam(myRole)
  const bossName =
    employees.find((e) => e.me)?.name ?? user?.name ?? "Руководитель"
  const teamBusy =
    addMember.isPending || updateMember.isPending || removeMember.isPending

  const pushLog = (text: string) => {
    setLog((prev) => [
      { at: nowLogStamp(), who: bossName, text },
      ...prev,
    ])
  }

  const queryClient = useQueryClient()
  const pendingChangeQuery = useQuery({
    queryKey: ["buyer-company-change-pending", company?.id],
    queryFn: () => buyerCompaniesApi.pendingChangeRequest(company!.id),
    enabled: useApi && hydrated && Boolean(company?.id),
  })
  const submitChangeMutation = useMutation({
    mutationFn: (payload: Parameters<typeof buyerCompaniesApi.submitChangeRequest>[1]) =>
      buyerCompaniesApi.submitChangeRequest(company!.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["buyer-company-change-pending", company?.id],
      })
    },
  })

  const requisites: CompanyRequisites = useMemo(() => {
    if (useApi) {
      return {
        name: company?.title ?? user?.company?.trim() ?? "Компания",
        verified: company?.verification_status === "verified",
        inn: company?.tax_number?.trim() || "—",
        form: company?.legal_name?.trim() || "—",
        city: company?.city?.trim() || "—",
        bank: "—",
        account: "—",
        legalName: company?.legal_name?.trim() || "",
        address: company?.address?.trim() || "",
        country: company?.country?.trim() || "",
      }
    }
    const fromStore = company
    return {
      name: fromStore?.title ?? user?.company?.trim() ?? "ООО «Сомон Трейд»",
      verified: fromStore?.verification_status === "verified",
      inn: fromStore?.tax_number?.trim() || "020033881",
      form: "ООО",
      city: fromStore?.city?.trim() || "Душанбе",
      bank: "Амонатбонк",
      account: "20202 972 0 0000 012345",
      legalName: fromStore?.legal_name?.trim() || "",
      address: fromStore?.address?.trim() || "",
    }
  }, [useApi, company, user?.company])

  const handleRuleChange = (id: PurchaseRuleId, checked: boolean) => {
    setRules((prev) => {
      const next = { ...prev, [id]: checked }
      writePurchaseRules(next)
      return next
    })
  }

  const handleRoleChange = async (userId: number, role: CompanyRole) => {
    const target = employees.find((e) => e.userId === userId)
    if (!target || target.role === role) return

    if (useApi && company) {
      try {
        await updateMember.mutateAsync({
          companyId: company.id,
          targetUserId: userId,
          data: { role },
        })
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Не удалось изменить роль"))
      }
      return
    }

    const old = COMPANY_ROLE_LABELS[target.role]
    setLocalEmployees((prev) =>
      prev.map((e) =>
        e.userId !== userId
          ? e
          : { ...e, role, rights: COMPANY_ROLE_RIGHTS[role] },
      ),
    )
    pushLog(
      `Изменил роль ${target.name}: ${old} → ${COMPANY_ROLE_LABELS[role]}`,
    )
    toast.success(`${target.name}: теперь ${COMPANY_ROLE_LABELS[role]}`)
  }

  const handleRemove = async (userId: number) => {
    const target = employees.find((e) => e.userId === userId)
    if (!target) return

    if (useApi && company) {
      try {
        await removeMember.mutateAsync({
          companyId: company.id,
          targetUserId: userId,
        })
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Не удалось удалить сотрудника"))
      }
      return
    }

    setLocalEmployees((prev) => prev.filter((e) => e.userId !== userId))
    pushLog(
      `Удалил сотрудника ${target.name} (${COMPANY_ROLE_LABELS[target.role]})`,
    )
    toast.success(`${target.name} удалён(а), доступ закрыт`)
  }

  const handleInvite = async (data: { email: string; role: CompanyRole }) => {
    if (useApi && company) {
      try {
        await addMember.mutateAsync({
          companyId: company.id,
          data: { email: data.email, role: data.role },
        })
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Не удалось добавить сотрудника"))
        throw err
      }
      return
    }

    const employee: CompanyTeamEmployee = {
      userId: Date.now(),
      membershipId: Date.now(),
      name: nameFromEmail(data.email),
      email: data.email,
      role: data.role,
      rights: COMPANY_ROLE_RIGHTS[data.role],
    }
    setLocalEmployees((prev) => [...prev, employee])
    pushLog(
      `Добавил ${employee.name} (${COMPANY_ROLE_LABELS[data.role]})`,
    )
    toast.success("Сотрудник добавлен")
  }

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame>
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-canvas" />
        <div className="mt-6 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-80 animate-pulse rounded-2xl bg-canvas" />
          <div className="h-64 animate-pulse rounded-2xl bg-canvas" />
        </div>
      </PageFrame>
    )
  }

  if (useApi && isError) {
    return (
      <PageFrame>
        <PageHeader
          title="Компания и сотрудники"
          description="Не удалось загрузить данные компании"
        />
        <p className="text-[15px] text-mute">
          Обновите страницу или попробуйте позже.
        </p>
      </PageFrame>
    )
  }

  if (useApi && !company) {
    return (
      <PageFrame>
        <PageHeader
          title="Компания и сотрудники"
          description="Реквизиты, роли и команда"
        />
        <div className="rounded-2xl border border-dashed border-line-strong bg-card px-6 py-14 text-center">
          <b className="text-[17px]">Компания ещё не создана</b>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-mute">
            Создайте компанию, чтобы управлять сотрудниками и реквизитами.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/customer/company/new">
              <Plus size={16} />
              Создать компанию
            </Link>
          </Button>
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Компания и сотрудники"
        description="Реквизиты и команда. Руководителя компании изменить нельзя."
        actions={
          canManage ? (
            <Button
              type="button"
              size="lg"
              disabled={teamBusy}
              onClick={() => setInviteOpen(true)}
            >
              <Plus size={16} />
              Добавить сотрудника
            </Button>
          ) : null
        }
      />

      <SideReputationList reputation={company?.reputation} className="mb-5" />

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-5">
          <EmployeeList
            employees={employees}
            canManage={canManage}
            busy={teamBusy}
            onInviteClick={() => setInviteOpen(true)}
            onChangeRole={(userId, role) => void handleRoleChange(userId, role)}
            onRemove={(userId) => void handleRemove(userId)}
            sides={companySides}
            onChangeSideRole={(userId, side, role) => {
              if (!useApi || !company) return
              void updateMember
                .mutateAsync({
                  companyId: company.id,
                  targetUserId: userId,
                  data: side === "buyer" ? { buyer_role: role } : { supplier_role: role },
                })
                .catch(() => {})
            }}
          />

          {!useApi ? (
            <section className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
              <span className="text-[13px] font-semibold text-mute">
                История изменений
              </span>
              <ul className="mt-3 grid gap-2.5 text-[14px]">
                {log.slice(0, 6).map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className="grid grid-cols-[110px_1fr] gap-3"
                  >
                    <span className="tnum text-[12.5px] text-mute">
                      {entry.at}
                    </span>
                    <span>
                      <b className="font-semibold">{entry.who}:</b> {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Purchase rules are not enforced by the server yet: demo mode only. */}
          {!useApi ? (
            <PurchaseRulesCard rules={rules} onChange={handleRuleChange} />
          ) : null}
        </div>

        <CompanyRequisitesCard
          company={requisites}
          companyId={company?.id}
          pendingRequest={Boolean(pendingChangeQuery.data)}
          onSubmitChangeRequest={
            useApi && company
              ? async (payload) => {
                  await submitChangeMutation.mutateAsync(payload)
                }
              : undefined
          }
        />
      </div>

      {!canManage ? (
        <p className="mt-4 flex items-start gap-2 text-[13.5px] text-mute">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Изменять роли может только руководитель или администратор компании.
        </p>
      ) : null}

      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        busy={teamBusy}
        onInvite={handleInvite}
      />
    </PageFrame>
  )
}
