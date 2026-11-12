/**
 * Which pages a person opens and how long they stay on each.
 *
 * The tracker only keeps the list and the clock; how the list is sent is given
 * to it from outside, so it can be tested without a browser. Pages reach the
 * platform's journal, where an administrator sees them next to the person's
 * other actions.
 */

import { randomId } from "../device"

export type PageEvent = {
  type: "view" | "leave"
  /** The id of the view; a "leave" names the view it ends. */
  id: string
  path?: string
  query?: Record<string, string>
  title?: string
  referrer?: string
  seconds?: number
  active_seconds?: number
  /** How long ago it happened when it is sent. */
  ago_ms?: number
}

type Queued = PageEvent & { at: number }

type CurrentView = {
  id: string
  path: string
  search: string
  startedAt: number
  /** Time the tab was on screen, summed over the stretches that have ended. */
  activeMs: number
  /** When the stretch that is on screen now began; null while the tab is hidden. */
  visibleSince: number | null
}

export type TrackerOptions = {
  /** Milliseconds on a clock that never jumps. */
  now: () => number
  /** Sends a batch; `final` means the page is going away and nothing can be awaited. */
  send: (events: PageEvent[], final: boolean) => void
  title?: () => string | undefined
  /** Where the visitor came from before the first page. */
  entryReferrer?: () => string | undefined
}

/** How many events one report may carry (the API refuses more). */
export const MAX_BATCH = 10
const MAX_QUERY_KEYS = 20
const MAX_VALUE = 200
/** Search parameters that are a one-time secret (a password-reset or invitation link). */
const SECRET_KEYS = /^(token|code|key|secret|password|otp|invite|invitation)$|(_token|_secret|_key|_password)$/i
/** Words after which the next part of a path is a one-time token: /invite/<token>. */
const SECRET_AFTER = new Set(["invite", "invitations", "reset-password", "verify-email"])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const OPAQUE_LENGTH = 32

/** The path as it may be kept: one-time tokens in it become «***». */
export const maskPath = (path: string): string => {
  let afterSecretWord = false
  return path
    .split("/")
    .map((part) => {
      const opaque = part.length >= OPAQUE_LENGTH && !UUID.test(part)
      const hidden = part !== "" && !/^\d+$/.test(part) && (afterSecretWord || opaque)
      afterSecretWord = SECRET_AFTER.has(part)
      return hidden ? "***" : part
    })
    .join("/")
    .slice(0, 500)
}

/** Search parameters as an object, with secrets hidden and long values cut. */
export const pageQuery = (search: string): Record<string, string> | undefined => {
  const params = new URLSearchParams(search)
  const query: Record<string, string> = {}
  let count = 0
  params.forEach((value, key) => {
    if (count >= MAX_QUERY_KEYS) return
    count += 1
    query[key.slice(0, 60)] = SECRET_KEYS.test(key) ? "***" : value.slice(0, MAX_VALUE)
  })
  return count ? query : undefined
}

export const createTracker = ({ now, send, title, entryReferrer }: TrackerOptions) => {
  let queue: Queued[] = []
  let current: CurrentView | null = null
  let hidden = false

  const activeMs = (view: CurrentView) =>
    view.activeMs + (view.visibleSince === null ? 0 : now() - view.visibleSince)

  const leaveEvent = (view: CurrentView): Queued => ({
    type: "leave",
    id: view.id,
    seconds: Math.round((now() - view.startedAt) / 1000),
    active_seconds: Math.round(activeMs(view) / 1000),
    at: now(),
  })

  /** Hands over what has gathered. The title of the open page is read now: it settles a moment after the page opens. */
  const flush = (final = false) => {
    if (queue.length === 0) return
    const pageTitle = title?.()
    const batch = queue.map(({ at, ...event }) => ({
      ...event,
      ...(event.type === "view" && current && event.id === current.id && pageTitle
        ? { title: pageTitle.slice(0, 200) }
        : {}),
      ago_ms: Math.max(0, Math.round(now() - at)),
    }))
    queue = []
    // The journal takes a few events per report: a longer queue (a tab that was
    // offline for a while) goes in several.
    for (let from = 0; from < batch.length; from += MAX_BATCH) {
      send(batch.slice(from, from + MAX_BATCH), final)
    }
  }

  /** A page was opened. The same page again (a re-render) is not a new view. */
  const page = (path: string, search = "") => {
    if (current && current.path === path && current.search === search) return
    const referrer = current ? current.path : entryReferrer?.()
    if (current) queue.push(leaveEvent(current))
    current = {
      id: randomId(),
      path,
      search,
      startedAt: now(),
      activeMs: 0,
      visibleSince: hidden ? null : now(),
    }
    queue.push({
      type: "view",
      id: current.id,
      path: maskPath(path),
      query: pageQuery(search),
      referrer: referrer ? maskPath(referrer) : undefined,
      at: now(),
    })
  }

  /**
   * The tab went to the background or came back. Going away sends how long the
   * page has been open so far: on a phone the tab may never come back to say so.
   * If it does, the time simply keeps running and is sent again later.
   */
  const visibility = (isHidden: boolean) => {
    if (hidden === isHidden) return
    hidden = isHidden
    if (!current) return
    if (isHidden) {
      current.activeMs = activeMs(current)
      current.visibleSince = null
      queue.push(leaveEvent(current))
      flush(true)
    } else {
      current.visibleSince = now()
    }
  }

  /** The page is being closed or replaced by another site. */
  const close = () => {
    if (current) queue.push(leaveEvent(current))
    current = null
    flush(true)
  }

  return { page, visibility, close, flush, pending: () => queue.length }
}

export type Tracker = ReturnType<typeof createTracker>
