import { describe, expect, it, vi } from "vitest"
import { isSectionHubRoot } from "@/components/layout/section-hub"
import { BUYER_HUBS, SUPPLIER_HUBS, groupHubs, hubsFor } from "@/lib/cabinet-nav"

// Hoisted by Vitest above the imports.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

describe("section header", () => {
  it.each([
    ["/admin/disputes", true],
    ["/admin/chats", true],
    ["/supplier/trust", true],
    ["/supplier/subscription", true],
    ["/customer/rfqs", true],
  ])("owns the title on the list page %s", (path, expected) => {
    expect(isSectionHubRoot(path)).toBe(expected)
  })

  it.each([
    "/admin/contracts/9",
    "/admin/disputes/12",
    "/supplier/contracts/2",
    "/customer/rfqs/new",
    "/customer/company/new",
  ])("steps aside on the detail page %s", (path) => {
    expect(isSectionHubRoot(path)).toBe(false)
  })

  it("names every page of the menu, with tabs or without", () => {
    expect(isSectionHubRoot("/customer/suppliers")).toBe(true)
    expect(isSectionHubRoot("/customer/payments")).toBe(true)
    expect(isSectionHubRoot("/supplier/proposals")).toBe(true)
    expect(isSectionHubRoot("/supplier/finance")).toBe(true)
  })

  it("is absent on the home page and outside the cabinets", () => {
    expect(isSectionHubRoot("/supplier")).toBe(false)
    expect(isSectionHubRoot("/customer")).toBe(false)
    expect(isSectionHubRoot("/services")).toBe(false)
  })
})

describe("cabinet menu", () => {
  const labels = (hubs: { label: string }[]) => hubs.map((hub) => hub.label)

  it("has no company pages for a private person", () => {
    expect(labels(hubsFor(BUYER_HUBS, "individual"))).not.toContain("Компания")
    expect(labels(hubsFor(BUYER_HUBS, "individual"))).not.toContain("Согласования")
    expect(labels(hubsFor(SUPPLIER_HUBS, "individual"))).not.toContain("Компания")
    expect(labels(hubsFor(BUYER_HUBS, "individual"))).toContain("Мой профиль")
  })

  it("shows the company pages to someone working for a company", () => {
    expect(labels(hubsFor(BUYER_HUBS, "company"))).toEqual(expect.arrayContaining(["Компания", "Согласования"]))
    expect(labels(hubsFor(SUPPLIER_HUBS, "company"))).toContain("Компания")
  })

  it("keeps the menu short and in named groups", () => {
    for (const hubs of [BUYER_HUBS, SUPPLIER_HUBS]) {
      const groups = groupHubs(hubsFor(hubs, "company"))
      expect(groups[0].label).toBeNull()
      expect(labels(groups[0].hubs)).toEqual(["Главная"])
      expect(groups.slice(1).every((group) => Boolean(group.label))).toBe(true)
      expect(groups.every((group) => group.hubs.length <= 5)).toBe(true)
    }
  })

  it("gives every page one place in the menu", () => {
    for (const hubs of [BUYER_HUBS, SUPPLIER_HUBS]) {
      const names = labels(hubs)
      expect(new Set(names).size).toBe(names.length)
      const links = hubs.map((hub) => hub.href.split("?")[0])
      expect(new Set(links).size).toBe(links.length)
    }
  })
})
