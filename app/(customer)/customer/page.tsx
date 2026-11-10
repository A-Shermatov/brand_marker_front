"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  BuildingsIcon,
  HandshakeIcon,
  HeadsetIcon,
  LockKeyIcon,
  PlusIcon as Plus,
  ReceiptIcon,
  ShoppingCartIcon as ShoppingCart,
  ShieldCheckIcon,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth-store"
import { useBuyerMarks } from "@/hooks/use-buyer-marks"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { formatCount, formatCurrency, formatIsoDateTime, formatPrice } from "@/lib/format"
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
import { monthlySeries } from "@/lib/dashboard-series"
import { rfqsApi } from "@/lib/api/rfqs"
import { mapApiPaymentHistoryEvent } from "@/lib/buyer-payments-display"
import { useApprovalsQuery } from "@/hooks/api/use-approvals-query"
import { usePaymentHistoryQuery } from "@/hooks/api/use-payments-query"
import { Button } from "@/components/ui/button"
import { PageFrame } from "@/components/layout"
import { CompanyName } from "@/components/bm"
import { MonthlyChart } from "@/components/cabinet/dashboard/monthly-chart"
import { KpiTile } from "@/components/cabinet/dashboard/kpi-tile"
import { BreakdownCard } from "@/components/cabinet/dashboard/breakdown-card"
import { HomeDealsPanel } from "@/components/cabinet/dashboard/home-deals-panel"
import { DashboardPanel } from "@/components/cabinet/dashboard/dashboard-panel"
import {
  OpsList,
  type OpsItem,
} from "@/components/cabinet/dashboard/ops-list"
import { ActivateRoleBanner } from "@/components/company/activate-role-banner"
import { TodoList } from "@/components/process"
import { FirstSteps } from "@/components/process/first-steps"
import { buildBuyerFirstSteps } from "@/lib/process/first-steps"
import { ShortcutCards } from "@/components/cabinet/dashboard/shortcut-cards"
import { CountUp } from "@/components/ui/count-up"
import { useSupportChat } from "@/components/support/support-chat-context"
import { useSavedValue } from "@/hooks/use-saved-value"
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
  const marks = useBuyerMarks()
  const useApi = isApiEnabled()
  const { openSupport } = useSupportChat()

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
      : (getCompany(supplierId)?.title ?? "Поставщик")

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
    { page: 1, pageSize: 100 },
  )
  const { data: rfqCounts } = useQuery({
    queryKey: ["buyer-rfq-counts", actorId],
    queryFn: async () => {
      const tabs = ["quotes", "deal", "draft", "closed"] as const
      const pages = await Promise.all(tabs.map((tab) => rfqsApi.list(tab, { page: 1, pageSize: 1 })))
      return Object.fromEntries(tabs.map((tab, i) => [tab, pages[i]!.total])) as Record<
        (typeof tabs)[number],
        number
      >
    },
    enabled: hydrated && useApi,
  })

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

  // Money paid into deals by month: still held by the bank vs already passed on.
  const spendPoints = useMemo(
    () =>
      monthlySeries(paymentHistoryPage?.items ?? [], (item) =>
        item.status === "funded" ? "held" : item.status === "released" ? "released" : null,
      ),
    [paymentHistoryPage?.items],
  )
  const monthSpend =
    (spendPoints.at(-1)?.values.held ?? 0) + (spendPoints.at(-1)?.values.released ?? 0)

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

  const companyTitle = marks.title ?? (hydrated && user?.company ? user.company : "Покупатель")
  const name = firstName(user?.name)

  // The path to a first deal, marked from what the account already has.
  const firstStepsKey = `bm-first-steps:buyer:${actorId}`
  const firstSteps = buildBuyerFirstSteps({
    rfqs,
    offers: rfqsWithNewProposals.map((r) => ({ rfqId: r.rfqId, count: r.count })),
    contracts,
  })
  // An account with no requests and no deals has nothing to chart: it gets
  // the guide and the ways in instead of a page of zeros. While the data is
  // loading, only an account already known to have deals shows the numbers.
  const isNewcomer = !loading && rfqs.length === 0 && contracts.length === 0
  const knownVeteran = useSavedValue(firstStepsKey) === "finished"
  const showNumbers = loading ? knownVeteran : !isNewcomer

  return (
    <PageFrame className="max-w-none space-y-5">
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/customer/catalog">
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

      <FirstSteps
        storageKey={firstStepsKey}
        title="Первая сделка: четыре шага"
        description="Так проходит любая покупка на площадке. Деньги всё это время под защитой банка: поставщик получит их только после вашей приёмки."
        steps={firstSteps}
        loading={loading}
      />

      {isNewcomer ? (
        <ShortcutCards
          label="С чего ещё можно начать"
          items={[
            {
              title: "Как защищены деньги",
              text: "Банк хранит оплату до вашей приёмки",
              icon: ShieldCheckIcon,
              href: "/guarantee",
            },
            {
              title: "Поставщики",
              text: "Проверенные компании и отзывы о них",
              icon: BuildingsIcon,
              href: "/customer/suppliers",
            },
            {
              title: "Спросить поддержку",
              text: "Подскажем, как оформить первую заявку",
              icon: HeadsetIcon,
              onClick: openSupport,
            },
          ]}
        />
      ) : null}

      {showNumbers ? (
      <div className="space-y-5 bm-rise">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="На гарантии в банке"
          loading={loading}
          value={<CountUp value={heldAmount} format={formatPrice} />}
          hint="Поставщик получит после вашей приёмки"
          icon={LockKeyIcon}
          tone="brand"
          href="/customer/payments"
        />
        <KpiTile
          label="Ждёт оплаты"
          loading={loading}
          value={<CountUp value={toPayAmount} format={formatPrice} />}
          hint={toPayAmount > 0 ? "Оплатите, чтобы поставщик начал работу" : "Неоплаченных этапов нет"}
          icon={WalletIcon}
          tone={toPayAmount > 0 ? "attention" : "default"}
          href="/customer/payments"
        />
        <KpiTile
          label="Оплачено в этом месяце"
          loading={loading}
          value={<CountUp value={monthSpend} format={formatPrice} />}
          hint="Все оплаты по сделкам"
          icon={ReceiptIcon}
          href="/customer/payments"
        />
        <KpiTile
          label="Сделки в работе"
          loading={loading}
          value={<CountUp value={openDeals.length} />}
          hint={
            unreadMessages > 0
              ? formatCount(unreadMessages, "новое сообщение", "новых сообщения", "новых сообщений")
              : "Все сделки"
          }
          icon={HandshakeIcon}
          tone={unreadMessages > 0 ? "attention" : "default"}
          href="/customer/contracts?tab=active"
        />
      </div>

      <div className="grid items-stretch gap-5 xl:grid-cols-[1.6fr_1fr]">
        <MonthlyChart
          title="Оплаты по месяцам"
          points={spendPoints}
          series={[
            { key: "released", label: "Передано поставщикам", color: "var(--brand-600)" },
            { key: "held", label: "На гарантии", color: "var(--brand-200)" },
          ]}
          emptyText="Здесь появятся ваши оплаты по сделкам. Деньги хранит банк, пока вы не примете работу."
          loading={loading}
        />
        <BreakdownCard
          title="Мои заявки"
          rows={[
            {
              label: "Приём предложений",
              value: rfqCounts?.quotes ?? 0,
              href: "/customer/rfqs?status=quotes",
              color: "var(--brand-600)",
            },
            {
              label: "Сделка заключена",
              value: rfqCounts?.deal ?? 0,
              href: "/customer/rfqs?status=deal",
              color: "var(--verify-600)",
            },
            {
              label: "Черновики",
              value: rfqCounts?.draft ?? 0,
              href: "/customer/rfqs?status=draft",
              color: "var(--faint)",
            },
            {
              label: "Архив",
              value: rfqCounts?.closed ?? 0,
              href: "/customer/rfqs?status=closed",
              color: "var(--line-strong)",
            },
          ]}
          footer={
            <Link href="/customer/rfqs/new" className="text-[13.5px] font-medium text-brand-700 hover:underline">
              Разместить новую заявку
            </Link>
          }
        />
      </div>

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
            emptyText="Всё сделано: сейчас от вас ничего не требуется."
            title=""
          />
        </DashboardPanel>
        <DashboardPanel title="Операции" href="/customer/payments">
          <OpsList items={ops} />
        </DashboardPanel>
      </div>

      <HomeDealsPanel
        contracts={openDeals}
        getSupplierName={getSupplierName}
        loading={loading}
      />
      </div>
      ) : null}

      <TeamAccessCard side="buyer" teamHref="/customer/company" />

      <ActivateRoleBanner
        targetSide="supplier"
        redirectTo="/supplier"
        label="Хотите ещё и продавать на площадке? Включите роль поставщика на этом же аккаунте."
      />
    </PageFrame>
  )
}
