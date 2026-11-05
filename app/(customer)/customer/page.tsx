"use client"

import { useMemo } from "react"
import Link from "next/link"
import { SealCheckIcon as BadgeCheck, PlusIcon as Plus, ShoppingCartIcon as ShoppingCart, WalletIcon as Wallet } from "@phosphor-icons/react/dist/ssr"
import { useQueries } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { formatCurrency, formatIsoDateTime, formatPrice } from "@/lib/format"
import { isApiEnabled } from "@/lib/api/config"
import { useRfqsQuery } from "@/hooks/api/use-rfqs-query"
import { useContractsQuery } from "@/hooks/api/use-contracts-query"
import { proposalsApi } from "@/lib/api/proposals"
import { proposalKeys } from "@/hooks/api/use-proposals-query"
import { useSupplierActorName } from "@/hooks/api/use-supplier-name"
import { getBuyerUnreadMessageCount } from "@/lib/buyer-dashboard"
import { OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import { isDealOpen } from "@/lib/process/deal-stages"
import { buildBuyerTodo, type BuyerRfqProposalsSummary } from "@/lib/process/todo"
import { MOCK_BUYER_APPROVALS } from "@/lib/mock/buyer-approvals"
import { MOCK_BUYER_SPEND } from "@/lib/mock/buyer-spend"
import { buildSpendSeriesFromHistory } from "@/lib/buyer-spend"
import { mapApiPaymentHistoryEvent } from "@/lib/buyer-payments-display"
import { useApprovalsQuery } from "@/hooks/api/use-approvals-query"
import { usePaymentHistoryQuery } from "@/hooks/api/use-payments-query"
import { Button } from "@/components/ui/button"
import { PageFrame } from "@/components/layout"
import { CompanyName } from "@/components/bm"
import { SpendChart } from "@/components/cabinet/dashboard/spend-chart"
import { HomeDealsPanel } from "@/components/cabinet/dashboard/home-deals-panel"
import { DashboardPanel } from "@/components/cabinet/dashboard/dashboard-panel"
import { MoneyPanel } from "@/components/cabinet/dashboard/money-panel"
import {
  OpsList,
  type OpsItem,
} from "@/components/cabinet/dashboard/ops-list"
import { ActivateRoleBanner } from "@/components/company/activate-role-banner"
import { TodoList } from "@/components/process"
import { firstName, greet } from "@/lib/greet"
import {
  sumAwaitingPayment,
  sumEscrowHeld,
} from "@/lib/dashboard-money"
import type { ContractWithRelations, Proposal, RfqWithRelations } from "@/types"
import { TeamAccessCard } from "@/components/cabinet/company/team-access-card"

export default function CustomerDashboard() {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const userId = user?.userId ?? 0
  const useApi = isApiEnabled()

  const getRfqsByBuyer = useRfqsStore((s) => s.getRfqsByBuyer)
  const getProposalsForRfq = useProposalsStore((s) => s.getProposalsForRfq)
  const getContractsForBuyer = useContractsStore((s) => s.getContractsForBuyer)
  const getUnreadMessageCountForBuyer = useContractsStore(
    (s) => s.getUnreadMessageCountForBuyer,
  )
  const getCompany = useCompaniesStore((s) => s.getCompany)

  const { data: apiRfqsPage, isLoading: rfqsLoading } = useRfqsQuery(
    "all",
    hydrated && useApi,
  )
  const apiRfqs = apiRfqsPage?.items ?? []
  const { data: apiContractsPage, isLoading: contractsLoading } =
    useContractsQuery(hydrated && useApi)
  const apiContracts = apiContractsPage?.items ?? []

  const rfqs: RfqWithRelations[] = useApi
    ? apiRfqs
    : hydrated
      ? getRfqsByBuyer(actorId)
      : []
  const contracts: ContractWithRelations[] = useApi
    ? (apiContracts as ContractWithRelations[])
    : hydrated
      ? getContractsForBuyer(actorId)
      : []

  const openRfqs = rfqs.filter((r) => OPEN_RFQ_STATUSES.includes(r.status))

  const proposalQueries = useQueries({
    queries: (useApi ? openRfqs : []).map((rfq) => ({
      queryKey: proposalKeys.forRfq(rfq.id),
      queryFn: () => proposalsApi.listForRfq(rfq.id),
      enabled: hydrated && useApi,
    })),
  })

  const proposalsByRfq = useMemo(() => {
    const map = new Map<string, Proposal[]>()
    openRfqs.forEach((rfq, index) => {
      const list = useApi
        ? (proposalQueries[index]?.data?.items ?? [])
        : getProposalsForRfq(rfq.id)
      if (list) map.set(rfq.id, list)
    })
    return map
  }, [useApi, openRfqs, proposalQueries, getProposalsForRfq])

  const supplierIds = useApi ? contracts.map((c) => c.supplier_actor_id) : []
  const resolveSupplierName = useSupplierActorName(supplierIds)
  const getSupplierName = (supplierId: number) =>
    useApi
      ? resolveSupplierName(supplierId)
      : (getCompany(supplierId)?.title ?? "Исполнитель")

  const unreadMessages = hydrated
    ? useApi
      ? getBuyerUnreadMessageCount(contracts, userId)
      : getUnreadMessageCountForBuyer(actorId)
    : 0

  const rfqsWithNewProposals: BuyerRfqProposalsSummary[] = openRfqs.map(
    (rfq) => ({
      rfqId: rfq.id,
      rfqTitle: rfq.title,
      count: (proposalsByRfq.get(rfq.id) ?? []).filter(
        (p) => p.status === "submitted",
      ).length,
    }),
  )

  const { data: approvalsPage } = useApprovalsQuery(
    "wait",
    hydrated && useApi,
  )
  const { data: paymentHistoryPage } = usePaymentHistoryQuery(
    hydrated && useApi,
    { page: 1, pageSize: 8 },
  )

  const pendingApprovals = (
    useApi
      ? (approvalsPage?.items ?? []).map((a) => ({
          id: String(a.id),
          what: a.title,
          whoName: a.who_name,
          amountLabel: formatCurrency(a.amount, a.currency),
          reason: a.reason,
        }))
      : MOCK_BUYER_APPROVALS.filter((a) => a.status === "wait").map((a) => ({
          id: a.id,
          what: a.what,
          whoName: a.whoName,
          amountLabel: formatCurrency(a.amount, a.currency),
          reason: a.reason,
        }))
  )

  const todo = buildBuyerTodo({
    contracts,
    getSupplierName,
    rfqsWithNewProposals,
    drafts: rfqs
      .filter((r) => r.status === "draft")
      .map((r) => ({ id: r.id, title: r.title })),
    unreadMessages,
    pendingApprovals,
  })

  const openDeals = contracts.filter(isDealOpen)
  const heldAmount = sumEscrowHeld(contracts)
  const toPayAmount = sumAwaitingPayment(contracts)
  const loading = !hydrated || (useApi && (rfqsLoading || contractsLoading))

  const spendSeries = useMemo(() => {
    if (!useApi) return MOCK_BUYER_SPEND
    return buildSpendSeriesFromHistory(paymentHistoryPage?.items ?? [])
  }, [useApi, paymentHistoryPage?.items])
  const lastSpend = spendSeries[spendSeries.length - 1]?.[1] ?? 0

  const ops: OpsItem[] = useMemo(() => {
    const events = useApi
      ? (paymentHistoryPage?.items ?? []).map(mapApiPaymentHistoryEvent)
      : []
    return events.slice(0, 8).map((e) => {
      const tone =
        e.type === "funding" ? "hold" : e.type === "release" ? "out" : "in"
      return {
        id: e.id,
        title: e.title,
        meta: `БМ‑${e.contractId} · ${formatIsoDateTime(e.at)}`,
        amount:
          e.type === "release"
            ? formatPrice(e.amount)
            : `−${formatPrice(e.amount)}`,
        status:
          e.type === "funding"
            ? "на гарантии"
            : e.type === "release"
              ? "переведено поставщику"
              : "возврат",
        tone,
      }
    })
  }, [useApi, paymentHistoryPage?.items])

  const companyTitle = hydrated && user?.company ? user.company : "Покупатель"
  const name = firstName(user?.name)

  return (
    <PageFrame className="max-w-none space-y-5">
      <ActivateRoleBanner
        targetSide="supplier"
        redirectTo="/supplier"
        label="Хотите продавать на платформе? Активируйте роль исполнителя на этом же аккаунте."
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-[1_1_18rem]">
          <p className="text-[14px] text-mute">
            {greet()}
            {name ? `, ${name}` : ""}
          </p>
          <CompanyName as="h1" name={companyTitle} size="xl" className="mt-0.5" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/services">
              <ShoppingCart className="size-4" />
              Каталог
            </Link>
          </Button>
          <Button asChild>
            <Link href="/customer/rfqs/new">
              <Plus weight="bold" className="size-4" />
              Новая заявка
            </Link>
          </Button>
        </div>
      </div>

      <MoneyPanel
        label="На гарантии в банке‑партнёре"
        amount={loading ? "—" : formatPrice(heldAmount)}
        hint="Поставщики получат деньги только после вашей приёмки"
        stats={[
          {
            label: "Ждёт оплаты",
            value: loading ? "—" : formatPrice(toPayAmount),
          },
          {
            label: "Расходы за месяц",
            value: loading ? "—" : formatPrice(lastSpend),
          },
          {
            label: "Активных сделок",
            value: loading ? "—" : openDeals.length,
          },
        ]}
        actions={
          <>
            <Button asChild>
              <Link href="/customer/payments">
                <Wallet className="size-4" />
                Оплатить
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/customer/approvals">
                <BadgeCheck className="size-4" />
                Согласования
              </Link>
            </Button>
          </>
        }
      />

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
            emptyText="Всё сделано."
            title=""
          />
        </DashboardPanel>
        <DashboardPanel title="Операции" href="/customer/payments">
          <OpsList items={ops} />
        </DashboardPanel>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_1fr]">
        <HomeDealsPanel
          contracts={openDeals}
          getSupplierName={getSupplierName}
          loading={loading}
        />
        <SpendChart
          series={spendSeries}
          note={useApi ? "По оплаченным этапам сделок" : undefined}
        />
      </div>

      <TeamAccessCard side="buyer" teamHref="/customer/company" />
    </PageFrame>
  )
}
