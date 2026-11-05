import type { CompanyRole, CompanyUser, SideRole } from "@/types"
import { COMPANY_ROLES } from "@/types"

export type CompanyTeamEmployee = {
  userId: number
  membershipId: number
  name: string
  email: string
  role: CompanyRole
  rights: string
  me?: boolean
  /** Overrides per side; null means the company role applies. */
  buyerRole?: SideRole | null
  supplierRole?: SideRole | null
}

export type TeamSideKey = "buyer" | "supplier"

export const TEAM_SIDE_LABELS: Record<TeamSideKey, string> = {
  buyer: "Закупки",
  supplier: "Продажи",
}

export const SIDE_ROLE_OPTIONS: { value: SideRole; label: string }[] = [
  { value: "admin", label: "Администратор" },
  { value: "moderator", label: "Менеджер" },
  { value: "accountant", label: "Бухгалтер" },
  { value: "none", label: "Нет доступа" },
]

export const sideRoleLabel = (role: SideRole | null | undefined, companyRole: string): string =>
  !role
    ? companyRoleLabel(companyRole)
    : role === "none"
      ? "Нет доступа"
      : companyRoleLabel(role)

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  director: "Руководитель",
  admin: "Администратор",
  moderator: "Менеджер",
  accountant: "Бухгалтер",
}

// Same split as the server (app/core/permissions.py): committing the company
// (accepting an offer, releasing money, the team) is for the director and admins.
export const COMPANY_ROLE_RIGHTS: Record<CompanyRole, string> = {
  director: "Всё, включая команду и выпуск денег",
  admin: "Всё, кроме смены руководителя",
  moderator: "Заявки, предложения, каталог, переписка",
  accountant: "Оплата, вывод денег, подписка",
}

export const ASSIGNABLE_COMPANY_ROLES = COMPANY_ROLES.filter(
  (role) => role !== "director",
) as Exclude<CompanyRole, "director">[]

export const companyRoleLabel = (role: string): string =>
  COMPANY_ROLE_LABELS[role as CompanyRole] ?? role

export const companyRoleRights = (role: string): string =>
  COMPANY_ROLE_RIGHTS[role as CompanyRole] ?? "Доступ участника компании"

export const canManageTeam = (role: string | null | undefined): boolean =>
  role === "director" || role === "admin"

export const isCompanyRole = (role: string): role is CompanyRole =>
  (COMPANY_ROLES as readonly string[]).includes(role)

export const nameFromEmail = (email: string): string => {
  const local = email.split("@")[0]?.trim() || "Пользователь"
  return local.charAt(0).toUpperCase() + local.slice(1)
}

export const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return name.trim().slice(0, 2).toUpperCase() || "?"
}

export const mapCompanyUsersToEmployees = (
  members: CompanyUser[],
  currentUserId: number | null | undefined,
): CompanyTeamEmployee[] =>
  members.map((member) => {
    const email = member.email?.trim() || `user-${member.user_id}@company`
    return {
      userId: member.user_id,
      membershipId: member.id,
      name: member.name?.trim() || nameFromEmail(email),
      email,
      role: isCompanyRole(member.role) ? member.role : "moderator",
      rights: companyRoleRights(member.role),
      me: currentUserId != null && member.user_id === currentUserId,
      buyerRole: member.buyer_role ?? null,
      supplierRole: member.supplier_role ?? null,
    }
  })

export const myCompanyRole = (
  members: CompanyUser[],
  currentUserId: number | null | undefined,
): CompanyRole | null => {
  if (currentUserId == null) return null
  const mine = members.find((m) => m.user_id === currentUserId)
  if (!mine || !isCompanyRole(mine.role)) return null
  return mine.role
}
