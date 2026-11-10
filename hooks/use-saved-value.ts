"use client"

import { useEffect, useState } from "react"

/**
 * A value remembered in this browser under the given key: `undefined` until
 * it has been read (the server and the first paint do not know it), then the
 * stored string or `null`. Read once per key; never throws in private mode.
 */
export const useSavedValue = (key: string): string | null | undefined => {
  const [value, setValue] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    try {
      setValue(window.localStorage.getItem(key))
    } catch {
      setValue(null)
    }
  }, [key])
  return value
}
