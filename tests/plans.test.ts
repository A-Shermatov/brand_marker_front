import { describe, expect, it, vi } from "vitest"
import { isSectionHubRoot } from "@/components/layout/section-hub"
import { BUYER_HUBS, BUYER_SUBTABS, SUPPLIER_HUBS, SUPPLIER_SUBTABS, hubsFor } from "@/lib/cabinet-nav"
import { sortSupplierBoardRfqs } from "@/lib/rfq-board"
import { PLAN_SIDE_COPY, planFeatures, plans } from "@/lib/subscription"
import type { RfqWithRelations } from "@/types"

// Hoisted by Vitest above the imports.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

describe("a plan per cabinet", () => {
  it("promises each cabinet its own things", () => {
    for (const plan of plans) {
      const selling = planFeatures(plan, "supplier")
      const buying = planFeatures(plan, "buyer")
      expect(selling.length).toBeGreaterThan(0)
      expect(buying.length).toBeGreaterThan(0)
      // The buying cabinet posts requests; goods, offers and company limits are the seller's.
      expect(buying.join(" ")).not.toMatch(/товар|предложени|позици|компани/i)
      expect(buying.join(" ")).toMatch(/заявк|тариф/i)
    }
    expect(planFeatures(plans[0], "supplier").join(" ")).toMatch(/каталог/i)
  })

  it("no longer promises a mark next to the name", () => {
    const everything = plans.flatMap((plan) => [...plan.features, ...plan.buyerFeatures]).join(" ")
    expect(everything).not.toMatch(/значок/i)
    expect(everything).toMatch(/В топе/)
  })

  it("has a tariff page in each cabinet, under the same menu item", () => {
    expect(PLAN_SIDE_COPY.buyer.href).toBe("/customer/plan")
    expect(PLAN_SIDE_COPY.supplier.href).toBe("/supplier/subscription")
    for (const [hubs, tabs] of [
      [BUYER_HUBS, BUYER_SUBTABS],
      [SUPPLIER_HUBS, SUPPLIER_SUBTABS],
    ] as const) {
      // A private person and a company alike: the tariff is not a company page.
      for (const kind of ["individual", "company"] as const) {
        const hub = hubsFor(hubs, kind).find((item) => item.id === "tariff")
        expect(hub?.label).toBe("Тариф и надёжность")
      }
      expect(tabs.tariff.map((tab) => tab.label)).toEqual(["Подписка", "Знак надёжности"])
    }
    for (const path of ["/customer/plan", "/customer/trust", "/supplier/subscription", "/supplier/trust"]) {
      expect(isSectionHubRoot(path)).toBe(true)
    }
    expect(isSectionHubRoot("/customer/plan/return")).toBe(false)
  })
})

describe("the supplier's feed of requests", () => {
  const rfq = (id: string, extra: Partial<RfqWithRelations> = {}) =>
    ({ id, title: id, ...extra }) as RfqWithRelations
  const invited = (item: RfqWithRelations) => item.id === "invited"

  it("puts an order that waits for the supplier first, then the subscribers' requests", () => {
    const feed = [
      rfq("plain-new"),
      rfq("invited"),
      rfq("catalog", { catalog_item_id: 7 }),
      rfq("promoted-pro", { promoted: true, promotion_plan: "pro" }),
      rfq("waits-for-me", { my_proposal_status: "pending_supplier" }),
      rfq("promoted-start", { promoted: true, promotion_plan: "start" }),
      rfq("plain-old"),
    ]
    expect(sortSupplierBoardRfqs(feed, 1, invited).map((item) => item.id)).toEqual([
      "waits-for-me",
      // The server already sorted these by plan: that order is kept.
      "promoted-pro",
      "promoted-start",
      "catalog",
      "invited",
      "plain-new",
      "plain-old",
    ])
  })

  it("keeps the server's order when no one holds a plan", () => {
    const feed = [rfq("c"), rfq("a"), rfq("b")]
    expect(sortSupplierBoardRfqs(feed, 1, () => false).map((item) => item.id)).toEqual(["c", "a", "b"])
  })
})
