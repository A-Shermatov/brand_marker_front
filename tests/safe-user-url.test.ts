import { describe, expect, it } from "vitest"
import { safeUserUrl } from "@/lib/file-url"

describe("safeUserUrl", () => {
  it("keeps web links, site paths and blob previews", () => {
    expect(safeUserUrl("https://example.com/a")).toBe("https://example.com/a")
    expect(safeUserUrl("HTTP://example.com")).toBe("HTTP://example.com")
    expect(safeUserUrl("/uploads/contracts/1/a.pdf")).toBe("/uploads/contracts/1/a.pdf")
    expect(safeUserUrl("blob:https://site/1")).toBe("blob:https://site/1")
  })

  it("drops script, data and other schemes", () => {
    expect(safeUserUrl("javascript:alert(1)")).toBe("")
    expect(safeUserUrl(" JaVaScRiPt:alert(1)")).toBe("")
    expect(safeUserUrl("data:text/html,<b>x</b>")).toBe("")
    expect(safeUserUrl("file:///etc/passwd")).toBe("")
    expect(safeUserUrl("//evil.example/x")).toBe("")
    expect(safeUserUrl("#")).toBe("")
  })
})
