import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { BuyerInvoice, BuyerRefund } from "@/types"
import { mockBuyerInvoices, mockBuyerRefunds } from "@/lib/mock/buyer-finance"
import { API_MODE } from "@/lib/api/config"
import {
  buildPaymentHistoryFromContract,
  type EscrowFundingRow,
  type OutgoingPaymentRow,
} from "@/lib/buyer-payments-display"
import { useContractsStore } from "@/lib/store/contracts-store"

interface BuyerPaymentsState {
  invoices: BuyerInvoice[]
  refunds: BuyerRefund[]
  getOutgoingPayments: (buyerId: number) => OutgoingPaymentRow[]
  getEscrowFundingQueue: (buyerId: number) => EscrowFundingRow[]
  getBuyerInvoices: (buyerId: number) => BuyerInvoice[]
  getBuyerRefunds: (buyerId: number) => BuyerRefund[]
}

const ESCROW_QUEUE_STATUSES = ["awaiting_payment", "pending"] as const

export const useBuyerPaymentsStore = create<BuyerPaymentsState>()(
  persist(
    (_set, get) => ({
      invoices: API_MODE ? [] : mockBuyerInvoices,
      refunds: API_MODE ? [] : mockBuyerRefunds,

      getOutgoingPayments: (buyerId) => {
        const contracts = useContractsStore
          .getState()
          .getContractsForBuyer(buyerId)
        const paymentHistoryAt = useContractsStore.getState().paymentHistoryAt

        return contracts
          .flatMap((contract) =>
            buildPaymentHistoryFromContract(contract, paymentHistoryAt)
              .filter((e) => e.type === "funding" || e.type === "release")
              .map((event) => ({
                ...event,
                contractTitle: contract.title,
                supplierActorId: contract.supplier_actor_id,
              })),
          )
          .sort(
            (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
          )
      },

      getEscrowFundingQueue: (buyerId) => {
        const contracts = useContractsStore
          .getState()
          .getContractsForBuyer(buyerId)

        return contracts
          .flatMap((contract) =>
            (contract.payment_plan?.milestones ?? [])
              .filter((m) =>
                ESCROW_QUEUE_STATUSES.includes(
                  m.status as (typeof ESCROW_QUEUE_STATUSES)[number],
                ),
              )
              .map((milestone) => ({
                contractId: contract.id,
                contractTitle: contract.title,
                milestoneId: milestone.id,
                title: milestone.title,
                amount: milestone.amount,
                currency: contract.currency,
                status: milestone.status,
                supplierActorId: contract.supplier_actor_id,
              })),
          )
          .sort((a, b) => a.contractId - b.contractId)
      },

      getBuyerInvoices: (buyerId) =>
        get()
          .invoices.filter((inv) => inv.buyer_actor_id === buyerId)
          .sort(
            (a, b) =>
              new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime(),
          ),

      getBuyerRefunds: (buyerId) => {
        const mockRefunds = get()
          .refunds.filter((r) => r.buyer_actor_id === buyerId)

        const milestoneRefunds = useContractsStore
          .getState()
          .getContractsForBuyer(buyerId)
          .flatMap((contract) =>
            (contract.payment_plan?.milestones ?? [])
              .filter((m) => m.status === "refunded")
              .map((milestone) => ({
                id: contract.id * 10000 + milestone.id,
                buyer_actor_id: buyerId,
                contract_id: contract.id,
                amount: milestone.amount,
                currency: contract.currency,
                reason: `Возврат по этапу «${milestone.title}»`,
                created_at: contract.created_at,
              })),
          )

        return [...mockRefunds, ...milestoneRefunds].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
      },
    }),
    {
      name: "bm-buyer-payments",
      merge: (persisted, current) => {
        if (API_MODE) return current
        return { ...current, ...(persisted as Partial<BuyerPaymentsState>) }
      },
    },
  ),
)
