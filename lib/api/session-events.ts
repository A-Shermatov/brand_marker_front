/**
 * "Your session is over" signal: the server revoked the session or blocked the
 * account. Raised by the API client (refresh refused) and by the notifications
 * socket (pushed the moment an admin acts); handled once in SessionEndedHandler.
 */

export type SessionEndReason = "revoked" | "blocked" | "expired"

export type SessionEnded = {
  reason: SessionEndReason
  message: string
}

const NOTICE_KEY = "bm-session-ended"
type Listener = (event: SessionEnded) => void
const listeners = new Set<Listener>()

export const onSessionEnded = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const notifySessionEnded = (event: SessionEnded) => {
  for (const listener of listeners) listener(event)
}

/** Reason from the API's refusal text. */
export const sessionEndFromMessage = (message: string): SessionEnded => {
  if (/заблокирован/i.test(message)) return { reason: "blocked", message }
  if (/revoked|завершил/i.test(message)) {
    return { reason: "revoked", message: "Администратор завершил ваш сеанс. Войдите снова." }
  }
  return { reason: "expired", message: "Сеанс истёк. Войдите снова." }
}

/** Kept across the redirect so the login page can say why the user is there. */
export const rememberSessionEnd = (event: SessionEnded) => {
  try {
    sessionStorage.setItem(NOTICE_KEY, JSON.stringify(event))
  } catch {
    // storage blocked: the login page simply shows no notice
  }
}

export const takeSessionEnd = (): SessionEnded | null => {
  try {
    const raw = sessionStorage.getItem(NOTICE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(NOTICE_KEY)
    return JSON.parse(raw) as SessionEnded
  } catch {
    return null
  }
}
