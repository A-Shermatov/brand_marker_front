import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Proposal, ProposalAcceptInput, ProposalCreate, ProposalMessage, ProposalStatus } from "@/types"
import { mockProposals } from "@/lib/mock/proposals"
import { API_MODE } from "@/lib/api/config"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useNotificationsStore } from "@/lib/store/notifications-store"

export type IncomingProposalItem = {
  proposal: Proposal
  rfqId: string
  rfqTitle: string
}

interface ProposalsState {
  proposals: Proposal[]
  proposalMessages: Record<number, ProposalMessage[]>
  hasProposal: (rfqId: string, actorId: number) => boolean
  getProposalForRfq: (rfqId: string, actorId: number) => Proposal | undefined
  getProposalsBySupplier: (actorId: number) => Proposal[]
  getProposalsForRfq: (rfqId: string) => Proposal[]
  getIncomingProposalsForBuyer: (
    actorId: number,
    getRfqTitle: (rfqId: string) => string,
    getRfqActorId: (rfqId: string) => string | undefined,
  ) => IncomingProposalItem[]
  getNewProposalsCountForBuyer: (
    actorId: number,
    getRfqActorId: (rfqId: string) => string | undefined,
  ) => number
  getProposalMessages: (proposalId: number) => ProposalMessage[]
  addProposalMessage: (input: {
    proposalId: number
    senderId: number
    senderName: string
    text: string
    side: "buyer" | "supplier"
  }) => ProposalMessage
  updateProposalStatus: (id: number, status: ProposalStatus) => void
  patchProposal: (
    id: number,
    patch: Partial<Pick<Proposal, "price" | "currency" | "delivery_time" | "message" | "status">>,
  ) => void
  submitProposal: (input: ProposalCreate) => Proposal
  acceptProposal: (
    proposalId: number,
    rfqId: string,
    buyerActorId: number,
    terms: ProposalAcceptInput,
  ) => number
}

const nextProposalId = (proposals: Proposal[]): number =>
  proposals.reduce((max, p) => Math.max(max, p.id), 0) + 1

const nextMessageId = (messages: Record<number, ProposalMessage[]>): number => {
  let maxId = 0
  for (const list of Object.values(messages)) {
    for (const message of list) {
      if (message.id > maxId) maxId = message.id
    }
  }
  return maxId + 1
}

export const useProposalsStore = create<ProposalsState>()(
  persist(
    (set, get) => ({
      proposals: API_MODE ? [] : mockProposals,
      proposalMessages: {},

      hasProposal: (rfqId, actorId) =>
        get().proposals.some(
          (p) => p.rfq_id === rfqId && p.supplier_actor_id === actorId,
        ),

      getProposalForRfq: (rfqId, actorId) =>
        get().proposals.find(
          (p) => p.rfq_id === rfqId && p.supplier_actor_id === actorId,
        ),

      getProposalsBySupplier: (actorId) =>
        get()
          .proposals.filter(
            (p) => p.supplier_actor_id === actorId && p.status !== "accepted",
          )
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),

      getProposalsForRfq: (rfqId) =>
        get().proposals
          .filter((p) => p.rfq_id === rfqId)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),

      getIncomingProposalsForBuyer: (actorId, getRfqTitle, getRfqActorId) =>
        get()
          .proposals.filter((p) => {
            const ownerId = getRfqActorId(p.rfq_id)
            return ownerId === String(actorId) && p.status === "submitted"
          })
          .map((proposal) => ({
            proposal,
            rfqId: proposal.rfq_id,
            rfqTitle: getRfqTitle(proposal.rfq_id),
          }))
          .sort(
            (a, b) =>
              new Date(b.proposal.created_at).getTime() -
              new Date(a.proposal.created_at).getTime(),
          ),

      getNewProposalsCountForBuyer: (actorId, getRfqActorId) =>
        get().proposals.filter((p) => {
          const ownerId = getRfqActorId(p.rfq_id)
          return ownerId === String(actorId) && p.status === "submitted"
        }).length,

      getProposalMessages: (proposalId) =>
        (get().proposalMessages[proposalId] ?? []).slice(),

      addProposalMessage: ({ proposalId, senderId, senderName, text, side }) => {
        const message: ProposalMessage = {
          id: nextMessageId(get().proposalMessages),
          proposal_id: proposalId,
          sender_id: senderId,
          sender_name: senderName,
          text,
          created_at: new Date().toISOString(),
        }
        set((state) => ({
          proposalMessages: {
            ...state.proposalMessages,
            [proposalId]: [...(state.proposalMessages[proposalId] ?? []), message],
          },
        }))
        const proposal = get().proposals.find((p) => p.id === proposalId)
        const rfq = proposal
          ? useRfqsStore.getState().getRfqWithRelations(proposal.rfq_id)
          : undefined
        if (rfq) {
          useNotificationsStore.getState().add({
            type: "proposal",
            title: "Новое сообщение по предложению",
            body: `Обсуждение заявки «${rfq.title}»`,
            href:
              side === "buyer"
                ? `/supplier/rfqs/${rfq.id}`
                : `/customer/rfqs/${rfq.id}`,
          })
        }
        return message
      },

      updateProposalStatus: (id, status) =>
        set((state) => ({
          proposals: state.proposals.map((p) =>
            p.id === id ? { ...p, status } : p,
          ),
        })),

      patchProposal: (id, patch) =>
        set((state) => ({
          proposals: state.proposals.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),

      submitProposal: (input) => {
        const proposal: Proposal = {
          ...input,
          id: nextProposalId(get().proposals),
          status: input.status ?? "submitted",
          created_at: new Date().toISOString(),
        }
        set((state) => ({ proposals: [proposal, ...state.proposals] }))
        const rfq = useRfqsStore.getState().getRfqWithRelations(input.rfq_id)
        if (rfq) {
          useNotificationsStore.getState().add({
            type: "proposal",
            title: "Новое предложение",
            body: `Поставщик отправил предложение на заявку «${rfq.title}»`,
            href: `/customer/rfqs/${rfq.id}`,
          })
        }
        return proposal
      },

      acceptProposal: (proposalId, rfqId, buyerActorId, terms) => {
        const proposal = get().proposals.find((p) => p.id === proposalId)
        const rfq = useRfqsStore.getState().getRfqWithRelations(rfqId)
        if (!proposal || !rfq) return 0

        const contractId = useContractsStore.getState().createContractFromProposal({
          rfq_id: rfqId,
          proposal_id: proposalId,
          buyer_actor_id: buyerActorId,
          supplier_actor_id: proposal.supplier_actor_id,
          title: rfq.title,
          description: rfq.description,
          agreed_amount: proposal.price,
          currency: proposal.currency,
          payment_type: terms.payment_type,
          milestones: terms.milestones,
          delivery_time: proposal.delivery_time,
          files: rfq.attachments.map((attachment) => ({
            file_name: attachment.file_name,
            file_url: attachment.file_url,
            file_type: attachment.file_type,
          })),
        })

        set((state) => ({
          proposals: state.proposals
            .filter((p) => p.id !== proposalId)
            .map((p) => {
              if (p.rfq_id !== rfqId) return p
              if (!["rejected", "withdrawn", "archived"].includes(p.status)) {
                return { ...p, status: "archived" as ProposalStatus }
              }
              return p
            }),
        }))

        useRfqsStore.getState().updateRfqStatus(rfqId, "contract_created")

        useNotificationsStore.getState().add({
          type: "contract",
          title: "Предложение принято",
          body: `Покупатель принял ваше предложение на заявку «${rfq.title}»`,
          href: `/supplier/contracts/${contractId}`,
        })

        return contractId
      },
    }),
    {
      name: "bm-proposals",
      merge: (persisted, current) => {
        if (API_MODE) return current
        const stored = persisted as Partial<ProposalsState> | undefined
        return {
          ...current,
          ...stored,
          proposalMessages: stored?.proposalMessages ?? current.proposalMessages,
        }
      },
    },
  ),
)
