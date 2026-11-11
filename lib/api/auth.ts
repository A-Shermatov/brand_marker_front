import type { IndividualPage, InvitationPreview, MyInvitation } from "@/types"
import { apiFetch, tokenStorage, type TokenPair } from "./client"

export type ActorSummary = {
  id: number
  kind: "individual" | "company"
  side: "buyer" | "supplier"
  display_name: string
  trust_level: string
  company_id: number | null
  verification_status: string | null
  company_role: string | null
}

export type MeResponse = {
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    phone: string | null
    role: string
    status: string
    totp_enabled?: boolean
    /** Public link to the person's photo; null until they upload one. */
    avatar_url?: string | null
  }
  actors: ActorSummary[]
  active_actor_id: number | null
  capabilities: {
    buyer: boolean
    supplier: boolean
  }
  /** Listed among suppliers as a private person. */
  accepts_orders?: boolean
  /** The cabinet opens in the person's company, not as themselves. */
  prefers_company?: boolean
  companies: Array<{
    id: number
    title: string
    actor_type: string
    verification_status: string
    role: string | null
  }>
  active_company_id: number | null
  permissions?: string[]
  staff_role?: {
    id: number
    name: string
    description: string | null
  } | null
}

export type LoginChallenge = {
  requires_2fa: true
  challenge_token: string
  role?: "buyer" | "supplier" | null
}

export type LoginResult = TokenPair | LoginChallenge

export type TwoFactorSetup = {
  otpauth_url: string
  secret: string
  backup_codes: string[]
  qr_data_url: string
}

export const isLoginChallenge = (value: LoginResult): value is LoginChallenge =>
  Boolean(
    value &&
      typeof value === "object" &&
      "requires_2fa" in value &&
      (value as LoginChallenge).requires_2fa &&
      typeof (value as LoginChallenge).challenge_token === "string",
  )

export const authApi = {
  login: async (
    email: string,
    password: string,
    role?: "buyer" | "supplier",
  ): Promise<LoginResult> => {
    const data = await apiFetch<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, ...(role ? { role } : {}) }),
      skipAuth: true,
    })
    if (isLoginChallenge(data)) {
      return data
    }
    tokenStorage.setTokens(data)
    tokenStorage.clearActor()
    return data
  },

  verify2fa: async (challengeToken: string, code: string): Promise<TokenPair> => {
    const data = await apiFetch<TokenPair>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken, code }),
      skipAuth: true,
    })
    tokenStorage.setTokens(data)
    tokenStorage.clearActor()
    return data
  },

  setup2fa: () =>
    apiFetch<TwoFactorSetup>("/auth/2fa/setup", {
      method: "POST",
    }),

  confirm2fa: (code: string) =>
    apiFetch<MeResponse["user"]>("/auth/2fa/confirm", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  disable2fa: (password: string, code: string) =>
    apiFetch<MeResponse["user"]>("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ password, code }),
    }),

  register: async (payload: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role: "buyer" | "supplier" | "both"
    account_type?: "individual" | "company"
    company_title?: string
    headline?: string
    invite_token?: string
  }): Promise<TokenPair> => {
    const data = await apiFetch<TokenPair>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    })
    tokenStorage.setTokens(data)
    tokenStorage.clearActor()
    return data
  },

  forgotPassword: (email: string) =>
    apiFetch<{ detail: string }>("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<{ detail: string }>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
      skipAuth: true,
    }),

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<TokenPair> => {
    const data = await apiFetch<TokenPair>("/auth/password/change", {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
    // Keep the active actor/company: only the token pair is replaced.
    tokenStorage.setTokens(data)
    return data
  },

  me: () => apiFetch<MeResponse>("/auth/me"),

  /** Who I am now, whatever profile this browser remembers: the server picks the start. */
  meFresh: () => apiFetch<MeResponse>("/auth/me", { skipActor: true }),

  logout: async () => {
    if (tokenStorage.hasSession()) {
      // The API revokes the token from the body (older sessions) or from the cookie,
      // and clears the cookie.
      const refresh = tokenStorage.getRefresh()
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify(refresh ? { refresh_token: refresh } : {}),
        skipAuth: true,
      }).catch(() => undefined)
    }
    tokenStorage.clear()
  },

  switchActor: (actorId: number) =>
    apiFetch<MeResponse>("/auth/switch-actor", {
      method: "POST",
      body: JSON.stringify({ actor_id: actorId }),
    }),

  switchCompany: (companyId: number) =>
    apiFetch<MeResponse>("/auth/switch-company", {
      method: "POST",
      body: JSON.stringify({ company_id: companyId }),
    }),

  activateRole: (side: "buyer" | "supplier") =>
    apiFetch<MeResponse>("/auth/activate-role", {
      method: "POST",
      body: JSON.stringify({ side }),
    }),

  updateProfile: (data: {
    first_name?: string
    last_name?: string
    phone?: string | null
  }) =>
    apiFetch<MeResponse["user"]>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /** A new profile photo; the answer carries its public link. */
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<MeResponse["user"]>("/auth/me/avatar", { method: "POST", body: form })
  },

  deleteAvatar: () => apiFetch<MeResponse["user"]>("/auth/me/avatar", { method: "DELETE" }),

  /** My page as a private person. */
  getPage: () => apiFetch<IndividualPage>("/auth/me/page"),

  updatePage: (data: Omit<IndividualPage, "supplier_actor_id">) =>
    apiFetch<IndividualPage>("/auth/me/page", { method: "PUT", body: JSON.stringify(data) }),

  /** A picture for the portfolio; the answer carries its public link. */
  uploadPageImage: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return apiFetch<{ image: string }>("/auth/me/page/image", { method: "POST", body: form })
  },
}

/** Invitations to company teams addressed to the signed-in person. */
export const invitationsApi = {
  mine: () => apiFetch<MyInvitation[]>("/auth/invitations"),

  accept: (invitationId: number) =>
    apiFetch<{ company_id: number }>(`/auth/invitations/${invitationId}/accept`, {
      method: "POST",
    }),

  decline: (invitationId: number) =>
    apiFetch<void>(`/auth/invitations/${invitationId}/decline`, { method: "POST" }),

  acceptByLink: (token: string) =>
    apiFetch<{ company_id: number }>("/auth/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  declineByLink: (token: string) =>
    apiFetch<void>("/auth/invitations/decline", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  /** What the link shows; works without signing in. */
  preview: (token: string) =>
    apiFetch<InvitationPreview>(`/public/invitations/${encodeURIComponent(token)}`, {
      skipAuth: true,
    }),
}
