import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CompanyName } from "@/components/bm/company-name"
import { FreePlanMark, PlanMark } from "@/components/bm/plan-mark"
import { TrustMark } from "@/components/bm/trust-mark"
import { ReputationBadge } from "@/components/bm/reputation-badge"
import { normalizePlan, planMarkHint } from "@/lib/subscription"

const html = (node: React.ReactElement) => renderToStaticMarkup(node)
const count = (source: string, needle: string) => source.split(needle).length - 1

describe("TrustMark", () => {
  it("draws the diamond as a crystal shield with a metal rim, bevels and a B", () => {
    const out = html(<TrustMark tier="diamond" size={64} />)
    expect(out).toContain('data-tier="diamond"')
    // 8 rim bevels + 8 inner bevels + 8 face facets + glow, highlights and outlines
    expect(count(out, "<polygon")).toBeGreaterThanOrEqual(28)
    expect(out).toContain('data-part="letter"')
    expect(out).toContain('aria-label="Знак надёжности «Алмаз»')
  })

  it("runs the full idle loop on large diamonds, without particles", () => {
    const out = html(<TrustMark tier="diamond" size={64} />)
    for (const part of ["bm-glow-diamond", "bm-d-idle", "bm-d-pulse", "bm-d-letter-glow", "bm-d-streak"]) {
      expect(out).toContain(part)
    }
    expect(count(out, "bm-d-edge")).toBe(2)
    expect(out).not.toContain("bm-tw")
  })

  it("keeps the diamond calm next to a name: glow and streak, no float, edge lights or letter halo", () => {
    const out = html(<TrustMark tier="diamond" size={18} />)
    expect(out).toContain("bm-glow-diamond")
    expect(out).toContain("bm-d-streak")
    expect(out).not.toContain("bm-d-idle")
    expect(out).not.toContain("bm-d-edge")
    expect(out).not.toContain("bm-d-letter-glow")
    expect(out).toContain('data-part="letter"')
  })

  it("draws a still diamond without any motion", () => {
    const out = html(<TrustMark tier="diamond" size={88} still />)
    expect(out).not.toMatch(/bm-d-|bm-glow-/)
    expect(out).toContain('data-part="letter"')
  })

  it("can be still and decorative", () => {
    const out = html(<TrustMark tier="gold" size={48} still decorative />)
    expect(out).not.toContain("bm-mark-sweep")
    expect(out).not.toContain("bm-glow-gold")
    expect(out).toContain('aria-hidden="true"')
    expect(out).not.toContain("<title>")
  })

  it("gives every element its own gradient ids", () => {
    const out = html(
      <>
        <TrustMark tier="silver" />
        <TrustMark tier="silver" />
      </>,
    )
    const ids = [...out.matchAll(/id="([^"]+silver-rim)"/g)].map((m) => m[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})

describe("PlanMark", () => {
  it.each([
    ["start", "bolt"],
    ["pro", "crown"],
    ["business", "gem"],
  ] as const)("%s shows its own glyph (%s)", (plan, glyph) => {
    const out = html(<PlanMark plan={plan} />)
    expect(out).toContain(`data-plan="${plan}"`)
    expect(out).toContain(`data-glyph="${glyph}"`)
  })

  it("animates each plan in its own way", () => {
    expect(html(<PlanMark plan="start" />)).toContain("bm-plan-flash")
    expect(html(<PlanMark plan="start" />)).not.toContain("bm-plan-sweep")
    expect(html(<PlanMark plan="pro" />)).toContain("bm-plan-sweep")
    const business = html(<PlanMark plan="business" />)
    expect(business).toContain("bm-plan-sweep")
    expect(business).toContain("bm-tw")
  })

  it("still marks do not move", () => {
    for (const plan of ["start", "pro", "business"]) {
      const out = html(<PlanMark plan={plan} still />)
      expect(out).not.toMatch(/bm-plan-flash|bm-plan-sweep|bm-tw/)
    }
  })

  it("draws the free tier only on demand and never animates it", () => {
    const out = html(<FreePlanMark />)
    expect(out).toContain('data-glyph="check"')
    expect(out).toContain('aria-hidden="true"')
    expect(out).not.toMatch(/bm-plan-flash|bm-plan-sweep/)
  })

  it("renders nothing without a paid plan", () => {
    expect(html(<PlanMark plan="none" />)).toBe("")
    expect(html(<PlanMark plan={null} />)).toBe("")
    expect(html(<PlanMark plan="vip" />)).toBe("")
  })

  it("tells buyers the plan is paid promotion", () => {
    expect(planMarkHint("pro")).toContain("платное продвижение")
    expect(normalizePlan("Business")).toBe("business")
  })
})

describe("CompanyName", () => {
  it("puts marks in a fixed order: check, reliability, plan", () => {
    const out = html(<CompanyName name="ТехноСнаб" verified tier="gold" plan="pro" />)
    const seal = out.indexOf("проверена по документам")
    const trust = out.indexOf('data-tier="gold"')
    const plan = out.indexOf('data-plan="pro"')
    expect(seal).toBeGreaterThan(-1)
    expect(seal).toBeLessThan(trust)
    expect(trust).toBeLessThan(plan)
  })

  it("shows only the name when there is nothing to show", () => {
    const out = html(<CompanyName name="Новая компания" tier="none" plan="none" />)
    expect(out).toContain("Новая компания")
    expect(out).not.toContain("data-tier")
    expect(out).not.toContain("data-plan")
  })

  it("can render the name as the page heading", () => {
    expect(html(<CompanyName as="h1" name="ТехноСнаб" />)).toMatch(/^<span[^>]*><h1/)
  })
})

describe("ReputationBadge", () => {
  it("labels the earned mark and hides itself without one", () => {
    expect(html(<ReputationBadge tier="diamond" />)).toContain("Алмаз")
    expect(html(<ReputationBadge tier="none" />)).toBe("")
  })
})
