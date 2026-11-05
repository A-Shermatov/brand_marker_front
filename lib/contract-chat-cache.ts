import type { QueryClient } from "@tanstack/react-query"
import type { Page } from "@/lib/pagination"
import type { ContractWithRelations, Message } from "@/types"

const detailKeysFor = (contractId: number) => [
  ["contracts", "detail", contractId] as const,
  ["supplier-contracts", "detail", contractId] as const,
]

const listQueryFilters = [
  { queryKey: ["contracts", "list"] as const },
  { queryKey: ["supplier-contracts", "list"] as const },
]

const mapListPage = (
  queryClient: QueryClient,
  updater: (items: ContractWithRelations[]) => ContractWithRelations[],
) => {
  for (const filter of listQueryFilters) {
    queryClient.setQueriesData<Page<ContractWithRelations>>(filter, (page) => {
      if (!page) return page
      return { ...page, items: updater(page.items) }
    })
  }
}

const normalizeIncomingMessage = (
  contractId: number,
  raw: Partial<Message> & { id: number; sender_id: number; text: string },
): Message => ({
  id: raw.id,
  conversation_id: raw.conversation_id ?? contractId,
  sender_id: raw.sender_id,
  sender_name: raw.sender_name,
  sender_role: raw.sender_role ?? null,
  sender_company: raw.sender_company ?? null,
  text: raw.text,
  attachment: raw.attachment ?? null,
  created_at: raw.created_at,
  status: raw.status ?? "sent",
  delivered_at: raw.delivered_at ?? null,
  viewed_at: raw.viewed_at ?? null,
})

const mergeMessages = (cached: Message[], incoming: Message[]): Message[] => {
  const byId = new Map<number, Message>()
  for (const message of cached) {
    byId.set(message.id, message)
  }
  for (const message of incoming) {
    const existing = byId.get(message.id)
    byId.set(message.id, existing ? { ...existing, ...message } : message)
  }
  return [...byId.values()].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
    if (aTime !== bTime) return aTime - bTime
    return a.id - b.id
  })
}

const mergeContractMessages = (
  current: ContractWithRelations | undefined,
  incoming: ContractWithRelations,
): ContractWithRelations => {
  if (!current?.conversation && !incoming.conversation) return incoming
  const cachedMessages = current?.conversation?.messages ?? []
  const incomingMessages = incoming.conversation?.messages ?? []
  return {
    ...incoming,
    conversation: {
      id: incoming.conversation?.id ?? current?.conversation?.id ?? incoming.id,
      contract_id:
        incoming.conversation?.contract_id ??
        current?.conversation?.contract_id ??
        incoming.id,
      messages: mergeMessages(cachedMessages, incomingMessages),
    },
  }
}

const patchContractMessages = (
  contract: ContractWithRelations,
  updater: (messages: Message[]) => Message[],
): ContractWithRelations => {
  if (!contract.conversation) {
    return {
      ...contract,
      conversation: {
        id: contract.id,
        contract_id: contract.id,
        messages: updater([]),
      },
    }
  }
  return {
    ...contract,
    conversation: {
      ...contract.conversation,
      messages: updater(contract.conversation.messages ?? []),
    },
  }
}

export const appendContractMessageToCache = (
  queryClient: QueryClient,
  contractId: number,
  rawMessage: Partial<Message> & { id: number; sender_id: number; text: string },
) => {
  const message = normalizeIncomingMessage(contractId, rawMessage)
  for (const key of detailKeysFor(contractId)) {
    queryClient.setQueryData<ContractWithRelations>(key, (current) => {
      if (!current) return current
      return patchContractMessages(current, (messages) => {
        if (messages.some((m) => m.id === message.id)) {
          return messages.map((m) => (m.id === message.id ? { ...m, ...message } : m))
        }
        return [...messages, message]
      })
    })
  }
  mapListPage(queryClient, (list) =>
    list.map((contract) => {
      if (contract.id !== contractId) return contract
      return patchContractMessages(contract, (messages) => {
        if (messages.some((m) => m.id === message.id)) {
          return messages.map((m) => (m.id === message.id ? { ...m, ...message } : m))
        }
        return [...messages, message]
      })
    }),
  )
}

export const markIncomingMessagesViewedInCache = (
  queryClient: QueryClient,
  contractId: number,
  currentUserId: number,
  viewedAt = new Date().toISOString(),
) => {
  if (currentUserId <= 0) return
  const markViewed = (messages: Message[]) =>
    messages.map((message) => {
      if (message.sender_id === currentUserId || message.status === "viewed") {
        return message
      }
      return {
        ...message,
        status: "viewed" as const,
        viewed_at: message.viewed_at ?? viewedAt,
        delivered_at: message.delivered_at ?? viewedAt,
      }
    })

  for (const key of detailKeysFor(contractId)) {
    queryClient.setQueryData<ContractWithRelations>(key, (current) => {
      if (!current?.conversation) return current
      return patchContractMessages(current, markViewed)
    })
  }

  mapListPage(queryClient, (list) =>
    list.map((contract) => {
      if (contract.id !== contractId || !contract.conversation) return contract
      return patchContractMessages(contract, markViewed)
    }),
  )
}

export const updateContractMessageStatusInCache = (
  queryClient: QueryClient,
  contractId: number,
  updates: Array<Partial<Message> & { id: number }>,
) => {
  if (updates.length === 0) return
  const byId = new Map(updates.map((item) => [item.id, item]))

  for (const key of detailKeysFor(contractId)) {
    queryClient.setQueryData<ContractWithRelations>(key, (current) => {
      if (!current?.conversation) return current
      return patchContractMessages(current, (messages) =>
        messages.map((message) => {
          const patch = byId.get(message.id)
          return patch ? { ...message, ...patch } : message
        }),
      )
    })
  }

  mapListPage(queryClient, (list) =>
    list.map((contract) => {
      if (contract.id !== contractId || !contract.conversation) return contract
      return patchContractMessages(contract, (messages) =>
        messages.map((message) => {
          const patch = byId.get(message.id)
          return patch ? { ...message, ...patch } : message
        }),
      )
    }),
  )
}

export const replaceContractInCache = (
  queryClient: QueryClient,
  contract: ContractWithRelations,
) => {
  for (const key of detailKeysFor(contract.id)) {
    queryClient.setQueryData<ContractWithRelations>(key, (current) =>
      mergeContractMessages(current, contract),
    )
  }
  mapListPage(queryClient, (list) =>
    list.map((item) =>
      item.id === contract.id ? mergeContractMessages(item, contract) : item,
    ),
  )
}
