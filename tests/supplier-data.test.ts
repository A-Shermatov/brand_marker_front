import { describe, expect, it } from "vitest"
import { translateApiMessage } from "@/lib/api/error-messages"
import { mapCatalogItemToService, mapPublicSupplierToPerformer } from "@/lib/marketplace-hybrid"
import { supplierMarks } from "@/lib/supplier-marks"
import type { CatalogItemWithRelations, PublicSupplier } from "@/types"

const supplier = (patch: Partial<PublicSupplier> = {}): PublicSupplier =>
  ({
    actor_id: 7,
    kind: "company",
    display_name: "ТехноСнаб",
    company_id: 3,
    city: "Душанбе",
    country: "Таджикистан",
    description: null,
    website: null,
    logo: null,
    rating: 4.9,
    verification_status: "verified",
    reviews_count: 12,
    industries: [],
    active_catalog_count: 4,
    trust_level: "verified",
    reputation_tier: "none",
    completed_contracts: 120,
    active_contracts: 2,
    disputed_contracts: 0,
    success_rate: 100,
    subscription_plan: "business",
    ...patch,
  }) as PublicSupplier

describe("supplierMarks", () => {
  it("reads the check, tier and plan from the public profile", () => {
    expect(supplierMarks(supplier())).toEqual({ verified: true, tier: "diamond", plan: "business" })
  })

  it("falls back to no plan and no mark", () => {
    expect(
      supplierMarks(
        supplier({ verification_status: "pending", subscription_plan: undefined }),
      ),
    ).toEqual({ verified: false, tier: "none", plan: null })
  })
})

describe("marketplace mappers", () => {
  it("passes marks to supplier cards and does not invent a rating", () => {
    const performer = mapPublicSupplierToPerformer(supplier({ rating: 0, reviews_count: 0 }))
    expect(performer.rating).toBe(0)
    expect(performer.plan).toBe("business")
    expect(performer.tier).toBe("none")
  })

  it("passes marks to catalog cards", () => {
    const item = {
      id: 1,
      actor_id: 7,
      type: "product",
      category_id: 1,
      title: "Бумага А4",
      description: null,
      status: "active",
      created_at: "2026-11-01T00:00:00Z",
      attributes: [],
      pricing: null,
      media: [],
      stats: null,
    } as unknown as CatalogItemWithRelations
    const service = mapCatalogItemToService(item, null, supplier({ reputation_tier: "gold" }))
    expect(service.providerTier).toBe("gold")
    expect(service.providerPlan).toBe("business")
    expect(service.verified).toBe(true)
  })
})

describe("API messages", () => {
  it("translates known errors and keeps unknown ones", () => {
    expect(translateApiMessage("Account cannot sign in with this role")).toMatch(/нет такой роли/)
    expect(translateApiMessage("Something new")).toBe("Something new")
  })
})
