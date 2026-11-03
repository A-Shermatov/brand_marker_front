"use client"

import Link from "next/link"
import { ArrowRightIcon as ArrowRight, TrayIcon as Inbox, PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useItemsStore } from "@/lib/store/items-store"
import { useFinanceStore } from "@/lib/store/finance-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { useSupplierContractsQuery } from "@/hooks/api/use-contracts-query"
import {
  useSupplierRfqBoardQuery,
  useSupplierProposalsQuery,
} from "@/hooks/api/use-supplier-rfqs-query"
import {
  useSupplierBalanceQuery,
  useSupplierPaymentHistoryQuery,
} from "@/hooks/api/use-supplier-payments-query"
import { useSupplierFinanceDestinationsQuery } from "@/hooks/api/use-supplier-finance-query"
import { useSupplierCatalogQuery } from "@/hooks/api/use-supplier-catalog-query"
import { useSupplierCompaniesQuery } from "@/hooks/api/use-supplier-companies-query"
import { useSupplierSubscriptionQuery } from "@/hooks/api/use-supplier-subscription-query"
import { formatCount, formatIsoDateTime, formatPrice } from "@/lib/format"
import {
  getNewRfqsWithoutProposal,
  getSupplierUnreadMessageCount,
} from "@/lib/supplier-dashboard"
import { dealNeedsAction, getDealPhase, isDealOpen } from "@/lib/process/deal-stages"
import { buildSupplierTodo } from "@/lib/process/todo"
import { planName } from "@/lib/subscription"
import { reputationTierLabel } from "@/lib/trust-levels"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"
import { Button } from "@/components/ui/button"
import { PageFrame } from "@/components/layout"
import { CompanyName, PlanMark, TrustMark } from "@/components/bm"
import { ActivateRoleBanner } from "@/components/company/activate-role-banner"
import { ActiveContractsPanel } from "@/components/supplier/dashboard/active-contracts-panel"
import { DashboardPanel } from "@/components/cabinet/dashboard/dashboard-panel"
import { MoneyPanel } from "@/components/cabinet/dashboard/money-panel"
import {
  OpsList,
  type OpsItem,
} from "@/components/cabinet/dashboard/ops-list"
import { TodoList, ProfileChecklist, type ChecklistItem } from "@/components/process"
import { firstName, greet } from "@/lib/greet"
import type { ContractWithRelations } from "@/types"
import type { SubscriptionPlan } from "@/lib/store/subscription-store"
import { useMemo } from "react"

const OPS_STATUS_LABELS: Record<string, string> = {
  refunded: "возвращено покупателю",
  cancelled: "отменено",
  canceled: "отменено",
  disputed: "в споре",
  pending: "ожидает оплаты",
  awaiting_payment: "ожидает оплаты",
}

/** Net amount the supplier still expects from a deal (unreleased milestones minus commission). */
const getExpectedPayout = (contract: ContractWithRelations): number => {
  const milestones = contract.payment_plan?.milestones ?? []
  if (milestones.length === 0) return contract.agreed_amount
  return milestones
    .filter((m) => m.status !== "released")
    .reduce((sum, m) => sum + m.amount - (m.commission_amount ?? 0), 0)
}

export default function SupplierDashboard() {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const userId = user?.userId ?? 0
  const useApi = isApiEnabled()

  const getContractsByTab = useContractsStore((s) => s.getContractsByTab)
  const getUnreadMessageCount = useContractsStore((s) => s.getUnreadMessageCount)
  const getNewRfqsForSupplier = useRfqsStore((s) => s.getNewRfqsForSupplier)
  const hasProposal = useProposalsStore((s) => s.hasProposal)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const getMyCompany = useCompaniesStore((s) => s.getMyCompany)
  const getItemsBySupplier = useItemsStore((s) => s.getItemsBySupplier)
  const getDestinations = useFinanceStore((s) => s.getDestinations)
  const getBalanceSummary = useFinanceStore((s) => s.getBalanceSummary)

  const apiEnabled = hydrated && useApi
  const marks = useSupplierMarks()
  const { data: apiContracts, isLoading: contractsLoading } =
    useSupplierContractsQuery(apiEnabled)
  const { data: apiRfqs, isLoading: rfqsLoading } =
    useSupplierRfqBoardQuery(apiEnabled)
  const { data: apiProposals } = useSupplierProposalsQuery(apiEnabled)
  const { data: apiBalance } = useSupplierBalanceQuery(apiEnabled)
  const { data: apiDestinations } = useSupplierFinanceDestinationsQuery(apiEnabled)
  const { data: apiItems } = useSupplierCatalogQuery(undefined, apiEnabled)
  const { data: apiCompanies } = useSupplierCompaniesQuery(apiEnabled)
  const { data: apiSub } = useSupplierSubscriptionQuery(apiEnabled)
  const { data: paymentHistoryPage } = useSupplierPaymentHistoryQuery(
    apiEnabled,
    { page: 1, pageSize: 8 },
  )

  const getBuyerName = (buyerId: number) =>
    getCompany(buyerId)?.title ?? `Заказчик #${buyerId}`

  const contracts: ContractWithRelations[] = useApi
    ? ((apiContracts?.items ?? []) as ContractWithRelations[])
    : hydrated
      ? getContractsByTab(actorId, "all")
      : []

  const proposalItems = apiProposals?.items ?? []
  const companyItems = apiCompanies?.items ?? []
  const catalogItems = apiItems?.items ?? []
  const destinationItems = apiDestinations?.items ?? []

  const newRfqs = useApi
    ? getNewRfqsWithoutProposal(apiRfqs?.items ?? [], proposalItems)
    : hydrated
      ? getNewRfqsForSupplier(actorId, (rfqId) => hasProposal(rfqId, actorId))
      : []

  const unreadCount = useApi
    ? getSupplierUnreadMessageCount(contracts, userId)
    : hydrated
      ? getUnreadMessageCount(actorId, actorId)
      : 0

  const myCompany = useApi
    ? companyItems.find((c) => c.id === user?.activeCompanyId) ?? companyItems[0]
    : hydrated
      ? getMyCompany(actorId)
      : undefined

  const items = useApi ? catalogItems : hydrated ? getItemsBySupplier(actorId) : undefined
  const destinations = useApi
    ? destinationItems
    : hydrated
      ? getDestinations(actorId)
      : undefined
  const balance = useApi
    ? apiBalance
      ? {
          available: apiBalance.available,
          pending: apiBalance.pending,
          currency: apiBalance.currency,
        }
      : undefined
    : hydrated
      ? getBalanceSummary(actorId)
      : undefined

  const openDeals = contracts
    .filter(isDealOpen)
    .sort(
      (a, b) =>
        Number(dealNeedsAction("supplier", b)) -
        Number(dealNeedsAction("supplier", a)),
    )
  const expectedDeals = openDeals.filter((c) => getDealPhase(c) !== "disputed")
  const expectedAmount = expectedDeals.reduce(
    (sum, c) => sum + getExpectedPayout(c),
    0,
  )

  const todo = buildSupplierTodo({
    contracts,
    newRfqs: newRfqs.map((r) => ({ id: r.id, title: r.title })),
    unreadMessages: unreadCount,
  })

  const checklist: ChecklistItem[] = []
  if (hydrated && (!useApi || apiCompanies)) {
    checklist.push({
      id: "company",
      label: "Расскажите о компании: описание и город",
      done: Boolean(myCompany?.description && myCompany?.city),
      href: "/supplier/company",
      cta: "Заполнить",
    })
    if (myCompany) {
      const verified = myCompany.verification_status === "verified"
      const rejected = myCompany.verification_status === "rejected"
      checklist.push({
        id: "verification",
        label: verified
          ? "Компания проверена"
          : rejected
            ? "Проверка не пройдена — исправьте данные компании"
            : "Компания на проверке у администратора",
        done: verified,
        href: rejected ? "/supplier/company" : undefined,
        cta: rejected ? "Исправить" : undefined,
      })
    }
  }
  if (items) {
    checklist.push({
      id: "catalog",
      label: "Опубликуйте товар или услугу в каталоге",
      done: items.some((item) => item.status === "active"),
      href: "/supplier/catalog/new",
      cta: "Добавить",
    })
  }
  if (destinations) {
    checklist.push({
      id: "payout",
      label: "Добавьте счёт для выплат",
      done: destinations.length > 0,
      href: "/supplier/finance#payout",
      cta: "Добавить",
    })
  }

  const loading = !hydrated || (useApi && (contractsLoading || rfqsLoading))
  const payoutAccount = destinations?.[0]
  const payoutLabel = payoutAccount
    ? [payoutAccount.label, payoutAccount.details].filter(Boolean).join(" · ")
    : "не указан"

  const ops: OpsItem[] = useMemo(() => {
    const history = paymentHistoryPage?.items ?? []
    return history.slice(0, 8).map((item) => {
      const isRelease = item.event === "release" || item.status === "released"
      const isFunding =
        item.event === "funding" || item.status === "funded"
      return {
        id: `${item.contract_id}-${item.milestone_id}-${item.event}-${item.created_at}`,
        title: item.title,
        meta: `БМ‑${item.contract_id} · ${formatIsoDateTime(item.created_at)}`,
        amount: `${isRelease ? "+" : isFunding ? "" : "−"}${formatPrice(item.amount)}`,
        status: isRelease
          ? "зачислено"
          : isFunding
            ? "поступит после приёмки"
            : (OPS_STATUS_LABELS[item.status] ?? item.status),
        tone: isRelease ? "in" : isFunding ? "hold" : "out",
      }
    })
  }, [paymentHistoryPage?.items])

  // Same profile as the marks next to it (the active seller, not the first company).
  const companyTitle =
    marks.title ?? myCompany?.title ?? (hydrated && user?.company ? user.company : "Поставщик")
  const name = firstName(user?.name)
  const subPlan = (apiSub?.plan ?? "none") as SubscriptionPlan
  const planActive = Boolean(apiSub?.is_active)
  const incompleteChecklist = checklist.filter((c) => !c.done)

  return (
    <PageFrame className="max-w-none space-y-5">
      <ActivateRoleBanner
        targetSide="buyer"
        redirectTo="/customer"
        label="Хотите размещать заказы? Активируйте роль заказчика на этом же аккаунте."
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-[1_1_18rem]">
          <p className="text-[14px] text-mute">
            {greet()}
            {name ? `, ${name}` : ""}
          </p>
          <CompanyName
            as="h1"
            name={companyTitle}
            verified={marks.verified}
            tier={marks.tier}
            plan={marks.plan}
            size="xl"
            className="mt-0.5"
          />
        </div>
        <Button asChild variant="outline">
          <Link href="/supplier/rfqs?response=open">
            <Inbox className="size-4" />
            Новые заявки
            {newRfqs.length > 0 ? (
              <span className="rounded-full bg-brand-600 px-1.5 text-[11.5px] font-semibold text-white tnum">
                {newRfqs.length}
              </span>
            ) : null}
          </Link>
        </Button>
      </div>

      <MoneyPanel
        label="Поступит после приёмки покупателем"
        amount={loading ? "—" : formatPrice(expectedAmount)}
        hint={
          expectedDeals.length > 0
            ? `По ${formatCount(expectedDeals.length, "сделке", "сделкам", "сделкам")} в работе. Деньги уже у банка‑партнёра.`
            : "Сделок с деньгами на гарантии пока нет"
        }
        stats={[
          {
            label: "Зачислено на счёт",
            value: loading || !balance ? "—" : formatPrice(balance.available),
          },
          {
            label: "Счёт для выплат",
            value: payoutAccount ? (
              payoutLabel
            ) : (
              <Link href="/supplier/finance#payout" className="text-brand-700 hover:underline">
                Добавить
              </Link>
            ),
          },
          {
            label: "Активных сделок",
            value: loading ? "—" : openDeals.length,
          },
        ]}
        actions={
          <>
            <Button asChild>
              <Link href="/supplier/contracts?tab=active">Сделки и деньги</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/supplier/finance">
                История выплат
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      {incompleteChecklist.length > 0 ? (
        <ProfileChecklist items={checklist} />
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
        <DashboardPanel
          title="Нужно сделать"
          badge={
            todo.length > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-100 px-1.5 text-[12px] font-semibold text-amber-900 tnum">
                {todo.length}
              </span>
            ) : null
          }
        >
          <TodoList
            items={todo}
            loading={loading}
            emptyText="Новых дел нет. Загляните в заявки — там могут быть новые заказы."
            title=""
          />
        </DashboardPanel>
        <DashboardPanel title="Операции" href="/supplier/finance">
          <OpsList items={ops} />
        </DashboardPanel>
      </div>

      <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 md:grid-cols-[1fr_1fr_auto] md:items-center">
        <div className="flex items-center gap-3.5">
          <TrustMark tier={marks.tier} size={44} />
          <div className="min-w-0">
            <p className="text-[13px] text-mute">Знак надёжности</p>
            <p className="text-[15.5px] font-semibold text-ink">
              {marks.tier !== "none" ? reputationTierLabel(marks.tier) : "Пока без знака"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 border-line md:border-l md:pl-5">
          {planActive ? (
            <PlanMark plan={subPlan} size={36} />
          ) : (
            <span className="grid size-9 place-items-center rounded-lg border border-dashed border-line-strong text-faint">
              <Plus className="size-4" aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[13px] text-mute">Тариф подписки</p>
            <p className="text-[15.5px] font-semibold text-ink">
              {planActive && apiSub?.active_until
                ? `${planName(subPlan)} · до ${new Date(apiSub.active_until).toLocaleDateString("ru-RU")}`
                : "Не подключён"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <Link href="/supplier/trust">Условия и тарифы</Link>
        </Button>
      </section>

      <ActiveContractsPanel
        contracts={openDeals}
        hydrated={!loading}
        getBuyerName={getBuyerName}
      />
    </PageFrame>
  )
}
