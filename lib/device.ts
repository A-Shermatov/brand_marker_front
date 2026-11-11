/**
 * How this browser introduces itself to the API.
 *
 * The device id is made once and kept for as long as the browser keeps its
 * storage; the visit id lives as long as the tab. Both are random and say
 * nothing by themselves: the platform uses them to tell "the same device again"
 * from "a new one" in its journal, for example to notice a sign-in from a
 * device the account has never used.
 */

const DEVICE_KEY = "bm-device-id"
const VISIT_KEY = "bm-visit-id"

export const DEVICE_HEADER = "X-Device-Id"
export const VISIT_HEADER = "X-Visit-Id"

/** A random UUID; `crypto.randomUUID` is missing on plain-http pages, so it is built by hand there. */
export const randomId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-")
}

// Storage can be closed (a private window, blocked site data): the id then lives
// for this page only, which still ties its requests together.
const memory: Record<string, string> = {}

const remembered = (storage: () => Storage, key: string): string | null => {
  if (typeof window === "undefined") return null
  try {
    const saved = storage().getItem(key)
    if (saved) return saved
    const made = randomId()
    storage().setItem(key, made)
    return made
  } catch {
    memory[key] ??= randomId()
    return memory[key]
  }
}

export const getDeviceId = (): string | null => remembered(() => window.localStorage, DEVICE_KEY)

export const getVisitId = (): string | null => remembered(() => window.sessionStorage, VISIT_KEY)

/** Adds the device and the visit to a request's headers. */
export const applyDeviceHeaders = (headers: Headers): void => {
  const device = getDeviceId()
  if (device) headers.set(DEVICE_HEADER, device)
  const visit = getVisitId()
  if (visit) headers.set(VISIT_HEADER, visit)
}
