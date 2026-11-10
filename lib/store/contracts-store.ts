import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  ContractFile,
  ContractWithRelations,
  Currency,
  Message,
  PaymentMilestone,
  PaymentMilestoneInput,
  PaymentMilestoneStatus,
  PaymentMilestoneTrigger,
  PaymentType,
  SubmissionAsset,
  WorkSubmissionType,
} from "@/types"
import { buildDefaultMilestones, splitAmounts } from "@/lib/payment-milestones"
import { mockContracts } from "@/lib/mock/contracts"
import { mockRfqs } from "@/lib/mock/rfqs"
import { API_MODE } from "@/lib/api/config"
import { useNotificationsStore } from "@/lib/store/notifications-store"
import {
  PENDING_MILESTONE_STATUSES,
  filterContractsByTab,
  getEscrowSummary,
  type ContractListTab,
  type EscrowSummary,
} from "@/lib/contract-display"
import type { BuyerContractListTab } from "@/lib/buyer-contract-display"
import {
  buildPaymentHistoryFromContract,
  type PaymentHistoryEvent,
} from "@/lib/buyer-payments-display"

export type IncomingMessage = {
  message: Message
  contract: ContractWithRelations
  senderName: string
}

type SubmitWorkInput = {
  note: string
  fileNames: string[]
  assets?: SubmissionAsset[]
}

export type CreateContractFromProposalInput = {
  rfq_id: string
  proposal_id: number
  buyer_actor_id: number
  supplier_actor_id: number
  title: string
  description: string | null
  agreed_amount: number
  currency: Currency
  payment_type: PaymentType
  delivery_time?: string | null
  milestones?: PaymentMilestoneInput[]
  files?: Array<{
    file_name: string
    file_url: string
    file_type: string
  }>
}

const milestoneStatusForTrigger = (
  trigger: PaymentMilestoneTrigger,
): PaymentMilestoneStatus =>
  trigger === "contract_signed" ? "awaiting_payment" : "pending"

const BUYER_PENDING_PAYMENT_STATUSES = ["pending", "awaiting_payment"] as const

interface ContractsState {
  contracts: ContractWithRelations[]
  lastReadAt: Record<number, string>
  paymentHistoryAt: Record<string, string>
  getContract: (id: number) => ContractWithRelations | undefined
  getContractByRfqId: (rfqId: string) => ContractWithRelations | undefined
  getContractsForBuyer: (actorId: number) => ContractWithRelations[]
  getContractsByTabForBuyer: (
    actorId: number,
    tab: BuyerContractListTab,
  ) => ContractWithRelations[]
  getActiveContractsForBuyer: (actorId: number) => ContractWithRelations[]
  getPendingPaymentsForBuyer: (actorId: number) => number
  getPendingMilestonesForBuyer: (actorId: number) => Array<{
    contract: ContractWithRelations
    milestoneId: number
    title: string
    amount: number
    currency: string
    status: string
  }>
  getDisputesForBuyer: (actorId: number) => ContractWithRelations[]
  getIncomingMessagesForBuyer: (
    actorId: number,
    getSupplierName: (id: number) => string,
  ) => IncomingMessage[]
  getUnreadMessageCountForBuyer: (actorId: number) => number
  createContractFromProposal: (input: CreateContractFromProposalInput) => number
  getContractsForSupplier: (actorId: number) => ContractWithRelations[]
  getContractsByTab: (actorId: number, tab: ContractListTab) => ContractWithRelations[]
  getActiveContracts: (actorId: number) => ContractWithRelations[]
  getRevenue: (actorId: number) => number
  getPendingPaymentsAmount: (actorId: number) => number
  getPendingMilestones: (actorId: number) => Array<{
    contract: ContractWithRelations
    milestoneId: number
    title: string
    amount: number
    currency: string
    status: string
  }>
  getIncomingMessages: (
    actorId: number,
    currentUserId: number,
    getCompanyName: (id: number) => string,
  ) => IncomingMessage[]
  getUnreadMessageCount: (actorId: number, currentUserId: number) => number
  markConversationRead: (contractId: number, currentUserId?: number) => void
  getEscrowSummary: (contract: ContractWithRelations) => EscrowSummary
  fundMilestone: (
    contractId: number,
    milestoneId: number,
    buyerId: number,
  ) => boolean
  approveMilestone: (
    contractId: number,
    milestoneId: number,
    buyerId: number,
  ) => boolean
  getPaymentHistory: (contractId: number) => PaymentHistoryEvent[]
  submitWork: (contractId: number, input: SubmitWorkInput) => void
  approveSubmission: (contractId: number, submissionId: number) => void
  rejectSubmission: (contractId: number, submissionId: number) => void
  openDispute: (contractId: number, reason: string, initiatorId: number) => void
  addMessage: (
    contractId: number,
    senderId: number,
    text: string,
    senderName?: string,
  ) => void
  addFile: (
    contractId: number,
    file: Pick<ContractFile, "file_name" | "file_url" | "file_type">,
    uploader: { id: number; name?: string; side: "buyer" | "supplier" },
  ) => void
}

const normalizeContract = (
  contract: ContractWithRelations,
): ContractWithRelations => ({
  ...contract,
  files: contract.files ?? [],
  dispute: contract.dispute
    ? {
        ...contract.dispute,
        evidence: contract.dispute.evidence ?? [],
      }
    : contract.dispute ?? null,
  submissions: (contract.submissions ?? []).map((submission) => ({
    ...submission,
    assets: submission.assets ?? [],
    file_names: submission.file_names ?? [],
  })),
  conversation: contract.conversation
    ? {
        ...contract.conversation,
        messages: (contract.conversation.messages ?? []).map((message) => ({
          ...message,
          sender_name: message.sender_name ?? undefined,
        })),
      }
    : null,
})

const normalizeContracts = (
  contracts: ContractWithRelations[],
): ContractWithRelations[] => contracts.map(normalizeContract)

const getSupplierMilestones = (
  contracts: ContractWithRelations[],
  actorId: number,
) =>
  contracts
    .filter((c) => c.supplier_actor_id === actorId)
    .flatMap((c) =>
      (c.payment_plan?.milestones ?? []).map((m) => ({ contract: c, milestone: m })),
    )

const getBuyerMilestones = (
  contracts: ContractWithRelations[],
  actorId: number,
) =>
  contracts
    .filter((c) => c.buyer_actor_id === actorId)
    .flatMap((c) =>
      (c.payment_plan?.milestones ?? []).map((m) => ({ contract: c, milestone: m })),
    )

const nextContractId = (contracts: ContractWithRelations[]): number =>
  contracts.reduce((max, c) => Math.max(max, c.id), 0) + 1

const nextMilestoneId = (contracts: ContractWithRelations[]): number => {
  let maxId = 0
  for (const contract of contracts) {
    for (const milestone of contract.payment_plan?.milestones ?? []) {
      if (milestone.id > maxId) maxId = milestone.id
    }
  }
  return maxId + 1
}

const daysFromNowIso = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]!
}

const parseDeliveryDays = (value?: string | null): number | null => {
  if (!value) return null
  const match = String(value).match(/(\d+)/)
  if (!match) return null
  const days = Number(match[1])
  return Number.isFinite(days) && days > 0 ? days : null
}

const getSubmissionType = (contract: ContractWithRelations): WorkSubmissionType => {
  const rfq = mockRfqs.find((r) => r.id === contract.rfq_id)
  if (rfq?.type === "product") return "delivery"
  if (rfq?.type === "service") return "work"
  if (contract.status === "delivered") return "delivery"
  return "work"
}

const nextMessageId = (contracts: ContractWithRelations[]): number => {
  let maxId = 0
  for (const contract of contracts) {
    for (const message of contract.conversation?.messages ?? []) {
      if (message.id > maxId) maxId = message.id
    }
  }
  return maxId + 1
}

const nextFileId = (contracts: ContractWithRelations[]): number => {
  let maxId = 0
  for (const contract of contracts) {
    for (const file of contract.files ?? []) {
      if (file.id > maxId) maxId = file.id
    }
  }
  return maxId + 1
}

const nextSubmissionId = (contracts: ContractWithRelations[]): number => {
  let maxId = 0
  for (const contract of contracts) {
    for (const submission of contract.submissions) {
      if (submission.id > maxId) maxId = submission.id
    }
  }
  return maxId + 1
}

export const useContractsStore = create<ContractsState>()(
  persist(
    (set, get) => ({
      contracts: API_MODE ? [] : mockContracts,
      lastReadAt: {},
      paymentHistoryAt: {},

      getContract: (id) => {
        const contract = get().contracts.find((c) => c.id === id)
        return contract ? normalizeContract(contract) : undefined
      },

      getContractByRfqId: (rfqId) => {
        const contract = get().contracts.find((c) => c.rfq_id === rfqId)
        return contract ? normalizeContract(contract) : undefined
      },

      getContractsForBuyer: (actorId) =>
        normalizeContracts(
          get().contracts.filter((c) => c.buyer_actor_id === actorId),
        ),

      getContractsByTabForBuyer: (actorId, tab) =>
        filterContractsByTab(
          normalizeContracts(
            get().contracts.filter((c) => c.buyer_actor_id === actorId),
          ),
          tab,
        ),

      getActiveContractsForBuyer: (actorId) =>
        get().contracts.filter(
          (c) =>
            c.buyer_actor_id === actorId &&
            ["active", "pending_payment", "delivered"].includes(c.status),
        ),

      getPendingPaymentsForBuyer: (actorId) =>
        getBuyerMilestones(get().contracts, actorId)
          .filter(({ milestone }) =>
            BUYER_PENDING_PAYMENT_STATUSES.includes(
              milestone.status as (typeof BUYER_PENDING_PAYMENT_STATUSES)[number],
            ),
          )
          .reduce((sum, { milestone }) => sum + milestone.amount, 0),

      getPendingMilestonesForBuyer: (actorId) =>
        getBuyerMilestones(get().contracts, actorId)
          .filter(({ milestone }) =>
            BUYER_PENDING_PAYMENT_STATUSES.includes(
              milestone.status as (typeof BUYER_PENDING_PAYMENT_STATUSES)[number],
            ),
          )
          .map(({ contract, milestone }) => ({
            contract,
            milestoneId: milestone.id,
            title: milestone.title,
            amount: milestone.amount,
            currency: contract.currency,
            status: milestone.status,
          })),

      getDisputesForBuyer: (actorId) =>
        get().contracts.filter(
          (c) => c.buyer_actor_id === actorId && c.status === "disputed",
        ),

      getIncomingMessagesForBuyer: (actorId, getSupplierName) => {
        const buyerContracts = get().contracts.filter(
          (c) => c.buyer_actor_id === actorId,
        )
        const incoming: IncomingMessage[] = []

        for (const contract of buyerContracts) {
          const messages = contract.conversation?.messages ?? []
          for (const message of messages) {
            if (message.sender_id === actorId) continue
            incoming.push({
              message,
              contract,
              senderName: getSupplierName(message.sender_id),
            })
          }
        }

        return incoming.sort((a, b) => b.message.id - a.message.id)
      },

      getUnreadMessageCountForBuyer: (actorId) => {
        const { lastReadAt } = get()
        const incoming = get().getIncomingMessagesForBuyer(actorId, () => "")
        return incoming.filter((item) => {
          const readAt = lastReadAt[item.contract.id]
          if (!readAt) return true
          return item.message.id > Number(readAt)
        }).length
      },

      createContractFromProposal: (input) => {
        const contracts = get().contracts
        const contractId = nextContractId(contracts)
        const milestoneBaseId = nextMilestoneId(contracts)
        const today = new Date().toISOString().split("T")[0]!
        const createdAt = new Date().toISOString()
        const fileBaseId = nextFileId(contracts)

        const sourceMilestones =
          input.payment_type === "milestone" && input.milestones?.length
            ? input.milestones
            : buildDefaultMilestones(input.payment_type)
        const amounts = splitAmounts(
          sourceMilestones.map((m) => m.percentage),
          input.agreed_amount,
        )
        const milestones: PaymentMilestone[] = sourceMilestones.map((m, index) => ({
          id: milestoneBaseId + index,
          contract_id: contractId,
          title: m.title,
          percentage: m.percentage,
          amount: amounts[index] ?? 0,
          trigger: m.trigger,
          status: milestoneStatusForTrigger(m.trigger),
        }))

        const contract: ContractWithRelations = {
          id: contractId,
          rfq_id: input.rfq_id,
          proposal_id: input.proposal_id,
          buyer_actor_id: input.buyer_actor_id,
          supplier_actor_id: input.supplier_actor_id,
          title: input.title,
          description: input.description,
          agreed_amount: input.agreed_amount,
          currency: input.currency,
          start_date: today,
          due_date: daysFromNowIso(parseDeliveryDays(input.delivery_time) ?? 30),
          payment_type: input.payment_type,
          created_at: new Date().toISOString(),
          status: "pending_payment",
          payment_plan: {
            id: contractId,
            contract_id: contractId,
            payment_type: input.payment_type,
            milestones,
          },
          conversation: {
            id: contractId,
            contract_id: contractId,
            messages: [
              {
                id: nextMessageId(contracts),
                conversation_id: contractId,
                sender_id: input.buyer_actor_id,
                text: "Сделка создана. Готовы обсудить детали.",
                attachment: null,
              },
            ],
          },
          files: (input.files ?? []).map((file, index) => ({
            id: fileBaseId + index,
            contract_id: contractId,
            file_name: file.file_name,
            file_url: file.file_url,
            file_type: file.file_type,
            uploaded_by: input.buyer_actor_id,
            uploaded_by_name: "Покупатель",
            uploaded_by_side: "buyer" as const,
            created_at: createdAt,
          })),
          submissions: [],
          dispute: null,
        }

        set((state) => ({
          contracts: [contract, ...state.contracts],
        }))

        return contractId
      },

      getContractsForSupplier: (actorId) =>
        normalizeContracts(
          get().contracts.filter((c) => c.supplier_actor_id === actorId),
        ),

      getContractsByTab: (actorId, tab) =>
        filterContractsByTab(
          normalizeContracts(
            get().contracts.filter((c) => c.supplier_actor_id === actorId),
          ),
          tab,
        ),

      getActiveContracts: (actorId) =>
        get().contracts.filter(
          (c) =>
            c.supplier_actor_id === actorId &&
            ["active", "pending_payment", "delivered"].includes(c.status),
        ),

      getRevenue: (actorId) =>
        getSupplierMilestones(get().contracts, actorId)
          .filter(({ milestone }) => milestone.status === "released")
          .reduce((sum, { milestone }) => sum + milestone.amount, 0),

      getPendingPaymentsAmount: (actorId) =>
        getSupplierMilestones(get().contracts, actorId)
          .filter(({ milestone }) =>
            PENDING_MILESTONE_STATUSES.includes(milestone.status),
          )
          .reduce((sum, { milestone }) => sum + milestone.amount, 0),

      getPendingMilestones: (actorId) =>
        getSupplierMilestones(get().contracts, actorId)
          .filter(({ milestone }) =>
            PENDING_MILESTONE_STATUSES.includes(milestone.status),
          )
          .map(({ contract, milestone }) => ({
            contract,
            milestoneId: milestone.id,
            title: milestone.title,
            amount: milestone.amount,
            currency: contract.currency,
            status: milestone.status,
          })),

      getIncomingMessages: (actorId, currentUserId, getCompanyName) => {
        const supplierContracts = get().contracts.filter(
          (c) => c.supplier_actor_id === actorId,
        )
        const incoming: IncomingMessage[] = []

        for (const contract of supplierContracts) {
          const messages = contract.conversation?.messages ?? []
          for (const message of messages) {
            if (message.sender_id === actorId || message.sender_id === currentUserId) {
              continue
            }
            incoming.push({
              message,
              contract,
              senderName: getCompanyName(message.sender_id),
            })
          }
        }

        return incoming.sort(
          (a, b) => b.message.id - a.message.id,
        )
      },

      getUnreadMessageCount: (actorId, currentUserId) => {
        const { lastReadAt } = get()
        const incoming = get().getIncomingMessages(
          actorId,
          currentUserId,
          () => "",
        )
        return incoming.filter((item) => {
          const readAt = lastReadAt[item.contract.id]
          if (!readAt) return true
          return item.message.id > Number(readAt)
        }).length
      },

      markConversationRead: (contractId, currentUserId) =>
        set((state) => {
          const contract = state.contracts.find((c) => c.id === contractId)
          const messages = contract?.conversation?.messages ?? []
          const lastMessage = messages.at(-1)
          if (!lastMessage) return state
          const viewedAt = new Date().toISOString()
          return {
            lastReadAt: {
              ...state.lastReadAt,
              [contractId]: String(lastMessage.id),
            },
            contracts:
              currentUserId && currentUserId > 0
                ? state.contracts.map((item) => {
                    if (item.id !== contractId || !item.conversation) return item
                    return {
                      ...item,
                      conversation: {
                        ...item.conversation,
                        messages: item.conversation.messages.map((message) => {
                          if (
                            message.sender_id === currentUserId ||
                            message.status === "viewed"
                          ) {
                            return message
                          }
                          return {
                            ...message,
                            status: "viewed" as const,
                            viewed_at: viewedAt,
                            delivered_at: message.delivered_at ?? viewedAt,
                          }
                        }),
                      },
                    }
                  })
                : state.contracts,
          }
        }),

      getEscrowSummary: (contract) => getEscrowSummary(contract),

      fundMilestone: (contractId, milestoneId, buyerId) => {
        const contract = get().contracts.find((c) => c.id === contractId)
        if (!contract || contract.buyer_actor_id !== buyerId) return false

        const milestone = contract.payment_plan?.milestones.find(
          (m) => m.id === milestoneId,
        )
        if (
          !milestone ||
          !["awaiting_payment", "pending"].includes(milestone.status)
        ) {
          return false
        }

        const now = new Date().toISOString()
        const historyKey = `${contractId}-${milestoneId}-funding`

        set((state) => ({
          paymentHistoryAt: {
            ...state.paymentHistoryAt,
            [historyKey]: now,
          },
          contracts: state.contracts.map((c) => {
            if (c.id !== contractId) return c
            const milestones = c.payment_plan?.milestones.map((m) =>
              m.id === milestoneId ? { ...m, status: "funded" as const } : m,
            )
            const hadFunded = c.payment_plan?.milestones.some(
              (m) => m.status === "funded" || m.status === "released",
            )
            const nextStatus =
              c.status === "pending_payment" && !hadFunded
                ? ("active" as const)
                : c.status
            return {
              ...c,
              status: nextStatus,
              payment_plan: c.payment_plan
                ? { ...c.payment_plan, milestones: milestones ?? [] }
                : null,
            }
          }),
        }))

        return true
      },

      approveMilestone: (contractId, milestoneId, buyerId) => {
        const contract = get().contracts.find((c) => c.id === contractId)
        if (!contract || contract.buyer_actor_id !== buyerId) return false

        const milestone = contract.payment_plan?.milestones.find(
          (m) => m.id === milestoneId,
        )
        if (
          !milestone ||
          !["funded", "submitted", "approved", "in_progress"].includes(milestone.status)
        ) {
          return false
        }

        const now = new Date().toISOString()
        const historyKey = `${contractId}-${milestoneId}-release`

        set((state) => {
          const updatedContracts = state.contracts.map((c) => {
            if (c.id !== contractId) return c
            const milestones = c.payment_plan?.milestones.map((m) =>
              m.id === milestoneId ? { ...m, status: "released" as const } : m,
            )
            const allReleased =
              milestones?.every((m) => m.status === "released") ?? false
            return {
              ...c,
              status: allReleased ? ("completed" as const) : c.status,
              payment_plan: c.payment_plan
                ? { ...c.payment_plan, milestones: milestones ?? [] }
                : null,
            }
          })
          return {
            paymentHistoryAt: {
              ...state.paymentHistoryAt,
              [historyKey]: now,
            },
            contracts: updatedContracts,
          }
        })

        return true
      },

      getPaymentHistory: (contractId) => {
        const contract = get().getContract(contractId)
        if (!contract) return []
        return buildPaymentHistoryFromContract(
          contract,
          get().paymentHistoryAt,
        )
      },

      submitWork: (contractId, input) =>
        set((state) => ({
          contracts: state.contracts.map((contract) => {
            if (contract.id !== contractId) return contract
            if (contract.status === "disputed" || contract.dispute) return contract
            const submission = {
              id: nextSubmissionId(state.contracts),
              contract_id: contractId,
              type: getSubmissionType(contract),
              note: input.note,
              status: "pending" as const,
              submitted_at: new Date().toISOString(),
              file_names: input.fileNames,
              assets: input.assets ?? [],
            }
            const fundedMilestone = contract.payment_plan?.milestones.find(
              (m) => m.status === "funded",
            )
            const milestones = contract.payment_plan?.milestones.map((m) =>
              fundedMilestone && m.id === fundedMilestone.id
                ? { ...m, status: "submitted" as const }
                : m,
            )
            return {
              ...contract,
              submissions: [...contract.submissions, submission],
              status: "delivered" as const,
              payment_plan: contract.payment_plan
                ? { ...contract.payment_plan, milestones: milestones ?? [] }
                : null,
            }
          }),
        })),

      approveSubmission: (contractId, submissionId) => {
        const current = get().contracts.find((c) => c.id === contractId)
        set((state) => ({
          contracts: state.contracts.map((contract) => {
            if (contract.id !== contractId) return contract
            if (contract.status === "disputed" || contract.dispute) return contract
            const milestones = contract.payment_plan?.milestones.map((m) => {
              if (m.status === "funded" || m.status === "submitted") {
                return { ...m, status: "released" as const }
              }
              if (m.status === "pending") return { ...m, status: "awaiting_payment" as const }
              return m
            })
            return {
              ...contract,
              status: "completed" as const,
              payment_plan: contract.payment_plan
                ? { ...contract.payment_plan, milestones: milestones ?? [] }
                : null,
              submissions: contract.submissions.map((submission) =>
                submission.id === submissionId
                  ? { ...submission, status: "accepted" as const }
                  : submission,
              ),
            }
          }),
        }))
        if (current && current.status !== "completed") {
          useNotificationsStore.getState().add({
            type: "contract",
            title: "Проект закрыт",
            body: `Сделка «${current.title}» завершена`,
            href: `/supplier/contracts/${contractId}`,
          })
        }
      },

      rejectSubmission: (contractId, submissionId) =>
        set((state) => ({
          contracts: state.contracts.map((contract) => {
            if (contract.id !== contractId) return contract
            if (contract.status === "disputed" || contract.dispute) return contract
            return {
              ...contract,
              status: "active" as const,
              submissions: contract.submissions.map((submission) =>
                submission.id === submissionId
                  ? { ...submission, status: "rejected" as const }
                  : submission,
              ),
            }
          }),
        })),

      openDispute: (contractId, reason, initiatorId) =>
        set((state) => ({
          contracts: state.contracts.map((contract) => {
            if (contract.id !== contractId) return contract
            const milestones = contract.payment_plan?.milestones.map((milestone) => {
              if (!["funded", "submitted", "in_progress"].includes(milestone.status)) {
                return milestone
              }
              return { ...milestone, status: "disputed" as const }
            })
            const disputeMessage = {
              id: nextMessageId(state.contracts),
              conversation_id: contract.conversation?.id ?? contractId,
              sender_id: initiatorId,
              text: `Открыт спор: ${reason}`,
              attachment: null,
            }
            const now = new Date().toISOString()
            const isBuyer = initiatorId === contract.buyer_actor_id
            return {
              ...contract,
              status: "disputed" as const,
              dispute: {
                id: contractId,
                status: "open" as const,
                opened_by_actor_id: initiatorId,
                buyer_statement: isBuyer ? reason : null,
                supplier_statement: isBuyer ? null : reason,
                admin_instructions: null,
                created_at: now,
                updated_at: now,
                evidence: [],
              },
              payment_plan: contract.payment_plan
                ? { ...contract.payment_plan, milestones: milestones ?? [] }
                : null,
              conversation: contract.conversation
                ? {
                    ...contract.conversation,
                    messages: [...contract.conversation.messages, disputeMessage],
                  }
                : {
                    id: contractId,
                    contract_id: contractId,
                    messages: [disputeMessage],
                  },
            }
          }),
        })),

      addMessage: (contractId, senderId, text, senderName) =>
        set((state) => ({
          contracts: state.contracts.map((contract) => {
            if (contract.id !== contractId) return contract
            const message: Message = {
              id: nextMessageId(state.contracts),
              conversation_id: contract.conversation?.id ?? contractId,
              sender_id: senderId,
              sender_name: senderName?.trim() || undefined,
              text,
              attachment: null,
              created_at: new Date().toISOString(),
              status: "sent",
            }
            return {
              ...contract,
              conversation: contract.conversation
                ? {
                    ...contract.conversation,
                    messages: [...contract.conversation.messages, message],
                  }
                : {
                    id: contractId,
                    contract_id: contractId,
                    messages: [message],
                  },
            }
          }),
        })),

      addFile: (contractId, file, uploader) =>
        set((state) => {
          const fileId = nextFileId(state.contracts)
          return {
            contracts: state.contracts.map((contract) => {
              if (contract.id !== contractId) return contract
              const contractFile: ContractFile = {
                id: fileId,
                contract_id: contractId,
                file_name: file.file_name,
                file_url: file.file_url,
                file_type: file.file_type,
                uploaded_by: uploader.id,
                uploaded_by_name: uploader.name?.trim() || null,
                uploaded_by_side: uploader.side,
                created_at: new Date().toISOString(),
              }
              return { ...contract, files: [...(contract.files ?? []), contractFile] }
            }),
          }
        }),
    }),
    {
      name: "bm-contracts",
      merge: (persisted, current) => {
        if (API_MODE) return current
        return { ...current, ...(persisted as Partial<ContractsState>) }
      },
    },
  ),
)
