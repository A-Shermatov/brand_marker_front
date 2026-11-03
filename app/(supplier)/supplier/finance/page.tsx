"use client"

import { useMemo, useRef, useState } from "react"
import { FileTextIcon as FileText, BankIcon as Landmark } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { AddPayoutDestinationDialog } from "@/components/supplier/finance/add-payout-destination-dialog"
import { PayoutAccountCard } from "@/components/supplier/finance/payout-account-card"
import { formatCurrency, formatIsoDateTime } from "@/lib/format"
import { PageFrame, PageHeader } from "@/components/layout"
import { ListPagination } from "@/components/list-pagination"
import { MetricTile } from "@/components/process"
import { StatusBadge } from "@/components/bm"
import { useAuthStore } from "@/lib/store/auth-store"
import { useFinanceStore } from "@/lib/store/finance-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { getApiErrorMessage } from "@/lib/api/client"
import {
  useSupplierBalanceQuery,
  useSupplierPaymentHistoryQuery,
} from "@/hooks/api/use-supplier-payments-query"
import {
  useSupplierFinanceDestinationsQuery,
  useSupplierInvoicesQuery,
  useSupplierWithdrawalsQuery,
  useRequestWithdrawalMutation,
  useCreateDestinationMutation,
} from "@/hooks/api/use-supplier-finance-query"
import { getSupplierBalances, withdrawalBankLabel } from "@/lib/finance-display"
import { WithdrawalForm } from "@/components/supplier/finance/withdrawal-form"
import { InvoicesTable } from "@/components/supplier/finance/invoices-table"
import { isDealOpen } from "@/lib/process/deal-stages"
import type { Currency, WithdrawalBank, WithdrawalDestinationType } from "@/types"

const WITHDRAWAL_LABEL: Record<string, string> = {
  pending: "В обработке",
  processing: "В обработке",
  completed: "Выплачено",
  failed: "Ошибка",
  cancelled: "Отменено",
}

export default function SupplierFinancePage() {
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const useApi = isApiEnabled()
  const payoutRef = useRef<HTMLDivElement>(null)
  const [addDestinationOpen, setAddDestinationOpen] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [invoicesPage, setInvoicesPage] = useState(1)

  const getDestinations = useFinanceStore((s) => s.getDestinations)
  const getWithdrawals = useFinanceStore((s) => s.getWithdrawals)
  const getInvoices = useFinanceStore((s) => s.getInvoices)
  const requestWithdrawal = useFinanceStore((s) => s.requestWithdrawal)
  const addDestinationLocal = useFinanceStore((s) => s.addDestination)
  const contracts = useContractsStore((s) => s.contracts)
  const getContract = useContractsStore((s) => s.getContract)

  const { data: apiBalance } = useSupplierBalanceQuery(hydrated && useApi)
  const { data: paymentHistoryPage } = useSupplierPaymentHistoryQuery(
    hydrated && useApi,
    { page: historyPage },
  )
  const paymentHistory = paymentHistoryPage?.items ?? []
  const { data: apiDestinations } = useSupplierFinanceDestinationsQuery(
    hydrated && useApi,
  )
  const { data: apiWithdrawals } = useSupplierWithdrawalsQuery(hydrated && useApi, {
    page: historyPage,
  })
  const { data: apiInvoices } = useSupplierInvoicesQuery(hydrated && useApi, {
    page: invoicesPage,
  })
  const historyTotalPages = useApi
    ? Math.max(
        paymentHistoryPage?.total_pages ?? 0,
        apiWithdrawals?.total_pages ?? 0,
      )
    : 1
  const invoicesTotalPages = useApi ? (apiInvoices?.total_pages ?? 0) : 1
  const withdrawalMutation = useRequestWithdrawalMutation()
  const createDestinationMutation = useCreateDestinationMutation()

  const localBalances = hydrated
    ? getSupplierBalances(actorId, contracts, getWithdrawals(actorId))
    : {
        available: 0,
        pending: 0,
        escrowLocked: 0,
        currency: "TJS" as Currency,
      }

  const balances =
    useApi && apiBalance
      ? {
          available: apiBalance.available,
          pending: apiBalance.pending,
          escrowLocked: apiBalance.escrow_locked,
          currency: apiBalance.currency as Currency,
        }
      : localBalances

  const destinationList = useApi
    ? (apiDestinations?.items ?? [])
    : hydrated
      ? getDestinations(actorId)
      : []

  const withdrawalList = useApi
    ? (apiWithdrawals?.items ?? [])
    : hydrated
      ? getWithdrawals(actorId)
      : []

  const invoiceList = useApi
    ? (apiInvoices?.items ?? [])
    : hydrated
      ? getInvoices(actorId)
      : paymentHistory
          .filter((p) => p.status === "released")
          .map((p, idx) => ({
            id: idx + 1,
            actor_id: actorId,
            contract_id: p.contract_id,
            number: `INV-${p.contract_id}-${p.milestone_id}`,
            title: p.title,
            amount: p.amount,
            currency: p.currency as Currency,
            status: "paid" as const,
            issued_at: p.created_at,
            due_at: null,
            paid_at: p.created_at,
          }))

  const incomingAfterAccept = useMemo(() => {
    if (balances.escrowLocked > 0) return balances.escrowLocked
    const open = contracts.filter(
      (c) => c.supplier_actor_id === actorId && isDealOpen(c),
    )
    return Math.round(
      open.reduce((sum, c) => sum + c.agreed_amount * 0.97, 0),
    )
  }, [balances.escrowLocked, contracts, actorId])

  const defaultDestination =
    destinationList.find((d) => d.is_default) ?? destinationList[0] ?? null

  const historyRows = useMemo(() => {
    const rows: {
      key: string
      date: string
      what: string
      amount: number
      currency: string
      status: string
      statusLabel: string
    }[] = []

    withdrawalList.forEach((w) => {
      const bankName = withdrawalBankLabel(w.bank)
      rows.push({
        key: `w-${w.id}`,
        // Время вывода: когда выплатили; иначе время заявки
        date: w.completed_at || w.created_at,
        what: `Вывод через ${bankName}`,
        amount: -w.amount,
        currency: w.currency,
        status: w.status,
        statusLabel: WITHDRAWAL_LABEL[w.status] ?? w.status,
      })
    })

    paymentHistory.forEach((p) => {
      rows.push({
        key: `p-${p.contract_id}-${p.milestone_id}`,
        date: p.created_at,
        what: p.title,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        statusLabel:
          p.status === "released"
            ? "Переведено"
            : p.status === "funded" || p.status === "held"
              ? "На гарантии"
              : p.status,
      })
    })

    rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    return rows
  }, [withdrawalList, paymentHistory])

  const getContractTitle = (contractId: number | null) => {
    if (!contractId) return "—"
    return getContract(contractId)?.title ?? `Сделка #${contractId}`
  }

  const handleAddDestination = async (input: {
    type: WithdrawalDestinationType
    label: string
    details: string
  }) => {
    if (useApi) {
      await createDestinationMutation.mutateAsync({
        ...input,
        is_default: destinationList.length === 0,
      })
      return
    }
    addDestinationLocal(actorId, input)
  }

  const handleWithdrawal = async (input: {
    destinationId: number
    amount: number
    bank: WithdrawalBank
  }) => {
    if (!useApi) return requestWithdrawal(actorId, input)
    try {
      await withdrawalMutation.mutateAsync({
        destination_id: input.destinationId,
        amount: input.amount,
        bank: input.bank,
      })
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        error: getApiErrorMessage(err, "Не удалось создать заявку на вывод"),
      }
    }
  }

  const scrollToWithdraw = () => {
    payoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <PageFrame>
      <PageHeader
        title="Финансы"
        description="Выплаты по завершённым сделкам через банк"
        actions={
          <Button type="button" size="lg" onClick={scrollToWithdraw}>
            <Landmark size={16} />
            Вывести на счёт
          </Button>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Баланс">
        <MetricTile
          label="Можно вывести"
          value={
            hydrated
              ? formatCurrency(balances.available, balances.currency)
              : "—"
          }
          hint="после приёмки покупателями"
          valueClassName="text-safe-700"
        />
        <MetricTile
          label="Поступит после приёмки"
          value={
            hydrated
              ? formatCurrency(incomingAfterAccept, balances.currency)
              : "—"
          }
          hint="на гарантии банка"
        />
        <MetricTile
          label="Комиссия площадки"
          value="3%"
          hint="только с завершённых сделок"
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <span className="text-[13px] font-semibold text-mute">История</span>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-line bg-white">
            {historyRows.length === 0 ? (
              <p className="p-6 text-[14px] text-mute">Операций пока нет.</p>
            ) : (
              <table className="w-full min-w-[560px] text-[14.5px]">
                <thead>
                  <tr className="border-b border-line text-left">
                    {["Дата и время", "Операция", "Сумма", "Статус"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3.5 text-[13px] font-semibold whitespace-nowrap text-mute"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {historyRows.map((row) => (
                    <tr key={row.key}>
                      <td className="whitespace-nowrap px-5 py-4 text-mute tnum">
                        {formatIsoDateTime(row.date)}
                      </td>
                      <td className="px-5 py-4">{row.what}</td>
                      <td className="mono whitespace-nowrap px-5 py-4 font-semibold">
                        <span
                          className={
                            row.amount > 0 ? "text-safe-700" : undefined
                          }
                        >
                          {row.amount > 0 ? "+" : "−"}
                          {formatCurrency(
                            Math.abs(row.amount),
                            row.currency,
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          status={row.status}
                          label={row.statusLabel}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ListPagination
            page={historyPage}
            totalPages={historyTotalPages}
            onPageChange={setHistoryPage}
          />
        </div>

        <PayoutAccountCard
          destination={defaultDestination}
          onEdit={() => setAddDestinationOpen(true)}
        />
      </div>

      <div
        ref={payoutRef}
        id="payout"
        className="mt-8 scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6"
      >
        <b className="text-[15px]">Вывести через банк</b>
        <p className="mt-1 text-[13.5px] text-mute">
          Выберите банк, счёт и сумму. Заявка уйдёт в обработку; для Alif
          создаётся выплата в админке.
        </p>
        <div className="mt-4 max-w-lg">
          <WithdrawalForm
            destinations={destinationList}
            balances={balances}
            onSubmit={handleWithdrawal}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="size-4 text-mute" aria-hidden />
          <b className="text-[15px]">Счета</b>
        </div>
        <InvoicesTable
          invoices={invoiceList}
          getContractTitle={getContractTitle}
        />
        <ListPagination
          page={invoicesPage}
          totalPages={invoicesTotalPages}
          onPageChange={setInvoicesPage}
        />
      </div>

      <AddPayoutDestinationDialog
        open={addDestinationOpen}
        onOpenChange={setAddDestinationOpen}
        busy={createDestinationMutation.isPending}
        onSubmit={handleAddDestination}
      />
    </PageFrame>
  )
}
