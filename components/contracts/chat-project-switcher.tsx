"use client"

import { useRef, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import type { InboxProject } from "@/lib/chat-conversations"

type ChatProjectSwitcherProps = {
  projects: InboxProject[]
  selectedKey: string | null
  onSelect: (projectKey: string) => void
}

export const ChatProjectSwitcher = ({
  projects,
  selectedKey,
  onSelect,
}: ChatProjectSwitcherProps) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  if (projects.length <= 1) return null

  const selectedIndex = Math.max(
    0,
    projects.findIndex((project) => project.key === selectedKey),
  )

  const focusProject = (index: number) => {
    const project = projects[index]
    if (!project) return
    onSelect(project.key)
    tabRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      focusProject((selectedIndex + 1) % projects.length)
      return
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      focusProject((selectedIndex - 1 + projects.length) % projects.length)
      return
    }
    if (event.key === "Home") {
      event.preventDefault()
      focusProject(0)
      return
    }
    if (event.key === "End") {
      event.preventDefault()
      focusProject(projects.length - 1)
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Проекты с этим контрагентом"
      onKeyDown={handleKeyDown}
      className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3 sm:px-5"
    >
      {projects.map((project, index) => {
        const isSelected = index === selectedIndex
        const hasUnread = project.unreadCount > 0

        return (
          <button
            key={project.key}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(project.key)}
            title={project.title}
            className={cn(
              "inline-flex h-8 max-w-65 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-line bg-card text-ink-soft hover:bg-surface-muted",
            )}
          >
            <span className="truncate">
              {project.kind === "proposal"
                ? `Заявка: ${project.title}`
                : project.kind === "direct"
                  ? "Личные сообщения"
                  : project.title}
            </span>
            {hasUnread && (
              <span
                className={cn(
                  "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                  "bg-brand-600 text-white",
                )}
                aria-label={`Непрочитанных: ${project.unreadCount}`}
              >
                {project.unreadCount > 99 ? "99+" : project.unreadCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
