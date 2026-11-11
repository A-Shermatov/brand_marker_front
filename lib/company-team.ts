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
  { value: "viewer", label: "Наблюдатель" },
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
  viewer: "Наблюдатель",
}

// Same split as the server (app/core/permissions.py): committing the company
// (accepting an offer, releasing money, the team) is for the director and admins.
export const COMPANY_ROLE_RIGHTS: Record<CompanyRole, string> = {
  director: "Всё, включая команду и выпуск денег",
  admin: "Всё, кроме смены руководителя",
  moderator: "Заявки, предложения, каталог, переписка",
  accountant: "Оплата, вывод денег, подписка",
  viewer: "Только просмотр",
}

/** What each access level may and may not do, for the "who can do what" panel. */
export const COMPANY_ROLE_ACCESS: Record<CompanyRole, { can: string; cannot: string | null }> = {
  director: {
    can: "Всё: заявки, сделки, деньги, команда, страница и реквизиты компании",
    cannot: null,
  },
  admin: {
    can: "Всё, включая команду и страницу компании",
    cannot: "Менять руководителя и других администраторов",
  },
  moderator: {
    can: "Заявки, предложения, каталог, переписка, ведение сделок, отзывы",
    cannot: "Команда, реквизиты, выпуск денег без согласования",
  },
  accountant: {
    can: "Оплата, вывод денег, тариф; видит всё",
    cannot: "Заявки и предложения, команда",
  },
  viewer: {
    can: "Видит заявки, сделки, переписку и документы компании",
    cannot: "Любые действия: только просмотр",
  },
}

export const isViewerRole = (role: string | null | undefined): boolean => role === "viewer"

export const INVITATION_STATUS_LABELS: Record<string, string> = {
  pending: "Приглашён, ждём ответа",
  expired: "Срок приглашения истёк",
  declined: "Отказался",
  accepted: "Принял приглашение",
  cancelled: "Отменено",
}

export const invitationStatusLabel = (status: string): string =>
  INVITATION_STATUS_LABELS[status] ?? status

/** "до 25 ноября" for an invitation's last day. */
export const formatInviteDeadline = (iso: string): string => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return `до ${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`
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
