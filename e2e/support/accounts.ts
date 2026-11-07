/**
 * Demo accounts of the E2E database, created by b2b_backend/scripts/seed.py.
 * They exist only in local and test databases, never on the working server.
 */

export type SessionRole = "customer" | "supplier"

export type Account = {
  email: string
  password: string
}

export const accounts = {
  admin: { email: "admin@example.com", password: "Admin123!" },
  buyer: { email: "buyer@example.com", password: "Buyer123!" },
  supplier: { email: "supplier@example.com", password: "Supplier123!" },
  /** One person with a buying and a selling profile. */
  both: { email: "both@example.com", password: "Both123!" },
} satisfies Record<string, Account>

/** Saved browser sessions, written by auth.setup.ts. */
export const sessions = {
  admin: "e2e/.auth/admin.json",
  buyer: "e2e/.auth/buyer.json",
  supplier: "e2e/.auth/supplier.json",
  bothBuyer: "e2e/.auth/both-buyer.json",
  bothSupplier: "e2e/.auth/both-supplier.json",
} as const

export const API_URL = process.env.E2E_API_URL ?? `http://localhost:${process.env.E2E_API_PORT ?? "8100"}/api/v1`
