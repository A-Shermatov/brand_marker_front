"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type SupportChatContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openSupport: () => void
}

const SupportChatContext = createContext<SupportChatContextValue | null>(null)

export const SupportChatProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false)
  const openSupport = useCallback(() => setOpen(true), [])

  // A notice "Сообщение от поддержки" links here with ?support=1: open the chat
  // and drop the mark, so a reload or the back button does not reopen it.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get("support") !== "1") return
    setOpen(true)
    url.searchParams.delete("support")
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash)
  }, [])
  const value = useMemo(
    () => ({ open, setOpen, openSupport }),
    [open, openSupport],
  )
  return (
    <SupportChatContext.Provider value={value}>{children}</SupportChatContext.Provider>
  )
}

export const useSupportChat = (): SupportChatContextValue => {
  const ctx = useContext(SupportChatContext)
  if (!ctx) {
    return {
      open: false,
      setOpen: () => undefined,
      openSupport: () => undefined,
    }
  }
  return ctx
}
