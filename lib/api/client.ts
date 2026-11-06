import { API_URL } from "./config"
import { translateApiMessage } from "./error-messages"
import { notifySessionEnded, sessionEndFromMessage } from "./session-events"

export type ApiError = {
  status: number
  message: string
  code?: string
}

const readErrorMessage = (err: unknown, fallback: string): string => {
  if (!err || typeof err !== "object") return fallback
  const detail = "detail" in err ? (err as { detail: unknown }).detail : undefined
  if (typeof detail === "string" && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (typeof first === "string") return first
    if (first && typeof first === "object" && "msg" in first) {
      return String((first as { msg: unknown }).msg)
    }
  }
  if ("message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message
  }
  return fallback
}

export const getApiErrorMessage = (err: unknown, fallback: string): string =>
  translateApiMessage(readErrorMessage(err, err instanceof Error ? err.message : fallback))

export const isUnauthorizedError = (err: unknown): boolean =>
  Boolean(err && typeof err === "object" && "status" in err && (err as ApiError).status === 401)

export type TokenPair = {
  access_token: string
  refresh_token: string
  role?: "buyer" | "supplier" | null
}

const TOKEN_KEY = "bm-access-token"
const REFRESH_KEY = "bm-refresh-token"
const ACTOR_KEY = "bm-actor-id"
const COMPANY_KEY = "bm-company-id"
const ACCESS_REFRESH_SKEW_SEC = 60

export const tokenStorage = {
  getAccess: (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY),
  getRefresh: (): string | null =>
    typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY),
  getActorId: (): number | null => {
    if (typeof window === "undefined") return null
    const v = localStorage.getItem(ACTOR_KEY)
    return v ? Number(v) : null
  },
  getCompanyId: (): number | null => {
    if (typeof window === "undefined") return null
    const v = localStorage.getItem(COMPANY_KEY)
    return v ? Number(v) : null
  },
  setTokens: (tokens: TokenPair) => {
    localStorage.setItem(TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  setActorId: (id: number) => {
    localStorage.setItem(ACTOR_KEY, String(id))
    localStorage.removeItem(COMPANY_KEY)
  },
  setCompanyId: (id: number) => {
    localStorage.setItem(COMPANY_KEY, String(id))
  },
  clearActor: () => {
    localStorage.removeItem(ACTOR_KEY)
    localStorage.removeItem(COMPANY_KEY)
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(ACTOR_KEY)
    localStorage.removeItem(COMPANY_KEY)
  },
}

let refreshPromise: Promise<string | null> | null = null

const decodeJwtPayload = (token: string): { exp?: number; type?: string } | null => {
  try {
    const segment = token.split(".")[1]
    if (!segment) return null
    const padded = segment.replace(/-/g, "+").replace(/_/g, "/")
    const json = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="))
    return JSON.parse(json) as { exp?: number; type?: string }
  } catch {
    return null
  }
}

const isAccessTokenUsable = (token: string | null): token is string => {
  if (!token) return false
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  if (payload.type && payload.type !== "access") return false
  return payload.exp * 1000 > Date.now() + ACCESS_REFRESH_SKEW_SEC * 1000
}

const refreshAccessToken = (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = tokenStorage.getRefresh()
    if (!refresh) return null
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      })
      if (res.status === 401 || res.status === 403) {
        tokenStorage.clear()
        let detail = ""
        try {
          detail = readErrorMessage(await res.json(), "")
        } catch {
          // no body
        }
        notifySessionEnded(sessionEndFromMessage(detail))
        return null
      }
      if (!res.ok) return null
      const data = (await res.json()) as TokenPair
      if (!data.access_token) return null
      tokenStorage.setTokens(data)
      return data.access_token
    } catch {
      return null
    }
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export const ensureAccessToken = async (forceRefresh = false): Promise<string | null> => {
  if (!forceRefresh) {
    const current = tokenStorage.getAccess()
    if (isAccessTokenUsable(current)) return current
  }
  return refreshAccessToken()
}

let sessionActorResolver: (() => number | null) | null = null

/** Called from auth-store to avoid a circular import with apiFetch. */
export const setSessionActorResolver = (resolver: () => number | null) => {
  sessionActorResolver = resolver
}

export const apiFetch = async <T>(
  path: string,
  options: RequestInit & {
    actorId?: number | null
    companyId?: number | null
    skipAuth?: boolean
  } = {},
): Promise<T> => {
  const { actorId, companyId, skipAuth, ...init } = options
  const headers = new Headers(init.headers)

  if (!skipAuth) {
    const token = await ensureAccessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const sessionActorId = sessionActorResolver?.() ?? null
  const activeActor = actorId ?? sessionActorId ?? tokenStorage.getActorId()
  if (activeActor) {
    headers.set("X-Actor-Id", String(activeActor))
  } else {
    const activeCompany = companyId ?? tokenStorage.getCompanyId()
    if (activeCompany) {
      headers.set("X-Company-Id", String(activeCompany))
    }
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const sentToken = headers.get("Authorization")
  let res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken()
    if (newToken && `Bearer ${newToken}` !== sentToken) {
      headers.set("Authorization", `Bearer ${newToken}`)
      res = await fetch(`${API_URL}${path}`, { ...init, headers })
    }
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const err = await res.json()
      message = readErrorMessage(err, message)
    } catch {
      // ignore
    }
    const error: ApiError = { status: res.status, message: translateApiMessage(String(message)) }
    throw error
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
