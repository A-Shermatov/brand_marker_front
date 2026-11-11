import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  DEMO_SUPPLIER_ACTOR_ID,
  DEMO_BUYER_ACTOR_IDS,
} from "@/lib/mock/companies"
import { authApi, isLoginChallenge, type ActorSummary } from "@/lib/api/auth"
import { isApiEnabled } from "@/lib/api/config"
import { setSessionActorResolver, tokenStorage } from "@/lib/api/client"

export type SessionRole = "customer" | "supplier" | "admin"
export type MarketplaceSessionRole = Exclude<SessionRole, "admin">
export type AdminPlatformRole = "admin" | "superadmin" | "moderator"

export type SessionUser = {
  id: string
  userId: number
  email: string
  name: string
  role: SessionRole
  platformRole: string
  permissions: string[]
  staffRoleId?: number
  staffRoleName?: string
  actorId: number
  activeActorId: number | null
  actors: ActorSummary[]
  capabilities: { buyer: boolean; supplier: boolean }
  companyId: number
  companyIds: number[]
  activeCompanyId: number | null
  hasDelivery?: boolean
  city?: string
  phone?: string
  company?: string
  /** Public link to the person's photo. */
  avatarUrl?: string | null
  /** Listed among suppliers as a private person. */
  acceptsOrders?: boolean
  /** The cabinet opens in the person's company, not as themselves. */
  prefersCompany?: boolean
}

export type LoginFlowResult =
  | { status: "ok"; role: SessionRole }
  | { status: "needs_2fa"; challengeToken: string }

export type AdminLoginFlowResult =
  | { status: "ok" }
  | { status: "needs_2fa"; challengeToken: string }

interface AuthState {
  user: SessionUser | null
  isAuthenticated: boolean
  isReady: boolean
  nextUserId: number
  login: (params: { email: string; role: MarketplaceSessionRole; name?: string }) => void
  loginWithCredentials: (params: {
    email: string
    password: string
    role: MarketplaceSessionRole
  }) => Promise<LoginFlowResult>
  completeLoginWith2fa: (params: {
    challengeToken: string
    code: string
    role: MarketplaceSessionRole
  }) => Promise<SessionRole>
  loginAdminWithCredentials: (params: {
    email: string
    password: string
  }) => Promise<AdminLoginFlowResult>
  completeAdminLoginWith2fa: (params: {
    challengeToken: string
    code: string
  }) => Promise<void>
  registerWithCredentials: (params: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone?: string
    role: MarketplaceSessionRole
    /** Who registers: a company (or sole trader) or a private person. */
    accountType?: "individual" | "company"
    companyTitle?: string
    /** A private supplier: what they do, in one line. */
    headline?: string
    /** Registering from an invitation link: joins that company. */
    inviteToken?: string
  }) => Promise<MarketplaceSessionRole>
  /**
   * Reads the person's profiles again and stands in one they still have.
   * With `companyId`, enters that company (after accepting an invitation).
   * Resolves with the cabinet to open.
   */
  refreshSession: (options?: { companyId?: number }) => Promise<MarketplaceSessionRole | null>
  /**
   * Reads the person's profiles and access levels again without moving them:
   * a director may have changed their access since they signed in.
   */
  syncProfiles: () => Promise<void>
  restoreSession: () => Promise<boolean>
  /** Ends the session; with `redirectTo` reloads that page so no data of this user stays in memory. */
  logout: (redirectTo?: string) => Promise<void>
  updateProfile: (patch: Partial<SessionUser>) => void
  switchActor: (actorId: number) => Promise<void>
  switchCompany: (companyId: number) => Promise<void>
  activateRole: (side: "buyer" | "supplier") => Promise<void>
  switchSessionRole: (role: MarketplaceSessionRole) => Promise<void>
  linkCompany: (companyId: number, options?: { setActive?: boolean; title?: string }) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

const nameFromEmail = (email: string): string => {
  const local = email.split("@")[0] ?? "Пользователь"
  return local.charAt(0).toUpperCase() + local.slice(1)
}

const DEMO_CUSTOMER_ACTOR_ID = DEMO_BUYER_ACTOR_IDS[0]

const demoCompanyIdForRole = (role: MarketplaceSessionRole): number =>
  role === "supplier" ? DEMO_SUPPLIER_ACTOR_ID : DEMO_CUSTOMER_ACTOR_ID

const sideForRole = (role: MarketplaceSessionRole): "buyer" | "supplier" =>
  role === "supplier" ? "supplier" : "buyer"

export const pickActorForRole = (
  actors: ActorSummary[],
  role: MarketplaceSessionRole,
  preferredId?: number | null,
  /** The person works for a company: start there, not in the personal profile. */
  preferCompany = false,
): ActorSummary | undefined => {
  const side = sideForRole(role)
  const forSide = actors.filter((a) => a.side === side)
  if (preferredId) {
    const match = forSide.find((a) => a.id === preferredId)
    if (match) return match
  }
  const company = forSide.find((a) => a.kind === "company")
  const personal = forSide.find((a) => a.kind === "individual")
  return (preferCompany ? company ?? personal : personal ?? company) ?? forSide[0]
}

const sessionFromMe = (
  me: Awaited<ReturnType<typeof authApi.me>>,
  role: SessionRole,
): SessionUser => {
  if (role === "admin") {
    return {
      id: String(me.user.id),
      userId: me.user.id,
      email: me.user.email,
      name: `${me.user.first_name} ${me.user.last_name}`.trim() || me.user.email,
      role,
      platformRole: me.user.role,
      permissions: me.permissions ?? [],
      staffRoleId: me.staff_role?.id,
      staffRoleName: me.staff_role?.name,
      actorId: 0,
      activeActorId: null,
      actors: me.actors,
      capabilities: me.capabilities,
      companyId: 0,
      companyIds: [],
      activeCompanyId: null,
      phone: me.user.phone ?? undefined,
      avatarUrl: me.user.avatar_url ?? null,
    }
  }

  const active = pickActorForRole(me.actors, role, me.active_actor_id, me.prefers_company)
  const actorId = active?.id ?? 0
  const companyIds = me.companies.map((c) => c.id)
  const name = `${me.user.first_name} ${me.user.last_name}`.trim()

  if (active?.id) {
    tokenStorage.setActorId(active.id)
  }

  return {
    id: String(me.user.id),
    userId: me.user.id,
    email: me.user.email,
    name,
    role,
    platformRole: me.user.role,
    permissions: me.permissions ?? [],
    actorId,
    activeActorId: active?.id ?? null,
    actors: me.actors,
    capabilities: me.capabilities,
    companyId: active?.company_id ?? actorId,
    companyIds,
    activeCompanyId: active?.company_id ?? me.active_company_id,
    company: active?.display_name,
    phone: me.user.phone ?? undefined,
    avatarUrl: me.user.avatar_url ?? null,
    acceptsOrders: Boolean(me.accepts_orders),
    prefersCompany: Boolean(me.prefers_company),
  }
}

type AuthStoreSet = (partial: Partial<AuthState>) => void

const finalizeMarketplaceSession = async (
  set: AuthStoreSet,
  role: MarketplaceSessionRole,
): Promise<SessionRole> => {
  let me = await authApi.me()
  if (["admin", "superadmin", "moderator"].includes(me.user.role)) {
    set({
      isAuthenticated: true,
      isReady: true,
      user: sessionFromMe(me, "admin"),
    })
    return "admin"
  }
  let active = pickActorForRole(me.actors, role, me.active_actor_id, me.prefers_company)
  if (!active) {
    try {
      me = await authApi.activateRole(sideForRole(role))
      active = pickActorForRole(me.actors, role, me.active_actor_id, me.prefers_company)
    } catch {
      // fall through
    }
  }
  if (!active) {
    const sideLabel = role === "customer" ? "покупателя" : "поставщика"
    throw new Error(
      `Нет профиля ${sideLabel}. Активируйте роль в настройках или создайте компанию.`,
    )
  }
  set({
    isAuthenticated: true,
    isReady: true,
    user: sessionFromMe(me, role),
  })
  return role
}

/** Every `bm-*` key in localStorage holds data of the signed-in user (tokens, stores). */
const clearPersistedUserData = () => {
  if (typeof window === "undefined") return
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("bm-")) window.localStorage.removeItem(key)
    }
  } catch {
    // storage blocked: nothing persisted to clear
  }
}

const finalizeAdminSession = async (set: AuthStoreSet): Promise<void> => {
  const me = await authApi.me()
  if (!["admin", "superadmin", "moderator"].includes(me.user.role)) {
    await authApi.logout().catch(() => undefined)
    throw new Error("У этой учётной записи нет доступа к панели администратора")
  }
  set({
    isAuthenticated: true,
    isReady: true,
    user: sessionFromMe(me, "admin"),
  })
}

const migrateUser = (user: SessionUser): SessionUser => {
  const companyIds =
    user.companyIds?.length > 0
      ? user.companyIds
      : user.companyId
        ? [user.companyId]
        : []

  const activeCompanyId =
    user.activeCompanyId ?? user.companyId ?? companyIds[0] ?? null

  const actorId = user.activeActorId ?? user.actorId ?? activeCompanyId ?? 0

  return {
    ...user,
    userId: user.userId ?? 1,
    platformRole:
      user.platformRole ?? (user.role === "customer" ? "buyer" : user.role),
    permissions: user.permissions ?? [],
    companyIds,
    activeCompanyId,
    actorId,
    activeActorId: user.activeActorId ?? actorId,
    actors: user.actors ?? [],
    capabilities: user.capabilities ?? {
      buyer: user.role === "customer",
      supplier: user.role === "supplier",
    },
    companyId: activeCompanyId ?? actorId,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isReady: false,
      nextUserId: 100,

      login: ({ email, role, name }) => {
        if (isApiEnabled()) return
        const isSupplier = role === "supplier"
        const existing = get().user
        const userId = existing?.email === email ? existing.userId : get().nextUserId
        const companyIds =
          existing?.email === email && existing.companyIds.length > 0
            ? existing.companyIds
            : [demoCompanyIdForRole(role)]

        const activeId = companyIds[0] ?? demoCompanyIdForRole(role)

        set((state) => ({
          nextUserId:
            existing?.email === email ? state.nextUserId : state.nextUserId + 1,
          isAuthenticated: true,
          user: migrateUser({
            id: existing?.email === email ? existing.id : uid(),
            userId,
            email,
            name: name?.trim() || nameFromEmail(email),
            role,
            platformRole: isSupplier ? "supplier" : "buyer",
            permissions: [],
            actorId: activeId,
            activeActorId: activeId,
            actors: [],
            capabilities: {
              buyer: !isSupplier,
              supplier: isSupplier,
            },
            companyId: activeId,
            companyIds,
            activeCompanyId: activeId,
            company: isSupplier ? "ТехноСнаб" : undefined,
            hasDelivery: false,
            city: "Душанбе",
          }),
        }))
      },

      loginWithCredentials: async ({ email, password, role }) => {
        const apiRole = role === "supplier" ? "supplier" : "buyer"
        const loginResult = await authApi.login(email, password, apiRole)
        if (isLoginChallenge(loginResult)) {
          return { status: "needs_2fa", challengeToken: loginResult.challenge_token }
        }
        const sessionRole = await finalizeMarketplaceSession(set, role)
        return { status: "ok", role: sessionRole }
      },

      completeLoginWith2fa: async ({ challengeToken, code, role }) => {
        await authApi.verify2fa(challengeToken, code)
        return finalizeMarketplaceSession(set, role)
      },

      loginAdminWithCredentials: async ({ email, password }) => {
        if (!isApiEnabled()) {
          throw new Error("Для входа администратора необходимо подключение к API")
        }
        const loginResult = await authApi.login(email, password)
        if (isLoginChallenge(loginResult)) {
          return { status: "needs_2fa", challengeToken: loginResult.challenge_token }
        }
        await finalizeAdminSession(set)
        return { status: "ok" }
      },

      completeAdminLoginWith2fa: async ({ challengeToken, code }) => {
        await authApi.verify2fa(challengeToken, code)
        await finalizeAdminSession(set)
      },

      registerWithCredentials: async ({
        email,
        password,
        first_name,
        last_name,
        phone,
        role: wantedRole,
        accountType,
        companyTitle,
        headline,
        inviteToken,
      }) => {
        if (!isApiEnabled()) {
          get().login({
            email,
            role: wantedRole,
            name: `${first_name} ${last_name}`.trim(),
          })
          return wantedRole
        }

        const apiRole = wantedRole === "supplier" ? "supplier" : "buyer"
        await authApi.register({
          email,
          password,
          first_name,
          last_name,
          phone: phone || undefined,
          role: apiRole,
          ...(inviteToken
            ? { invite_token: inviteToken }
            : {
                account_type: accountType ?? "individual",
                ...(accountType === "company" ? { company_title: companyTitle } : {}),
                ...(headline ? { headline } : {}),
              }),
        })
        const me = await authApi.me()
        // An invited person lands in the company's cabinet: purchases or sales,
        // whichever the company does.
        const start = me.actors.find((a) => a.id === me.active_actor_id)
        const role: MarketplaceSessionRole =
          inviteToken && start ? (start.side === "supplier" ? "supplier" : "customer") : wantedRole
        const active = pickActorForRole(me.actors, role, me.active_actor_id, me.prefers_company)
        if (!active) {
          const sideLabel = role === "customer" ? "покупателя" : "поставщика"
          throw new Error(
            `Нет профиля ${sideLabel}. Активируйте роль в настройках или создайте компанию.`,
          )
        }
        set({
          isAuthenticated: true,
          isReady: true,
          user: sessionFromMe(me, role),
        })
        return role
      },

      refreshSession: async (options) => {
        if (!isApiEnabled()) return null
        const current = get().user
        if (!current || current.role === "admin") return null
        const me = await authApi.meFresh()
        let role: MarketplaceSessionRole = current.role
        let target: ActorSummary | undefined
        if (options?.companyId) {
          const inCompany = me.actors.filter((a) => a.company_id === options.companyId)
          target = inCompany.find((a) => a.side === sideForRole(role)) ?? inCompany[0]
        }
        target ??= pickActorForRole(me.actors, role, me.active_actor_id, me.prefers_company)
        // No profile left on this side (the company was the only one): the other cabinet.
        target ??= me.actors.find((a) => a.id === me.active_actor_id) ?? me.actors[0]
        if (!target) return null
        role = target.side === "supplier" ? "supplier" : "customer"
        set({
          isAuthenticated: true,
          isReady: true,
          user: sessionFromMe({ ...me, active_actor_id: target.id }, role),
        })
        return role
      },

      syncProfiles: async () => {
        if (!isApiEnabled()) return
        const current = get().user
        if (!current || current.role === "admin") return
        const me = await authApi.me()
        if (get().user?.userId !== me.user.id) return
        const activeId = current.activeActorId
        // The profile the person works in is gone (removed from the company): leave
        // that to the next request, whose refusal explains it and moves them.
        if (activeId && !me.actors.some((a) => a.id === activeId)) return
        set({ user: sessionFromMe({ ...me, active_actor_id: activeId ?? me.active_actor_id }, current.role) })
      },

      restoreSession: async () => {
        if (!isApiEnabled()) return false
        if (!tokenStorage.hasSession()) return false
        try {
          const me = await authApi.me()
          if (["admin", "superadmin", "moderator"].includes(me.user.role)) {
            set({
              isAuthenticated: true,
              isReady: true,
              user: sessionFromMe(me, "admin"),
            })
            return true
          }
          const active =
            me.actors.find((a) => a.id === me.active_actor_id)
            ?? me.actors[0]
          if (!active) return false
          const role: MarketplaceSessionRole =
            active.side === "supplier" ? "supplier" : "customer"
          set({
            isAuthenticated: true,
            isReady: true,
            user: sessionFromMe(me, role),
          })
          return true
        } catch {
          set({ user: null, isAuthenticated: false, isReady: true })
          return false
        }
      },

      logout: async (redirectTo?: string) => {
        if (isApiEnabled()) {
          await authApi.logout()
          // Cart, cached deals, companies, notifications… persist per browser, not per
          // user: the next person to sign in on this device must not see them.
          clearPersistedUserData()
        }
        set({ user: null, isAuthenticated: false, isReady: true })
        if (redirectTo && typeof window !== "undefined") {
          // A full load also drops the React Query cache (keys are not per user).
          window.location.replace(redirectTo)
        }
      },

      updateProfile: (patch) =>
        set((state) =>
          state.user ? { user: migrateUser({ ...state.user, ...patch }) } : state,
        ),

      switchActor: async (actorId) => {
        if (isApiEnabled()) {
          const me = await authApi.switchActor(actorId)
          const role = get().user?.role ?? "customer"
          set({ user: sessionFromMe(me, role) })
          return
        }
        set((state) => {
          if (!state.user) return state
          const actor = state.user.actors.find((a) => a.id === actorId)
          tokenStorage.setActorId(actorId)
          return {
            user: {
              ...state.user,
              actorId,
              activeActorId: actorId,
              activeCompanyId: actor?.company_id ?? state.user.activeCompanyId,
              companyId: actor?.company_id ?? actorId,
              company: actor?.display_name ?? state.user.company,
            },
          }
        })
      },

      switchCompany: async (companyId) => {
        if (isApiEnabled()) {
          const me = await authApi.switchCompany(companyId)
          const role = get().user?.role ?? "customer"
          set({ user: sessionFromMe(me, role) })
          return
        }
        set((state) => {
          if (!state.user) return state
          if (!state.user.companyIds.includes(companyId)) return state
          return {
            user: {
              ...state.user,
              activeCompanyId: companyId,
              actorId: companyId,
              activeActorId: companyId,
              companyId,
            },
          }
        })
      },

      activateRole: async (side) => {
        if (!isApiEnabled()) return
        const me = await authApi.activateRole(side)
        const role: SessionRole = side === "supplier" ? "supplier" : "customer"
        set({
          isAuthenticated: true,
          user: sessionFromMe(me, role),
        })
      },

      switchSessionRole: async (role) => {
        if (!isApiEnabled()) {
          const state = get()
          if (!state.user) return
          const actorId = demoCompanyIdForRole(role)
          tokenStorage.setActorId(actorId)
          set({
            user: migrateUser({
              ...state.user,
              role,
              platformRole: sideForRole(role),
              actorId,
              activeActorId: actorId,
              companyId: actorId,
              activeCompanyId: actorId,
              companyIds: state.user.companyIds.includes(actorId)
                ? state.user.companyIds
                : [...state.user.companyIds, actorId],
              capabilities: {
                buyer: role === "customer" || state.user.capabilities.buyer,
                supplier: role === "supplier" || state.user.capabilities.supplier,
              },
            }),
            isAuthenticated: true,
          })
          return
        }

        const state = get()
        if (!state.user) return

        const side = sideForRole(role)
        const hasCapability =
          side === "buyer" ? state.user.capabilities.buyer : state.user.capabilities.supplier
        const existing = pickActorForRole(
          state.user.actors,
          role,
          undefined,
          state.user.prefersCompany,
        )

        if (hasCapability && existing) {
          const me = await authApi.switchActor(existing.id)
          set({
            isAuthenticated: true,
            user: sessionFromMe(me, role),
          })
          return
        }

        const me = await authApi.activateRole(side)
        set({
          isAuthenticated: true,
          user: sessionFromMe(me, role),
        })
      },

      linkCompany: (companyId, options) =>
        set((state) => {
          if (!state.user) return state
          const companyIds = state.user.companyIds.includes(companyId)
            ? state.user.companyIds
            : [...state.user.companyIds, companyId]

          const setActive = options?.setActive ?? true
          const activeCompanyId = setActive ? companyId : state.user.activeCompanyId
          const actorId = setActive ? companyId : state.user.actorId

          return {
            user: {
              ...state.user,
              companyIds,
              activeCompanyId: setActive ? companyId : state.user.activeCompanyId,
              actorId,
              activeActorId: setActive ? actorId : state.user.activeActorId,
              companyId: actorId,
              company: options?.title ?? state.user.company,
            },
          }
        }),
    }),
    {
      name: "bm-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        nextUserId: state.nextUserId,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useAuthStore.setState({ user: null, isAuthenticated: false, isReady: true })
          return
        }
        if (state?.user) {
          state.user = migrateUser(state.user)
          const actorId = state.user.activeActorId ?? state.user.actorId
          if (actorId && actorId > 0) {
            tokenStorage.setActorId(actorId)
          }
        }
        useAuthStore.setState({ isReady: true })
      },
      merge: (persisted, current) => {
        // Login can finish before rehydration. Never wipe a live session
        // with a stale localStorage snapshot (e.g. previous customer role).
        if (current.isAuthenticated && current.user) {
          return {
            ...current,
            isReady: true,
          }
        }
        const merged = { ...current, ...(persisted as Partial<AuthState>) }
        if (merged.user) {
          merged.user = migrateUser(merged.user)
        }
        return {
          ...merged,
          isReady: true,
        }
      },
    },
  ),
)

if (typeof window !== "undefined") {
  setSessionActorResolver(() => {
    const id = useAuthStore.getState().user?.activeActorId
    return id && id > 0 ? id : null
  })
  useAuthStore.persist.onFinishHydration(() => {
    const user = useAuthStore.getState().user
    const actorId = user?.activeActorId ?? user?.actorId
    if (actorId && actorId > 0) {
      tokenStorage.setActorId(actorId)
    }
    useAuthStore.setState({ isReady: true })
  })
  if (useAuthStore.persist.hasHydrated()) {
    const user = useAuthStore.getState().user
    const actorId = user?.activeActorId ?? user?.actorId
    if (actorId && actorId > 0) {
      tokenStorage.setActorId(actorId)
    }
    useAuthStore.setState({ isReady: true })
  }
}
