"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { getRfqBuyerName } from "@/lib/buyer-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useMarkMessagesReadMutation,
  useSupplierContractsQuery,
  useSupplierSendMessageMutation,
} from "@/hooks/api/use-contracts-query"
import {
  useProposalMessageThreadQuery,
  useProposalMessageThreadsQuery,
} from "@/hooks/api/use-proposals-query"
import {
  useDirectChatsQuery,
  useOpenDirectChatMutation,
} from "@/hooks/api/use-direct-chats-query"
import { ContractMessagesPanel } from "@/components/supplier/contracts/contract-messages-panel"
import { DirectMessagesPanel } from "@/components/contracts/direct-messages-panel"
import { ProposalMessagesPanel } from "@/components/cabinet/rfq/proposal-messages-panel"
import { MessagesWorkspace } from "@/components/chat/messages-workspace"
import {
  mergeContractAndProposalChats,
  pickDefaultProject,
  toProposalProject,
  type InboxProject,
} from "@/lib/chat-conversations"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import type { ContractWithRelations, DirectChatThread, ProposalMessageThread } from "@/types"

export default function SupplierMessagesPage() {
  const hydrated = useHydrated()
  const searchParams = useSearchParams()
  const proposalParam = Number(searchParams.get("proposal") || 0)
  const buyerParam = Number(searchParams.get("buyer") || 0)
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const userId = user?.userId ?? 0
  const useApi = isApiEnabled()

  const getContractsForSupplier = useContractsStore((s) => s.getContractsForSupplier)
  const markConversationRead = useContractsStore((s) => s.markConversationRead)
  const addMessageLocal = useContractsStore((s) => s.addMessage)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const localProposals = useProposalsStore((s) => s.proposals)
  const proposalMessages = useProposalsStore((s) => s.proposalMessages)
  const getRfq = useRfqsStore((s) => s.getRfq)
  const [selectedCounterpartId, setSelectedCounterpartId] = useState<number | null>(null)
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null)

  const { data: apiContracts, isLoading } = useSupplierContractsQuery(hydrated && useApi)
  const { data: apiThreads } = useProposalMessageThreadsQuery("supplier", hydrated && useApi)
  const { data: deepThread } = useProposalMessageThreadQuery(
    proposalParam,
    "supplier",
    hydrated && useApi && proposalParam > 0,
  )
  const sendMessageMutation = useSupplierSendMessageMutation()
  const markMessagesReadMutation = useMarkMessagesReadMutation("supplier")
  const { data: apiDirectChats } = useDirectChatsQuery("supplier", hydrated && useApi)
  const openDirectChat = useOpenDirectChatMutation("supplier")
  const openedBuyerRef = useRef<number | null>(null)

  const getBuyerName = (buyerId: number) =>
    getCompany(buyerId)?.title ?? `Заказчик #${buyerId}`

  const contracts = useApi
    ? ((apiContracts?.items ?? []) as ContractWithRelations[])
    : hydrated
      ? getContractsForSupplier(actorId)
      : []

  const localThreads: ProposalMessageThread[] = useMemo(() => {
    if (useApi || !hydrated) return []
    return localProposals
      .filter(
        (proposal) =>
          proposal.supplier_actor_id === actorId &&
          (proposalMessages[proposal.id]?.length ?? 0) > 0,
      )
      .map((proposal) => {
        const messages = proposalMessages[proposal.id] ?? []
        const last = messages[messages.length - 1]
        const rfq = getRfq(proposal.rfq_id)
        const buyerName = rfq
          ? getRfqBuyerName(rfq, getCompany)
          : getBuyerName(0)
        return {
          proposal_id: proposal.id,
          rfq_id: proposal.rfq_id,
          rfq_title: rfq?.title ?? proposal.rfq_id,
          status: proposal.status,
          counterpart_actor_id: Number(rfq?.actor_id ?? 0),
          counterpart_name: buyerName,
          message_count: messages.length,
          last_message: last
            ? {
                id: last.id,
                text: last.text,
                sender_id: last.sender_id,
                sender_name: last.sender_name,
                created_at: last.created_at,
              }
            : null,
        }
      })
  }, [
    useApi,
    hydrated,
    localProposals,
    proposalMessages,
    actorId,
    getRfq,
    getCompany,
  ])

  const threads = useMemo(() => {
    const base = useApi ? (apiThreads ?? []) : localThreads
    if (useApi) {
      if (!deepThread) return base
      if (base.some((thread) => thread.proposal_id === deepThread.proposal_id)) return base
      return [deepThread, ...base]
    }
    if (proposalParam <= 0) return base
    if (base.some((thread) => thread.proposal_id === proposalParam)) return base
    const proposal = localProposals.find((p) => p.id === proposalParam)
    if (!proposal) return base
    const rfq = getRfq(proposal.rfq_id)
    return [
      {
        proposal_id: proposal.id,
        rfq_id: proposal.rfq_id,
        rfq_title: rfq?.title ?? proposal.rfq_id,
        status: proposal.status,
        counterpart_actor_id: Number(rfq?.actor_id ?? 0),
        counterpart_name: rfq ? getRfqBuyerName(rfq, getCompany) : "Заказчик",
        message_count: proposalMessages[proposal.id]?.length ?? 0,
        last_message: null,
      },
      ...base,
    ]
  }, [
    useApi,
    apiThreads,
    localThreads,
    deepThread,
    proposalParam,
    localProposals,
    getRfq,
    getCompany,
    proposalMessages,
  ])

  const directs: DirectChatThread[] = useMemo(() => {
    const base = useApi ? (apiDirectChats ?? []) : []
    const extra = openDirectChat.data
    if (!extra) return base
    if (base.some((thread) => thread.id === extra.id)) return base
    return [extra, ...base]
  }, [useApi, apiDirectChats, openDirectChat.data])

  const groups = useMemo(
    () =>
      mergeContractAndProposalChats(
        contracts,
        threads,
        userId,
        (contract) => contract.buyer_actor_id,
        (contract) => getBuyerName(contract.buyer_actor_id),
        "supplier",
        directs,
      ),
    [contracts, threads, userId, getCompany, directs],
  )

  useEffect(() => {
    if (!useApi || buyerParam <= 0) return
    const existing = directs.find((thread) => thread.counterpart_actor_id === buyerParam)
    if (existing) {
      setSelectedCounterpartId(existing.counterpart_actor_id)
      setSelectedProjectKey(`direct:${existing.id}`)
      return
    }
    if (openedBuyerRef.current === buyerParam) return
    openedBuyerRef.current = buyerParam
    openDirectChat.mutate(buyerParam, {
      onSuccess: (thread) => {
        setSelectedCounterpartId(thread.counterpart_actor_id)
        setSelectedProjectKey(`direct:${thread.id}`)
      },
      onError: () => {
        openedBuyerRef.current = null
      },
    })
  }, [useApi, buyerParam, directs, openDirectChat])

  useEffect(() => {
    if (proposalParam > 0) {
      const key = `proposal:${proposalParam}`
      const group = groups.find((g) => g.projects.some((p) => p.key === key))
      if (group) {
        setSelectedCounterpartId(group.counterpartId)
        setSelectedProjectKey(key)
        return
      }
      if (deepThread) {
        const project = toProposalProject(deepThread, userId, "supplier")
        setSelectedCounterpartId(project.counterpartId)
        setSelectedProjectKey(project.key)
      }
      return
    }
    // Without a link to a particular chat, open the latest conversation.
    if (buyerParam <= 0 && selectedCounterpartId == null && groups[0]) {
      const project = pickDefaultProject(groups[0])
      setSelectedCounterpartId(groups[0].counterpartId)
      setSelectedProjectKey(project?.key ?? null)
    }
  }, [proposalParam, buyerParam, groups, deepThread, userId, selectedCounterpartId])

  const selectedGroup = groups.find((g) => g.counterpartId === selectedCounterpartId)
  const selected: InboxProject | undefined = selectedGroup
    ? (selectedGroup.projects.find((p) => p.key === selectedProjectKey) ??
      pickDefaultProject(selectedGroup))
    : undefined

  const handleSelectProject = (projectKey: string) => {
    setSelectedProjectKey(projectKey)
    const project =
      selectedGroup?.projects.find((p) => p.key === projectKey) ??
      groups.flatMap((group) => group.projects).find((p) => p.key === projectKey)
    if (project?.kind === "contract" && !useApi) {
      markConversationRead(project.id, userId)
    }
  }

  const handleSelectCounterpart = (counterpartId: number) => {
    setSelectedCounterpartId(counterpartId)
    const group = groups.find((g) => g.counterpartId === counterpartId)
    const project = group ? pickDefaultProject(group) : undefined
    if (project) handleSelectProject(project.key)
  }

  if (useApi && (isLoading || (buyerParam > 0 && openDirectChat.isPending && groups.length === 0))) {
    return (
      <PageFrame className="animate-pulse">
        <div className="mb-6 h-10 w-1/3 rounded bg-secondary" />
        <div className="h-64 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Сообщения"
        description="Переписка с заказчиками по заявкам, сделкам и личным сообщениям"
      />

      {groups.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<MessageSquare size={32} />}
            title="Сообщений пока нет"
            description="Чат появится, когда заказчик напишет вам, вы обсудите предложение или начнётся сделка"
          />
        </PageSurface>
      ) : (
        <MessagesWorkspace
          groups={groups}
          selectedGroup={selectedGroup}
          selected={selected}
          onSelectCounterpart={handleSelectCounterpart}
          onSelectProject={handleSelectProject}
          searchPlaceholder="Поиск по заказчику или проекту"
          renderChat={(slot) =>
            !selected ? null : selected.kind === "proposal" ? (
              <ProposalMessagesPanel
                key={selected.key}
                proposalId={selected.id}
                proposalStatus={selected.proposalStatus ?? "submitted"}
                side="supplier"
                peerName={selected.counterpartName}
                peerAvatar={selectedGroup?.avatarUrl}
                subject={selected.title}
                {...slot}
              />
            ) : selected.kind === "direct" ? (
              <DirectMessagesPanel
                key={selected.key}
                chatId={selected.id}
                role="supplier"
                currentUserId={userId}
                counterpartName={selected.counterpartName}
                counterpartAvatar={selectedGroup?.avatarUrl}
                {...slot}
              />
            ) : selected.contract ? (
              <ContractMessagesPanel
                key={selected.key}
                contract={selected.contract}
                currentUserId={userId}
                counterpartName={selected.counterpartName}
                counterpartAvatar={selectedGroup?.avatarUrl}
                {...slot}
                onSendMessage={(text) => {
                  if (useApi) {
                    sendMessageMutation.mutate({ contractId: selected.contract!.id, text })
                    return
                  }
                  addMessageLocal(selected.contract!.id, userId, text, user?.name)
                }}
                onMarkRead={(id) => {
                  if (useApi) markMessagesReadMutation.mutate(id)
                  else markConversationRead(id, userId)
                }}
              />
            ) : null
          }
        />
      )}
    </PageFrame>
  )
}
