import {
  ADMIN_HUBS,
  ADMIN_HUB_PERMISSIONS,
  ADMIN_SUBTABS,
  type CabinetNavHub,
  type CabinetSubtab,
} from "./cabinet-nav"

type PermissionHolder = {
  platformRole: string
  permissions: string[]
} | null | undefined

/**
 * The right each admin address asks for. A page opened from a list (a company,
 * a dispute) asks for the same right as the list.
 */
export const ADMIN_ROUTE_PERMISSIONS: ReadonlyArray<{ href: string; permission: string }> = [
  { href: "/admin", permission: "admin_dashboard.view" },
  { href: "/admin/verification", permission: "admin_companies.view" },
  { href: "/admin/catalog", permission: "admin_catalog.view" },
  { href: "/admin/moderation", permission: "admin_reports.view" },
  { href: "/admin/disputes", permission: "admin_disputes.view" },
  { href: "/admin/support", permission: "admin_support.view" },
  { href: "/admin/users", permission: "admin_users.view" },
  { href: "/admin/companies", permission: "admin_companies.view" },
  { href: "/admin/trust", permission: "admin_companies.view" },
  { href: "/admin/rfqs", permission: "admin_rfqs.view" },
  { href: "/admin/proposals", permission: "admin_proposals.view" },
  { href: "/admin/contracts", permission: "admin_contracts.view" },
  { href: "/admin/chats", permission: "admin_contracts.view" },
  { href: "/admin/finance", permission: "admin_finance.view" },
  { href: "/admin/escrow", permission: "admin_finance.view" },
  { href: "/admin/gateway-logs", permission: "admin_finance.view" },
  { href: "/admin/logs", permission: "audit_logs.view" },
  { href: "/admin/staff", permission: "admin_staff.view" },
  { href: "/admin/roles", permission: "roles.manage" },
  { href: "/admin/settings", permission: "platform_settings.view" },
  { href: "/admin/categories", permission: "admin_catalog.view" },
  { href: "/admin/telegram", permission: "platform_settings.view" },
  { href: "/admin/analytics", permission: "admin_dashboard.view" },
]

/** Pages that open with any one of several rights (their tabs hide what the rest does not cover). */
export const ADMIN_HUB_ANY_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  "/admin/verification": ["admin_companies.view", "admin_users.view"],
  "/admin/chats": ["admin_contracts.view", "admin_proposals.view"],
  "/admin/staff": ["admin_staff.view", "roles.manage"],
}

/** Pages every member of staff has, whatever their role: their own account. */
const ADMIN_OPEN_PATHS = ["/admin/account"]

export const hasPermission = (user: PermissionHolder, permission: string): boolean => {
  if (!user) return false
  if (user.platformRole === "superadmin") return true
  return user.permissions.includes(permission)
}

export const hasAnyPermission = (
  user: PermissionHolder,
  permissions: readonly string[],
): boolean => permissions.some((permission) => hasPermission(user, permission))

const matchesRoute = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

export const getAdminRoutePermission = (pathname: string): string | null => {
  const path = pathname.split(/[?#]/)[0]
  const match = ADMIN_ROUTE_PERMISSIONS.filter((route) => matchesRoute(path, route.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0]
  return match?.permission ?? null
}

export const getAdminHubPermissions = (pathname: string): readonly string[] | null => {
  const path = pathname.split(/[?#]/)[0]
  const hubHref = Object.keys(ADMIN_HUB_ANY_PERMISSIONS)
    .filter((href) => matchesRoute(path, href))
    .sort((a, b) => b.length - a.length)[0]
  return hubHref ? ADMIN_HUB_ANY_PERMISSIONS[hubHref] : null
}

export const canAccessAdminPath = (user: PermissionHolder, pathname: string): boolean => {
  const path = pathname.split(/[?#]/)[0]
  if (ADMIN_OPEN_PATHS.some((open) => matchesRoute(path, open))) return Boolean(user)
  const hubPermissions = getAdminHubPermissions(pathname)
  if (hubPermissions) return hasAnyPermission(user, hubPermissions)

  const permission = getAdminRoutePermission(pathname)
  if (!permission) return true
  return hasPermission(user, permission)
}

export const STAFF_ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  moderator: "Модератор",
  superadmin: "Суперадминистратор",
}

export const getStaffRoleLabel = (roleName: string | null | undefined) =>
  roleName ? (STAFF_ROLE_LABELS[roleName] ?? roleName) : "Без роли"

const STAFF_RANK: Record<string, number> = { moderator: 1, admin: 2, superadmin: 3 }

const staffRoleRank = (roleName: string) => (roleName === "admin" ? 2 : 1)

/** Mirrors backend rules: only a strictly higher rank can manage a role or a staff member. */
export const canManageStaffRole = (user: PermissionHolder, roleName: string) => {
  if (!user) return false
  return (STAFF_RANK[user.platformRole] ?? 0) > staffRoleRank(roleName)
}

export const canManageStaffMember = (
  user: (PermissionHolder & { userId: number }) | null | undefined,
  member: { id: number; platform_role: string },
) => {
  if (!user || user.userId === member.id) return false
  return (STAFF_RANK[user.platformRole] ?? 0) > (STAFF_RANK[member.platform_role] ?? 0)
}

/** The tabs of a section a member of staff may open, in the order of the section. */
export const allowedAdminTabs = (user: PermissionHolder, hubId: string): CabinetSubtab[] =>
  (ADMIN_SUBTABS[hubId] ?? []).filter(
    (tab) => !tab.permissions?.length || hasAnyPermission(user, tab.permissions),
  )

/**
 * Where a menu item leads for this member of staff: the section itself, or its
 * first tab they may open. Null when nothing in the section is theirs.
 */
export const adminHubHref = (user: PermissionHolder, hub: CabinetNavHub): string | null => {
  if (ADMIN_SUBTABS[hub.id]?.length) return allowedAdminTabs(user, hub.id)[0]?.href ?? null
  const needed = ADMIN_HUB_PERMISSIONS[hub.id]
  return !needed?.length || hasAnyPermission(user, needed) ? hub.href : null
}

/** The menu as this member of staff sees it: only the sections they can open. */
export const adminMenuFor = (user: PermissionHolder): CabinetNavHub[] =>
  ADMIN_HUBS.flatMap((hub) => {
    const href = adminHubHref(user, hub)
    return href ? [{ ...hub, href }] : []
  })

/** The first page of the menu this member of staff may open: where they land. */
export const getFirstAllowedAdminPath = (user: PermissionHolder): string | null =>
  adminMenuFor(user)[0]?.href ?? null
