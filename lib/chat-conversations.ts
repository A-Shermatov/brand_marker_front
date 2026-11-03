import type {
  ContractWithRelations,
  DirectChatThread,
  Message,
  ProposalMessageThread,
  ProposalStatus,
} from "@/types"

export type InboxLastMessage = {
  id: number
  text: string
  sender_id: number
  sender_name: string
  created_at: string
}

export type InboxProject = {
  key: string
  kind: "contract" | "proposal" | "direct"
  id: number
  title: string
  counterpartId: number
  counterpartName: string
  lastMessage: InboxLastMessage | null
  senderName: string
  unreadCount: number
  href: string
  contract?: ContractWithRelations
  proposalStatus?: ProposalStatus
  rfqId?: string
}

/** @deprecated use InboxProject — kept for gradual migration */
export type ChatConversationItem = InboxProject & {
  contract: ContractWithRelations
}

export type CounterpartChatGroup = {
  counterpartId: number
  counterpartName: string
  projects: InboxProject[]
  lastMessage: InboxLastMessage
  senderName: string
  unreadCount: number
}

const messageSortKey = (message: InboxLastMessage): number => {
  if (message.created_at) {
    const ts = new Date(message.created_at).getTime()
    if (!Number.isNaN(ts)) return ts
  }
  return message.id
}

const projectSortKey = (item: InboxProject): number =>
  item.lastMessage ? messageSortKey(item.lastMessage) : Number.NEGATIVE_INFINITY

export const countUnreadMessages = (
  messages: Message[],
  currentUserId: number,
): number =>
  messages.filter(
    (message) =>
      message.sender_id !== currentUserId && message.status !== "viewed",
  ).length

const toContractProject = (
  contract: ContractWithRelations,
  currentUserId: number,
  counterpartId: number,
  counterpartName: string,
  hrefBase: "customer" | "supplier",
): InboxProject => {
  const messages = contract.conversation?.messages ?? []
  const last = messages[messages.length - 1] ?? null
  const lastMessage: InboxLastMessage | null = last
    ? {
        id: last.id,
        text: last.text,
        sender_id: last.sender_id,
        sender_name: last.sender_name ?? "",
        created_at: last.created_at ?? "",
      }
    : null
  const senderName = !lastMessage
    ? ""
    : lastMessage.sender_id === currentUserId
      ? "Вы"
      : (lastMessage.sender_name?.trim() || counterpartName)
  return {
    key: `contract:${contract.id}`,
    kind: "contract",
    id: contract.id,
    title: contract.title,
    counterpartId,
    counterpartName,
    lastMessage,
    senderName,
    unreadCount: countUnreadMessages(messages, currentUserId),
    href: `/${hrefBase}/contracts/${contract.id}`,
    contract,
  }
}

export const toProposalProject = (
  thread: ProposalMessageThread,
  currentUserId: number,
  hrefBase: "customer" | "supplier",
): InboxProject => {
  const last = thread.last_message
  const lastMessage: InboxLastMessage | null = last
    ? {
        id: last.id,
        text: last.text,
        sender_id: last.sender_id,
        sender_name: last.sender_name ?? "",
        created_at: last.created_at ?? "",
      }
    : null
  const senderName = !lastMessage
    ? ""
    : lastMessage.sender_id === currentUserId
      ? "Вы"
      : (lastMessage.sender_name?.trim() || thread.counterpart_name)
  return {
    key: `proposal:${thread.proposal_id}`,
    kind: "proposal",
    id: thread.proposal_id,
    title: thread.rfq_title,
    counterpartId: thread.counterpart_actor_id,
    counterpartName: thread.counterpart_name,
    lastMessage,
    senderName,
    unreadCount: 0,
    href:
      hrefBase === "customer"
        ? `/customer/rfqs/${thread.rfq_id}/proposals`
        : `/supplier/rfqs/${thread.rfq_id}`,
    proposalStatus: thread.status,
    rfqId: thread.rfq_id,
  }
}

export const buildChatConversations = (
  contracts: ContractWithRelations[],
  currentUserId: number,
  getCounterpartName: (contract: ContractWithRelations) => string,
): InboxProject[] =>
  contracts
    .filter((contract) => (contract.conversation?.messages.length ?? 0) > 0)
    .map((contract) =>
      toContractProject(
        contract,
        currentUserId,
        contract.supplier_actor_id,
        getCounterpartName(contract),
        "customer",
      ),
    )
    .sort((a, b) => projectSortKey(b) - projectSortKey(a))

export const groupChatsByCounterpart = (
  contracts: ContractWithRelations[],
  currentUserId: number,
  getCounterpartId: (contract: ContractWithRelations) => number,
  getCounterpartName: (contract: ContractWithRelations) => string,
  hrefBase: "customer" | "supplier" = "customer",
): CounterpartChatGroup[] => {
  const projects = contracts.map((contract) =>
    toContractProject(
      contract,
      currentUserId,
      getCounterpartId(contract),
      getCounterpartName(contract),
      hrefBase,
    ),
  )
  return groupInboxProjects(projects)
}

export const groupInboxProjects = (projects: InboxProject[]): CounterpartChatGroup[] => {
  const byCounterpart = new Map<number, InboxProject[]>()
  projects.forEach((project) => {
    const items = byCounterpart.get(project.counterpartId) ?? []
    items.push(project)
    byCounterpart.set(project.counterpartId, items)
  })

  const groups: CounterpartChatGroup[] = []
  byCounterpart.forEach((items, counterpartId) => {
    // Hide empty contract chats; keep proposal/direct threads (incl. deep-linked empty ones)
    const visible = items.filter(
      (project) =>
        project.kind === "proposal" ||
        project.kind === "direct" ||
        Boolean(project.lastMessage),
    )
    if (visible.length === 0) return

    const sorted = [...visible].sort((a, b) => projectSortKey(b) - projectSortKey(a))
    const latest = sorted.find((project) => project.lastMessage) ?? sorted[0]
    if (!latest) return

    groups.push({
      counterpartId,
      counterpartName: latest.counterpartName,
      projects: sorted,
      lastMessage: latest.lastMessage ?? {
        id: 0,
        text: "Начните обсуждение",
        sender_id: 0,
        sender_name: "",
        created_at: "",
      },
      senderName: latest.senderName,
      unreadCount: sorted.reduce((sum, project) => sum + project.unreadCount, 0),
    })
  })

  return groups.sort((a, b) => {
    if (!a.lastMessage.created_at && !b.lastMessage.created_at) return 0
    if (!a.lastMessage.created_at) return 1
    if (!b.lastMessage.created_at) return -1
    return messageSortKey(b.lastMessage) - messageSortKey(a.lastMessage)
  })
}

export const toDirectProject = (
  thread: DirectChatThread,
  currentUserId: number,
  hrefBase: "customer" | "supplier",
): InboxProject => {
  const last = thread.last_message
  const lastMessage: InboxLastMessage | null = last
    ? {
        id: last.id,
        text: last.text,
        sender_id: last.sender_id,
        sender_name: last.sender_name ?? "",
        created_at: last.created_at ?? "",
      }
    : null
  const senderName = !lastMessage
    ? ""
    : lastMessage.sender_id === currentUserId
      ? "Вы"
      : (lastMessage.sender_name?.trim() || thread.counterpart_name)
  return {
    key: `direct:${thread.id}`,
    kind: "direct",
    id: thread.id,
    title: "Личные сообщения",
    counterpartId: thread.counterpart_actor_id,
    counterpartName: thread.counterpart_name,
    lastMessage,
    senderName,
    unreadCount: thread.unread_count,
    href:
      hrefBase === "customer"
        ? `/customer/messages?supplier=${thread.supplier_actor_id}`
        : `/supplier/messages?buyer=${thread.buyer_actor_id}`,
  }
}

export const mergeContractAndProposalChats = (
  contracts: ContractWithRelations[],
  threads: ProposalMessageThread[],
  currentUserId: number,
  getCounterpartId: (contract: ContractWithRelations) => number,
  getCounterpartName: (contract: ContractWithRelations) => string,
  hrefBase: "customer" | "supplier",
  directs: DirectChatThread[] = [],
): CounterpartChatGroup[] => {
  const contractProjects = contracts.map((contract) =>
    toContractProject(
      contract,
      currentUserId,
      getCounterpartId(contract),
      getCounterpartName(contract),
      hrefBase,
    ),
  )
  const proposalProjects = threads.map((thread) =>
    toProposalProject(thread, currentUserId, hrefBase),
  )
  const directProjects = directs.map((thread) =>
    toDirectProject(thread, currentUserId, hrefBase),
  )
  return groupInboxProjects([...contractProjects, ...proposalProjects, ...directProjects])
}

export const pickDefaultProject = (
  group: CounterpartChatGroup,
): InboxProject | undefined =>
  group.projects.find((project) => project.unreadCount > 0) ??
  group.projects.find((project) => project.lastMessage) ??
  group.projects[0]

export const filterChatGroups = (
  groups: CounterpartChatGroup[],
  query: string,
): CounterpartChatGroup[] => {
  const q = query.trim().toLowerCase()
  if (!q) return groups
  return groups.filter((group) => {
    const haystack = [
      group.counterpartName,
      ...group.projects.map((project) => project.title),
      group.senderName,
      group.lastMessage.text,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })
}
