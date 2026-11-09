type PermissionHolder = {
  platformRole: string
  permissions: string[]
} | null | undefined

/**
 * Ordered like the consolidated sidebar: first allowed entry is the landing page.
 * Detail / legacy routes keep their own permission for redirects and deep links.
 */
export const ADMIN_ROUTE_PERMISSIONS: ReadonlyArray<{ href: string; permission: string }> = [
  { href: "/admin", permission: "admin_dashboard.view" },
  { href: "/admin/companies", permission: "admin_companies.view" },
  { href: "/admin/verification", permission: "admin_companies.view" },
  { href: "/admin/moderation", permission: "admin_reports.view" },
  { href: "/admin/catalog", permission: "admin_catalog.view" },
  { href: "/admin/rfqs", permission: "admin_rfqs.view" },
  { href: "/admin/proposals", permission: "admin_proposals.view" },
  { href: "/admin/support", permission: "admin_support.view" },
  { href: "/admin/chats", permission: "admin_contracts.view" },
  { href: "/admin/disputes", permission: "admin_disputes.view" },
  { href: "/admin/contracts", permission: "admin_contracts.view" },
  { href: "/admin/finance", permission: "admin_finance.view" },
  { href: "/admin/escrow", permission: "admin_finance.view" },
  { href: "/admin/users", permission: "admin_users.view" },
  { href: "/admin/logs", permission: "audit_logs.view" },
  { href: "/admin/gateway-logs", permission: "admin_finance.view" },
  { href: "/admin/categories", permission: "admin_catalog.view" },
  { href: "/admin/staff", permission: "admin_staff.view" },
  { href: "/admin/roles", permission: "roles.manage" },
  { href: "/admin/settings", permission: "platform_settings.view" },
  { href: "/admin/telegram", permission: "platform_settings.view" },
  { href: "/admin/analytics", permission: "admin_dashboard.view" },
]

/** Hub routes: access if the user has any of these permissions (tabs hide the rest). */
export const ADMIN_HUB_ANY_PERMISSIONS: Readonly<Record<string, readonly string[]>> = {
  "/admin/moderation": [
    "admin_reports.view",
    "admin_catalog.view",
    "admin_rfqs.view",
    "admin_proposals.view",
  ],
  "/admin/disputes": ["admin_disputes.view", "admin_contracts.view"],
  "/admin/chats": ["admin_contracts.view", "admin_proposals.view"],
  "/admin/staff": ["admin_staff.view", "roles.manage"],
  "/admin/finance": ["admin_finance.view"],
  "/admin/companies": ["admin_companies.view"],
  "/admin/verification": ["admin_companies.view"],
}

/** Sidebar order for landing + visibility (hubs use any-of permissions). */
export const ADMIN_NAV_LANDING_ORDER: ReadonlyArray<{
  href: string
  permissions: readonly string[]
}> = [
  { href: "/admin", permissions: ["admin_dashboard.view"] },
  { href: "/admin/verification", permissions: ["admin_companies.view"] },
  {
    href: "/admin/moderation",
    permissions: [
      "admin_reports.view",
      "admin_catalog.view",
      "admin_rfqs.view",
      "admin_proposals.view",
    ],
  },
  { href: "/admin/support", permissions: ["admin_support.view"] },
  { href: "/admin/chats", permissions: ["admin_contracts.view", "admin_proposals.view"] },
  { href: "/admin/disputes", permissions: ["admin_disputes.view", "admin_contracts.view"] },
  { href: "/admin/finance", permissions: ["admin_finance.view"] },
  { href: "/admin/users", permissions: ["admin_users.view"] },
  { href: "/admin/companies", permissions: ["admin_companies.view"] },
  { href: "/admin/catalog", permissions: ["admin_catalog.view"] },
  { href: "/admin/logs", permissions: ["audit_logs.view"] },
  { href: "/admin/categories", permissions: ["admin_catalog.view"] },
  { href: "/admin/staff", permissions: ["admin_staff.view", "roles.manage"] },
  { href: "/admin/settings", permissions: ["platform_settings.view"] },
  { href: "/admin/telegram", permissions: ["platform_settings.view"] },
]

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

export const getFirstAllowedAdminPath = (user: PermissionHolder): string | null =>
  ADMIN_NAV_LANDING_ORDER.find((entry) => hasAnyPermission(user, entry.permissions))?.href ?? null
