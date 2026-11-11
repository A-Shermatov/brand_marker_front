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
  it("draws the diamond as a crystal shield with a metal rim, bevels and our B", () => {
    const out = html(<TrustMark tier="diamond" size={64} />)
    expect(out).toContain('data-tier="diamond"')
    // 8 rim bevels + 8 inner bevels + 8 face facets + glow, highlights and outlines
    expect(count(out, "<polygon")).toBeGreaterThanOrEqual(28)
    expect(out).toContain('data-part="logo"')
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

  it("keeps the diamond calm in the middle sizes: glow and streak, no float, edge lights or halo round the B", () => {
    const out = html(<TrustMark tier="diamond" size={26} />)
    expect(out).toContain("bm-glow-diamond")
    expect(out).toContain("bm-d-streak")
    expect(out).not.toContain("bm-d-idle")
    expect(out).not.toContain("bm-d-edge")
    expect(out).not.toContain("bm-d-letter-glow")
    expect(out).toContain('data-part="logo"')
  })

  it.each(["none", "silver", "gold", "diamond"] as const)(
    "draws a sharp small %s next to a name: no blur, glow or hairlines",
    (tier) => {
      for (const size of [16, 18, 20, 24]) {
        const out = html(<TrustMark tier={tier} size={size} />)
        expect(out).toContain('data-size="small"')
        expect(out).toContain('viewBox="0 0 20 20"')
        expect(out).not.toMatch(/<filter|feGaussianBlur|bm-glow-|bm-d-idle|bm-d-edge|bm-mark-sweep/)
        // Every stroke at least 0.9 of the 20-unit grid: about a pixel at 16 px.
        const widths = [...out.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1]))
        expect(widths.every((w) => w >= 0.9)).toBe(true)
      }
    },
  )

  it("keeps our B on a small diamond and moves only its light streak", () => {
    const out = html(<TrustMark tier="diamond" size={18} />)
    expect(out).toContain('data-part="logo"')
    expect(out).toContain("bm-d-streak")
    expect(html(<TrustMark tier="diamond" size={18} still />)).not.toContain("bm-d-streak")
  })

  it("draws a still diamond without any motion", () => {
    const out = html(<TrustMark tier="diamond" size={88} still />)
    expect(out).not.toMatch(/bm-d-|bm-glow-/)
    expect(out).toContain('data-part="logo"')
  })

  it.each(["silver", "gold", "diamond"] as const)("puts our B with its cut triangle in the middle of %s", (tier) => {
    for (const size of [18, 48]) {
      const out = html(<TrustMark tier={tier} size={size} />)
      expect(out).toContain('data-part="logo"')
      expect(out).toMatch(/<mask id="[^"]+-cut"/)
    }
    // The empty mark has no B: it is not earned yet.
    expect(html(<TrustMark tier="none" size={48} />)).not.toContain('data-part="logo"')
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
    ["start", 1],
    ["pro", 2],
    ["business", 3],
  ] as const)("%s shows its level as %i rank chevrons, small and large", (plan, ranks) => {
    for (const size of [16, 40]) {
      const out = html(<PlanMark plan={plan} size={size} />)
      expect(out).toContain(`data-plan="${plan}"`)
      expect(out).toContain(`data-glyph="rank-${ranks}"`)
      const glyph = out.slice(out.indexOf(`data-glyph="rank-${ranks}"`))
      expect(count(glyph.slice(0, glyph.indexOf("</g>")), "<path")).toBe(ranks)
    }
  })

  it("animates each plan in its own way", () => {
    expect(html(<PlanMark plan="start" />)).toContain("bm-plan-flash")
    expect(html(<PlanMark plan="start" />)).not.toContain("bm-plan-sweep")
    expect(html(<PlanMark plan="pro" />)).toContain("bm-plan-sweep")
    const business = html(<PlanMark plan="business" size={40} />)
    expect(business).toContain("bm-plan-sweep")
    expect(business).toContain("bm-tw")
    // Small tiles keep the sweep but drop the sparkle, which is noise at 16 px.
    expect(html(<PlanMark plan="business" size={16} />)).toContain("bm-plan-sweep")
    expect(html(<PlanMark plan="business" size={16} />)).not.toContain("bm-tw")
  })

  it.each(["start", "pro", "business"] as const)("draws a sharp small %s tile", (plan) => {
    for (const size of [15, 16, 18, 20]) {
      const out = html(<PlanMark plan={plan} size={size} />)
      expect(out).toContain('data-size="small"')
      expect(out).toContain(`data-plan="${plan}"`)
      expect(out).not.toMatch(/<filter|feGaussianBlur/)
      const widths = [...out.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1]))
      expect(widths.every((w) => w >= 0.9)).toBe(true)
    }
    expect(html(<PlanMark plan={plan} size={40} />)).not.toContain('data-size="small"')
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
    expect(planMarkHint("pro")).toContain("платная подписка")
    expect(planMarkHint("pro")).toContain("не знак надёжности")
    expect(normalizePlan("Business")).toBe("business")
  })
})

describe("CompanyName", () => {
  it("puts marks in a fixed order: check, then reliability", () => {
    const out = html(<CompanyName name="ТехноСнаб" verified tier="gold" />)
    const seal = out.indexOf("проверена по документам")
    const trust = out.indexOf('data-tier="gold"')
    expect(seal).toBeGreaterThan(-1)
    expect(seal).toBeLessThan(trust)
  })

  it("never draws a plan mark next to the name: one mark is enough", () => {
    // A paid plan shows as a highlighted card in lists, not as a second logo by the name.
    const marks = { verified: true, tier: "gold", plan: "business" }
    const out = html(<CompanyName name="ТехноСнаб" {...marks} />)
    expect(out).toContain('data-tier="gold"')
    expect(out).not.toContain("data-plan")
  })

  it("shows only the name when there is nothing to show", () => {
    const out = html(<CompanyName name="Новая компания" tier="none" />)
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
