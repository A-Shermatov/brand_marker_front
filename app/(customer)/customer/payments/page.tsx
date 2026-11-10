"use client"

import { Suspense, useState } from "react"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { ListPagination } from "@/components/list-pagination"
import { ConfirmActionDialog } from "@/components/process"
import {
  ALIF_CONFIRM_LABEL,
  AlifPaymentNote,
} from "@/components/cabinet/payments/alif-payment-note"
import { formatCurrency } from "@/lib/format"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useBuyerPaymentsStore } from "@/lib/store/buyer-payments-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useUrlTab } from "@/hooks/use-url-tab"
import { getActorId } from "@/lib/auth-display"
import { getEscrowSummary } from "@/lib/contract-display"
import {
  BUYER_PAYMENTS_TAB_VALUES,
  BuyerPaymentsTabs,
  type BuyerPaymentsTab,
} from "@/components/cabinet/payments/buyer-payments-tabs"
import { BuyerPaymentsSummaryCards } from "@/components/cabinet/payments/buyer-payments-summary-cards"
import { OutgoingPaymentsTable } from "@/components/cabinet/payments/outgoing-payments-table"
import { EscrowFundingTable } from "@/components/cabinet/payments/escrow-funding-table"
import { BuyerInvoicesTable } from "@/components/cabinet/payments/buyer-invoices-table"
import { BuyerRefundsTable } from "@/components/cabinet/payments/buyer-refunds-table"
import { isApiEnabled } from "@/lib/api/config"
import {
  mapApiPaymentHistoryEvent,
  type EscrowFundingRow,
  type OutgoingPaymentRow,
} from "@/lib/buyer-payments-display"
import {
  useAlifPayment,
  usePaymentHistoryQuery,
  usePendingPaymentsQuery,
  useFundAndConfirmMilestoneMutation,
} from "@/hooks/api/use-payments-query"
import { useContractsQuery } from "@/hooks/api/use-contracts-query"

const BuyerPaymentsContent = () => {
  const hydrated = useHydrated()
  const actorId = getActorId(useAuthStore((s) => s.user))
  const [tab, setTab] = useUrlTab<BuyerPaymentsTab>("tab", BUYER_PAYMENTS_TAB_VALUES, "outgoing")
  const [historyPage, setHistoryPage] = useState(1)

  const getOutgoingPayments = useBuyerPaymentsStore((s) => s.getOutgoingPayments)
  const getEscrowFundingQueue = useBuyerPaymentsStore((s) => s.getEscrowFundingQueue)
  const getBuyerInvoices = useBuyerPaymentsStore((s) => s.getBuyerInvoices)
  const getBuyerRefunds = useBuyerPaymentsStore((s) => s.getBuyerRefunds)
  const fundMilestone = useContractsStore((s) => s.fundMilestone)
  const getContract = useContractsStore((s) => s.getContract)
  const getContractsForBuyer = useContractsStore((s) => s.getContractsForBuyer)
  const getCompany = useCompaniesStore((s) => s.getCompany)

  const outgoing = hydrated ? getOutgoingPayments(actorId) : []
  const escrowQueue = hydrated ? getEscrowFundingQueue(actorId) : []
  const invoices = hydrated ? getBuyerInvoices(actorId) : []
  const refunds = hydrated ? getBuyerRefunds(actorId) : []
  const buyerContracts = hydrated ? getContractsForBuyer(actorId) : []
  const useApi = isApiEnabled()
  const { data: paymentHistoryPage } = usePaymentHistoryQuery(hydrated && useApi, {
    page: historyPage,
  })
  const { data: pendingPayments } = usePendingPaymentsQuery(hydrated && useApi)
  const { data: apiContractsPage } = useContractsQuery(hydrated && useApi, {
    pageSize: 100,
  })
  const apiContracts = apiContractsPage?.items ?? []
  const paymentHistoryItems = paymentHistoryPage?.items ?? []
  const historyTotalPages = useApi ? (paymentHistoryPage?.total_pages ?? 0) : 1
  const fundMutation = useFundAndConfirmMilestoneMutation()
  const { viaAlif, currency: alifCurrency } = useAlifPayment(hydrated && useApi)
  const [pendingFund, setPendingFund] = useState<EscrowFundingRow | null>(null)

  const contractById = new Map(apiContracts.map((c) => [c.id, c]))

  const apiOutgoing: OutgoingPaymentRow[] = paymentHistoryItems
    .map((item) => {
      const event = mapApiPaymentHistoryEvent(item)
      if (event.type !== "funding" && event.type !== "release") return null
      const contract = contractById.get(event.contractId)
      return {
        ...event,
        contractTitle: contract?.title ?? `Сделка #${event.contractId}`,
        supplierActorId: contract?.supplier_actor_id ?? 0,
      }
    })
    .filter((row): row is OutgoingPaymentRow => row !== null)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const apiEscrowQueue: EscrowFundingRow[] =
    (pendingPayments?.items ?? []).map((p) => {
      const contract = contractById.get(p.contract_id)
      return {
        contractId: p.contract_id,
        contractTitle: contract?.title ?? `Сделка #${p.contract_id}`,
        milestoneId: p.milestone_id,
        title: p.title,
        amount: p.amount,
        currency: p.currency as EscrowFundingRow["currency"],
        status: p.status,
        supplierActorId: contract?.supplier_actor_id ?? 0,
      }
    })

  const effectiveOutgoing = useApi ? apiOutgoing : outgoing
  const effectiveEscrowQueue = useApi ? apiEscrowQueue : escrowQueue
  const effectiveContracts = useApi
    ? (apiContracts as typeof buyerContracts)
    : buyerContracts

  const totalOutgoing = effectiveOutgoing.reduce((sum, p) => sum + p.amount, 0)
  const inEscrow = effectiveContracts.reduce(
    (sum, c) => sum + getEscrowSummary(c).held,
    0,
  )
  const pendingFunding = effectiveEscrowQueue.reduce((sum, r) => sum + r.amount, 0)
  const currency = effectiveContracts[0]?.currency ?? "TJS"

  const getContractTitle = (contractId: number | null) => {
    if (!contractId) return "—"
    return getContract(contractId)?.title ?? `Сделка #${contractId}`
  }

  const handleFund = (row: EscrowFundingRow) => {
    if (useApi && viaAlif) {
      setPendingFund(row)
      return
    }
    if (useApi) {
      fundMutation.mutate(row.milestoneId)
      return
    }
    fundMilestone(row.contractId, row.milestoneId, actorId)
  }

  const handleConfirmAlifFund = () => {
    if (!pendingFund) return
    fundMutation.mutate(pendingFund.milestoneId)
    setPendingFund(null)
  }

  return (
    <PageFrame>
      <PageHeader
        title="Платежи"
        description="Платежи, безопасные сделки и документы"
      />

      <BuyerPaymentsSummaryCards
        totalOutgoing={totalOutgoing}
        inEscrow={inEscrow}
        pendingFunding={pendingFunding}
        currency={currency}
        hydrated={hydrated}
      />

      <BuyerPaymentsTabs tab={tab} onTabChange={setTab} />

      <PageSurface className="p-6">
        {tab === "outgoing" && (
          <OutgoingPaymentsTable
            payments={effectiveOutgoing}
            getSupplierName={(id) => getCompany(id)?.title ?? "Поставщик"}
          />
        )}
        {tab === "outgoing" && (
          <ListPagination
            page={historyPage}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
          />
        )}
        {tab === "escrow" && (
          <EscrowFundingTable
            rows={effectiveEscrowQueue}
            getSupplierName={(id) => getCompany(id)?.title ?? "Поставщик"}
            viaAlif={viaAlif}
            alifCurrency={alifCurrency}
            onFund={handleFund}
          />
        )}
        {tab === "invoices" && (
          <BuyerInvoicesTable
            invoices={invoices}
            getContractTitle={getContractTitle}
          />
        )}
        {tab === "refunds" && (
          <BuyerRefundsTable
            refunds={refunds}
            getContractTitle={(id) => getContractTitle(id)}
          />
        )}
      </PageSurface>

      {pendingFund && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => !open && setPendingFund(null)}
          title={`Оплатить ${formatCurrency(pendingFund.amount, pendingFund.currency)}?`}
          description={
            <>
              <p>
                Этап «{pendingFund.title}» по сделке «{pendingFund.contractTitle}». Деньги поступят
                на гарантию площадки и уйдут поставщику только после приёмки работы.
              </p>
              <AlifPaymentNote />
            </>
          }
          confirmLabel={ALIF_CONFIRM_LABEL}
          onConfirm={handleConfirmAlifFund}
        />
      )}
    </PageFrame>
  )
}

export default function BuyerPaymentsPage() {
  return (
    <Suspense fallback={null}>
      <BuyerPaymentsContent />
    </Suspense>
  )
}
