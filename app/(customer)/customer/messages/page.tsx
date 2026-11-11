"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useContractsQuery,
  useMarkMessagesReadMutation,
  useSendMessageMutation,
} from "@/hooks/api/use-contracts-query"
import {
  useProposalMessageThreadQuery,
  useProposalMessageThreadsQuery,
} from "@/hooks/api/use-proposals-query"
import { useSupplierActorName } from "@/hooks/api/use-supplier-name"
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
import { createRfqHref } from "@/lib/create-rfq-href"
import type { ContractWithRelations, DirectChatThread, ProposalMessageThread } from "@/types"

export default function BuyerMessagesPage() {
  const hydrated = useHydrated()
  const searchParams = useSearchParams()
  const proposalParam = Number(searchParams.get("proposal") || 0)
  const supplierParam = Number(
    searchParams.get("supplier") || searchParams.get("counterpart") || 0,
  )
  const counterpartParam = supplierParam
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const userId = user?.userId ?? 0
  const useApi = isApiEnabled()

  const getContractsForBuyer = useContractsStore((s) => s.getContractsForBuyer)
  const markConversationRead = useContractsStore((s) => s.markConversationRead)
  const addMessageLocal = useContractsStore((s) => s.addMessage)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const localProposals = useProposalsStore((s) => s.proposals)
  const proposalMessages = useProposalsStore((s) => s.proposalMessages)
  const getRfq = useRfqsStore((s) => s.getRfq)
  const [selectedCounterpartId, setSelectedCounterpartId] = useState<number | null>(null)
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null)

  const { data: apiContracts, isLoading } = useContractsQuery(hydrated && useApi)
  const { data: apiThreads } = useProposalMessageThreadsQuery("buyer", hydrated && useApi)
  const { data: deepThread } = useProposalMessageThreadQuery(
    proposalParam,
    "buyer",
    hydrated && useApi && proposalParam > 0,
  )
  const sendMessageMutation = useSendMessageMutation()
  const markMessagesReadMutation = useMarkMessagesReadMutation("buyer")
  const { data: apiDirectChats } = useDirectChatsQuery("buyer", hydrated && useApi)
  const openDirectChat = useOpenDirectChatMutation("buyer")
  const openedSupplierRef = useRef<number | null>(null)

  const contracts = useApi
    ? ((apiContracts?.items ?? []) as ContractWithRelations[])
    : hydrated
      ? getContractsForBuyer(actorId)
      : []

  const supplierIds = contracts.map((c) => c.supplier_actor_id)
  const resolveSupplierName = useSupplierActorName(supplierIds)

  const getSupplierName = (supplierId: number) => {
    if (useApi) return resolveSupplierName(supplierId)
    return getCompany(supplierId)?.title ?? `Поставщик #${supplierId}`
  }

  const localThreads: ProposalMessageThread[] = useMemo(() => {
    if (useApi || !hydrated) return []
    return localProposals
      .filter((proposal) => (proposalMessages[proposal.id]?.length ?? 0) > 0)
      .map((proposal) => {
        const messages = proposalMessages[proposal.id] ?? []
        const last = messages[messages.length - 1]
        const rfq = getRfq(proposal.rfq_id)
        return {
          proposal_id: proposal.id,
          rfq_id: proposal.rfq_id,
          rfq_title: rfq?.title ?? proposal.rfq_id,
          status: proposal.status,
          counterpart_actor_id: proposal.supplier_actor_id,
          counterpart_name: getSupplierName(proposal.supplier_actor_id),
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
  }, [useApi, hydrated, localProposals, proposalMessages, getRfq, getCompany])

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
        counterpart_actor_id: proposal.supplier_actor_id,
        counterpart_name: getSupplierName(proposal.supplier_actor_id),
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
        (contract) => contract.supplier_actor_id,
        (contract) => getSupplierName(contract.supplier_actor_id),
        "customer",
        directs,
      ),
    [contracts, threads, userId, useApi, resolveSupplierName, directs],
  )

  useEffect(() => {
    if (!useApi || supplierParam <= 0) return
    const existing = directs.find((thread) => thread.counterpart_actor_id === supplierParam)
    if (existing) {
      setSelectedCounterpartId(existing.counterpart_actor_id)
      setSelectedProjectKey(`direct:${existing.id}`)
      return
    }
    if (openedSupplierRef.current === supplierParam) return
    openedSupplierRef.current = supplierParam
    openDirectChat.mutate(supplierParam, {
      onSuccess: (thread) => {
        setSelectedCounterpartId(thread.counterpart_actor_id)
        setSelectedProjectKey(`direct:${thread.id}`)
      },
      onError: () => {
        openedSupplierRef.current = null
      },
    })
  }, [useApi, supplierParam, directs, openDirectChat])

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
        const project = toProposalProject(deepThread, userId, "customer")
        setSelectedCounterpartId(project.counterpartId)
        setSelectedProjectKey(project.key)
      }
      return
    }
    if (counterpartParam > 0) {
      const group = groups.find((g) => g.counterpartId === counterpartParam)
      if (group) {
        const project = pickDefaultProject(group)
        setSelectedCounterpartId(group.counterpartId)
        setSelectedProjectKey(project?.key ?? null)
      }
      return
    }
    if (selectedCounterpartId == null && groups[0]) {
      const project = pickDefaultProject(groups[0])
      setSelectedCounterpartId(groups[0].counterpartId)
      setSelectedProjectKey(project?.key ?? null)
    }
  }, [proposalParam, counterpartParam, groups, deepThread, userId, selectedCounterpartId])

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

  if (useApi && (isLoading || (supplierParam > 0 && openDirectChat.isPending && groups.length === 0))) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-10 w-1/3 rounded-xl bg-secondary" />
        <div className="h-64 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Сообщения"
        description="Переписка с поставщиками по заявкам, сделкам и личным сообщениям"
      />

      {groups.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<MessageSquare size={32} />}
            title="Сообщений пока нет"
            description={
              counterpartParam > 0
                ? "С этим поставщиком ещё нет переписки. Создайте заявку — чат откроется после предложения или сделки."
                : "Чат появится, когда вы напишете поставщику, обсудите его предложение или начнётся сделка."
            }
            action={
              counterpartParam > 0 ? undefined : (
                <Button asChild variant="outline">
                  <Link href="/customer/suppliers">Найти поставщика</Link>
                </Button>
              )
            }
          />
          {counterpartParam > 0 ? (
            <div className="mt-4 flex justify-center">
              <Link
                href={createRfqHref({
                  supplierId: counterpartParam,
                  performer: counterpartParam,
                })}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Создать заявку для поставщика
              </Link>
            </div>
          ) : null}
        </PageSurface>
      ) : (
        <MessagesWorkspace
          profileHref={(actorId) => `/customer/suppliers/${actorId}`}
          groups={groups}
          selectedGroup={selectedGroup}
          selected={selected}
          onSelectCounterpart={handleSelectCounterpart}
          onSelectProject={handleSelectProject}
          searchPlaceholder="Поиск по поставщику или проекту"
          noChat={
            counterpartParam > 0 && !groups.some((g) => g.counterpartId === counterpartParam) ? (
              <PageSurface className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  С этим поставщиком ещё нет переписки. Создайте заявку — чат откроется после
                  предложения или сделки.
                </p>
                <Link
                  href={createRfqHref({ supplierId: counterpartParam, performer: counterpartParam })}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Создать заявку для поставщика
                </Link>
              </PageSurface>
            ) : undefined
          }
          renderChat={(slot) =>
            !selected ? null : selected.kind === "proposal" ? (
              <ProposalMessagesPanel
                key={selected.key}
                proposalId={selected.id}
                proposalStatus={selected.proposalStatus ?? "submitted"}
                side="buyer"
                peerName={selected.counterpartName}
                peerAvatar={selectedGroup?.avatarUrl}
                subject={selected.title}
                {...slot}
              />
            ) : selected.kind === "direct" ? (
              <DirectMessagesPanel
                key={selected.key}
                chatId={selected.id}
                role="buyer"
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
