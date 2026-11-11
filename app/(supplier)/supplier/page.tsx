"use client"

import Link from "next/link"
import {
  HandshakeIcon,
  HeadsetIcon,
  PackageIcon,
  PlusIcon as Plus,
  TrayIcon,
  TrayIcon as Inbox,
  WalletIcon,
} from "@phosphor-icons/react/dist/ssr"
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
import { formatCount, formatIsoDateTime, formatPrice } from "@/lib/format"
import {
  getNewRfqsWithoutProposal,
  getSupplierUnreadMessageCount,
} from "@/lib/supplier-dashboard"
import { dealNeedsAction, getDealPhase, isDealOpen } from "@/lib/process/deal-stages"
import { buildSupplierTodo } from "@/lib/process/todo"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"
import { Button } from "@/components/ui/button"
import { PageFrame } from "@/components/layout"
import { CompanyName } from "@/components/bm"
import { ActivateRoleBanner } from "@/components/company/activate-role-banner"
import { ActiveContractsPanel } from "@/components/supplier/dashboard/active-contracts-panel"
import { DashboardPanel } from "@/components/cabinet/dashboard/dashboard-panel"
import { HomeHeading, StatusCard } from "@/components/cabinet/dashboard/status-card"
import { monthlySeries } from "@/lib/dashboard-series"
import {
  OpsList,
  type OpsItem,
} from "@/components/cabinet/dashboard/ops-list"
import { TodoList, ProfileChecklist, type ChecklistItem } from "@/components/process"
import { FirstSteps } from "@/components/process/first-steps"
import { buildSupplierFirstSteps } from "@/lib/process/first-steps"
import { ShortcutCards } from "@/components/cabinet/dashboard/shortcut-cards"
import { useSupportChat } from "@/components/support/support-chat-context"
import { useSavedValue } from "@/hooks/use-saved-value"
import { firstName, greet } from "@/lib/greet"
import type { ContractWithRelations } from "@/types"
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
  const { openSupport } = useSupportChat()
  const { data: apiContracts, isLoading: contractsLoading } =
    useSupplierContractsQuery(apiEnabled)
  const { data: apiRfqs, isLoading: rfqsLoading } =
    useSupplierRfqBoardQuery(apiEnabled)
  const { data: apiProposals } = useSupplierProposalsQuery(apiEnabled)
  const { data: apiBalance } = useSupplierBalanceQuery(apiEnabled)
  const { data: apiDestinations } = useSupplierFinanceDestinationsQuery(apiEnabled)
  const { data: apiItems } = useSupplierCatalogQuery(undefined, apiEnabled)
  const { data: apiCompanies } = useSupplierCompaniesQuery(apiEnabled)
  const { data: paymentHistoryPage } = useSupplierPaymentHistoryQuery(
    apiEnabled,
    { page: 1, pageSize: 100 },
  )

  const getBuyerName = (buyerId: number) =>
    getCompany(buyerId)?.title ?? `Покупатель #${buyerId}`

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

  const incomePoints = useMemo(
    () =>
      monthlySeries(paymentHistoryPage?.items ?? [], (item) =>
        item.status === "released" ? "released" : item.status === "funded" ? "held" : null,
      ),
    [paymentHistoryPage?.items],
  )
  const monthReleased = incomePoints.at(-1)?.values.released ?? 0
  const waitingProposals = proposalItems.filter((p) =>
    ["submitted", "viewed", "shortlisted", "pending_supplier"].includes(p.status),
  ).length
  const completedDeals = contracts.filter((c) => c.status === "completed").length

  // Same profile as the marks next to it (the active seller, not the first company).
  const companyTitle =
    marks.title ?? myCompany?.title ?? (hydrated && user?.company ? user.company : "Поставщик")
  const name = firstName(user?.name)
  const incompleteChecklist = checklist.filter((c) => !c.done)

  // The path to a first deal. The profile step lists what the checklist
  // still misses (the admin's check is not the supplier's to do).
  const GAP_TEXT: Record<string, { label: string; cta: string }> = {
    company: { label: "описание компании и город", cta: "Заполнить профиль" },
    catalog: { label: "товар или услуга в каталоге", cta: "Добавить товар" },
    payout: { label: "счёт для выплат", cta: "Добавить счёт" },
  }
  const firstStepsKey = `bm-first-steps:supplier:${actorId}`
  const firstSteps = buildSupplierFirstSteps({
    profileGaps: incompleteChecklist
      .filter((item) => GAP_TEXT[item.id] && item.href)
      .map((item) => ({ ...GAP_TEXT[item.id]!, href: item.href! })),
    newRfqCount: newRfqs.length,
    proposalCount: proposalItems.length,
    contracts,
    hasPayoutAccount: Boolean(destinations?.length),
  })
  const guideLoading =
    loading || (useApi && (!apiCompanies || !apiItems || !apiDestinations || !apiProposals))
  // No offers sent and no deals yet: the guide and the ways in, not a page of zeros.
  const isNewcomer = !guideLoading && contracts.length === 0 && proposalItems.length === 0
  const knownVeteran = useSavedValue(firstStepsKey) === "finished"
  const showNumbers = guideLoading ? knownVeteran : !isNewcomer

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
            size="xl"
            className="mt-0.5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/supplier/rfqs?response=open">
              <Inbox className="size-4" />
              Заявки покупателей
            </Link>
          </Button>
          <Button asChild>
            <Link href="/supplier/catalog/new">
              <Plus weight="bold" className="size-4" />
              Добавить товар
            </Link>
          </Button>
        </div>
      </div>

      <FirstSteps
        storageKey={firstStepsKey}
        title="Первая сделка: четыре шага"
        description="Так вы получаете заказы на площадке. Покупатель платит заранее, деньги хранит банк и переводит вам после приёмки."
        steps={firstSteps}
        loading={guideLoading}
      />

      {isNewcomer ? (
        <>
          <ShortcutCards
            label="С чего ещё можно начать"
            items={[
              {
                title: "Заявки покупателей",
                text:
                  newRfqs.length > 0
                    ? `${formatCount(newRfqs.length, "новая заявка", "новые заявки", "новых заявок")} без вашего предложения`
                    : "Что сейчас ищут покупатели",
                icon: TrayIcon,
                href: "/supplier/rfqs?response=open",
              },
              {
                title: "Добавить товар",
                text: "Покупатели найдут вас в каталоге",
                icon: PackageIcon,
                href: "/supplier/catalog/new",
              },
              {
                title: "Спросить поддержку",
                text: "Подскажем, как отправить первое предложение",
                icon: HeadsetIcon,
                onClick: openSupport,
              },
            ]}
          />
        </>
      ) : null}

      {showNumbers ? (
      <div className="space-y-7 bm-rise">
        <section aria-label="Что нужно сделать сейчас">
          <HomeHeading
            title="Что нужно сделать сейчас"
            hint="Дела, которые ждут именно вас: без них заказы стоят на месте."
            badge={
              todo.length > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-100 px-1.5 text-[12px] font-semibold text-amber-900 tnum">
                  {todo.length}
                </span>
              ) : null
            }
          />
          <TodoList
            items={todo}
            loading={loading}
            emptyText="Сейчас от вас ничего не требуется. Загляните в заявки покупателей: там могут быть новые заказы."
            title=""
          />
        </section>

        {incompleteChecklist.length > 0 ? <ProfileChecklist items={checklist} /> : null}

        <section aria-label="Ваши дела">
          <HomeHeading
            title="Ваши дела"
            hint="Коротко о заявках, сделках и деньгах. Каждый блок открывает свой раздел меню."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <StatusCard
              icon={TrayIcon}
              title="Заявки покупателей"
              loading={loading}
              facts={[
                { label: "Новые, без вашего ответа", value: newRfqs.length, attention: newRfqs.length > 0 },
                { label: "Ваши КП ждут решения", value: waitingProposals },
              ]}
              href="/supplier/rfqs?response=open"
              linkLabel="Открыть заявки"
            />
            <StatusCard
              icon={HandshakeIcon}
              title="Сделки"
              loading={loading}
              facts={[
                { label: "В работе", value: openDeals.length },
                { label: "Завершено", value: completedDeals },
                { label: "Новых сообщений", value: unreadCount, attention: unreadCount > 0 },
              ]}
              href="/supplier/contracts?tab=active"
              linkLabel="Открыть сделки"
            />
            <StatusCard
              icon={WalletIcon}
              title="Деньги"
              loading={loading}
              facts={[
                { label: "Поступит после приёмки", value: formatPrice(expectedAmount) },
                { label: "Зачислено в этом месяце", value: formatPrice(monthReleased) },
                ...(balance ? [{ label: "На счёте", value: formatPrice(balance.available) }] : []),
              ]}
              href="/supplier/finance"
              linkLabel="Открыть деньги"
            />
          </div>
        </section>

        {/* Deal cards need the full width; the money log sits under them. */}
        <div className="grid gap-5">
          <ActiveContractsPanel
            contracts={openDeals}
            hydrated={!loading}
            getBuyerName={getBuyerName}
          />
          <DashboardPanel title="Последние операции" href="/supplier/finance">
            <OpsList items={ops.slice(0, 5)} />
          </DashboardPanel>
        </div>
      </div>
      ) : null}

      <ActivateRoleBanner
        targetSide="buyer"
        redirectTo="/customer"
        label="Хотите ещё и покупать на площадке? Включите роль покупателя на этом же аккаунте."
      />
    </PageFrame>
  )
}
