"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, ArrowSquareOutIcon, ChatsCircleIcon } from "@phosphor-icons/react/dist/ssr"
import { ChatProjectSwitcher } from "@/components/contracts/chat-project-switcher"
import { ConversationsSidebar } from "@/components/contracts/conversations-sidebar"
import { Button } from "@/components/ui/button"
import type { CounterpartChatGroup, InboxProject } from "@/lib/chat-conversations"
import { cn } from "@/lib/utils"

export type ChatSlot = {
  headerActions: ReactNode
  headerChildren: ReactNode
  className: string
}

/**
 * The messages screen: the list of people on the left, the open conversation
 * on the right. On a phone it shows one at a time, with a way back to the list.
 */
export function MessagesWorkspace({
  groups,
  selectedGroup,
  selected,
  onSelectCounterpart,
  onSelectProject,
  searchPlaceholder,
  renderChat,
  noChat,
}: {
  groups: CounterpartChatGroup[]
  selectedGroup?: CounterpartChatGroup
  selected?: InboxProject
  onSelectCounterpart: (counterpartId: number) => void
  onSelectProject: (projectKey: string) => void
  searchPlaceholder: string
  renderChat: (slot: ChatSlot) => ReactNode
  /** Shown on the right when no conversation is open. */
  noChat?: ReactNode
}) {
  const [phoneShowsChat, setPhoneShowsChat] = useState(false)

  const headerActions = selected ? (
    <>
      {selected.kind !== "direct" ? (
        <Button asChild size="sm" variant="outline" className="hidden h-8 sm:inline-flex">
          <Link href={selected.href}>
            {selected.kind === "proposal" ? "Открыть заявку" : "Открыть сделку"}
            <ArrowSquareOutIcon className="size-4" aria-hidden />
          </Link>
        </Button>
      ) : null}
      <button
        type="button"
        onClick={() => setPhoneShowsChat(false)}
        className="grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-surface-muted md:hidden"
        aria-label="К списку диалогов"
      >
        <ArrowLeftIcon className="size-5" aria-hidden />
      </button>
    </>
  ) : null

  return (
    <div className="grid h-[calc(100dvh-220px)] min-h-[480px] gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
      <ConversationsSidebar
        groups={groups}
        selectedId={selectedGroup?.counterpartId ?? null}
        onSelect={(id) => {
          onSelectCounterpart(id)
          setPhoneShowsChat(true)
        }}
        searchPlaceholder={searchPlaceholder}
        className={cn(phoneShowsChat && "hidden md:flex")}
      />
      <div className={cn("min-h-0", !phoneShowsChat && "hidden md:block")}>
        {selectedGroup && selected ? (
          renderChat({
            headerActions,
            headerChildren: (
              <ChatProjectSwitcher
                projects={selectedGroup.projects}
                selectedKey={selected.key}
                onSelect={onSelectProject}
              />
            ),
            className: "h-full min-h-0",
          })
        ) : (
          noChat ?? (
            <div className="grid h-full place-items-center rounded-2xl border border-line bg-card p-6 text-center">
              <div className="grid justify-items-center gap-2">
                <ChatsCircleIcon className="size-10 text-mute" weight="duotone" aria-hidden />
                <p className="text-[14px] text-mute">Выберите диалог слева</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
