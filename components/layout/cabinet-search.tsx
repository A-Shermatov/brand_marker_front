"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"

type CabinetSearchProps = {
  /** List page that reads the query from `?q=` */
  target: string
  placeholder: string
}

/** Topbar search: Enter opens the list page filtered by the query. */
export function CabinetSearch({ target, placeholder }: CabinetSearchProps) {
  const router = useRouter()
  const [value, setValue] = useState("")

  return (
    <form
      role="search"
      className="relative hidden max-w-md flex-1 sm:block"
      onSubmit={(event) => {
        event.preventDefault()
        const q = value.trim()
        router.push(q ? `${target}?q=${encodeURIComponent(q)}` : target)
      }}
    >
      <label>
        <span className="sr-only">{placeholder}</span>
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-[17px] -translate-y-1/2 text-faint" />
        <input
          maxLength={100}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-transparent bg-surface-muted pl-9 pr-3 text-[14px] outline-none transition-colors placeholder:text-faint hover:bg-line/70 focus:border-brand-600 focus:bg-card focus:ring-[3px] focus:ring-brand-600/15"
        />
      </label>
    </form>
  )
}
