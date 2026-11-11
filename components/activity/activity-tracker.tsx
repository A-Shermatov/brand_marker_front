"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { dueReport, outsideReferrer, type DeviceReport } from "@/lib/activity/device-report"
import { createTracker, type PageEvent, type Tracker } from "@/lib/activity/tracker"
import { ensureAccessToken, tokenStorage } from "@/lib/api/client"
import { API_MODE, API_URL } from "@/lib/api/config"
import { applyDeviceHeaders } from "@/lib/device"
import { SITE_TITLE } from "@/lib/site"

/** A page that was just opened waits this long: its title settles, and a redirect right after it joins the same batch. */
const SEND_AFTER_MS = 1500
const SEND_EVERY_MS = 20_000

/**
 * Sends the pages to the journal. It is a side channel: it never shows an
 * error, never retries, and a page that is closing does not wait for anything.
 */
const send = async (events: PageEvent[], final: boolean) => {
  try {
    const headers = new Headers({ "Content-Type": "application/json" })
    applyDeviceHeaders(headers)
    // A closing page sends with the token it has; otherwise a fresh one is fetched if needed.
    const token = final ? tokenStorage.getAccess() : await ensureAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
    const actorId = tokenStorage.getActorId()
    if (actorId) headers.set("X-Actor-Id", String(actorId))

    const due = final ? null : await dueReport().catch(() => null)
    const body: { events: PageEvent[]; device?: DeviceReport } = { events }
    if (due) body.device = due.report

    const res = await fetch(`${API_URL}/activity`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
      credentials: "omit",
    })
    if (res.ok) due?.done()
  } catch {
    // The journal missing a page is not the visitor's problem.
  }
}

/**
 * Tells the platform's journal which pages are opened and for how long, and
 * (once in a while) what this browser is. Draws nothing.
 */
export const ActivityTracker = () => {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const tracker = useRef<Tracker | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!API_MODE) return
    const instance = createTracker({
      now: () => performance.now(),
      send: (events, final) => void send(events, final),
      // The title all pages share says nothing about this one.
      title: () => (document.title === SITE_TITLE ? undefined : document.title),
      entryReferrer: () => outsideReferrer(document.referrer, window.location.origin),
    })
    tracker.current = instance

    const onVisibility = () => instance.visibility(document.visibilityState === "hidden")
    const onHide = () => instance.close()
    // Back from the browser's page cache: the same page, a new view.
    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return
      instance.page(window.location.pathname, window.location.search.slice(1))
      instance.flush()
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onHide)
    window.addEventListener("pageshow", onShow)
    const interval = window.setInterval(() => instance.flush(), SEND_EVERY_MS)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onHide)
      window.removeEventListener("pageshow", onShow)
      window.clearInterval(interval)
      if (timer.current !== null) window.clearTimeout(timer.current)
      tracker.current = null
    }
  }, [])

  useEffect(() => {
    const instance = tracker.current
    if (!instance) return
    instance.page(pathname, search)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => instance.flush(), SEND_AFTER_MS)
  }, [pathname, search])

  return null
}
