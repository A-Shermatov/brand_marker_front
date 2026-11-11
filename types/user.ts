export const USER_ROLES = [
  "buyer",
  "supplier",
  "both",
  "admin",
  "superadmin",
  "moderator",
] as const

export type UserRole = (typeof USER_ROLES)[number]

export const COMPANY_ROLES = [
  "director",
  "admin",
  "moderator",
  "accountant",
  "viewer",
] as const

export type CompanyRole = (typeof COMPANY_ROLES)[number]

export const USER_STATUSES = ["pending", "active", "blocked"] as const

export type UserStatus = (typeof USER_STATUSES)[number]

export type User = {
  id: number
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string | null
  role: UserRole
  company_role: CompanyRole | null
  status: UserStatus
  created_at: string
  updated_at: string
}

export type UserPublic = Omit<User, "password">

export type UserCreate = Omit<
  User,
  "id" | "created_at" | "updated_at" | "status"
> & {
  status?: UserStatus
}

export type UserUpdate = Partial<
  Omit<User, "id" | "created_at" | "updated_at">
>
