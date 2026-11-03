import { describe, expect, it, vi } from "vitest"
import { isSectionHubRoot } from "@/components/layout/section-hub"

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

  it("is absent where a section has no tabs", () => {
    expect(isSectionHubRoot("/supplier")).toBe(false)
    expect(isSectionHubRoot("/customer/suppliers")).toBe(false)
    expect(isSectionHubRoot("/services")).toBe(false)
  })
})
