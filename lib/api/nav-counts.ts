import { apiFetch } from "./client"

export type BuyerNavSection = "rfqs" | "deals" | "approvals"
export type SupplierNavSection = "rfqs" | "deals" | "catalog"

export type BuyerNavCounts = {
  rfqs: number
  rfqs_new: number
  deals: number
  deals_new: number
  messages: number
  approvals: number
  approvals_new: number
}

export type SupplierNavCounts = {
  rfqs: number
  rfqs_new: number
  deals: number
  deals_new: number
  messages: number
  catalog: number
  catalog_new: number
}

export type AdminNavCounts = {
  companies: number
  /** `catalog` and `reports` together. */
  moderation: number
  /** Positions waiting for approval. */
  catalog: number
  /** Open complaints. */
  reports: number
  support: number
  chats: number
  disputes: number
  finance: number
}

export type NavCountsRole = "buyer" | "supplier" | "admin"

export type NavCountsForRole<R extends NavCountsRole> = R extends "buyer"
  ? BuyerNavCounts
  : R extends "supplier"
    ? SupplierNavCounts
    : AdminNavCounts

const PATH: Record<NavCountsRole, string> = {
  buyer: "/buyer/nav-counts",
  supplier: "/supplier/nav-counts",
  admin: "/admin/nav-counts",
}

export const navCountsApi = {
  get: <R extends NavCountsRole>(role: R) =>
    apiFetch<NavCountsForRole<R>>(PATH[role]),

  markSeen: (role: "buyer" | "supplier", section: string) =>
    apiFetch<{ ok: boolean }>(`/${role}/nav-seen`, {
      method: "POST",
      body: JSON.stringify({ section }),
    }),
}
