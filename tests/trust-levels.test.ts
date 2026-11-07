import { describe, expect, it } from "vitest"
import {
  normalizeReputationTier,
  pickReputationTier,
  reputationTierHint,
  reputationTierLabel,
  resolveReputationTier,
  TRUST_LEVELS,
} from "@/lib/trust-levels"

const tier = (completed: number, rating: number, successRate: number | null, status = "verified") =>
  resolveReputationTier({
    verification_status: status,
    completed_contracts: completed,
    rating,
    success_rate: successRate,
  })

describe("reliability ladder", () => {
  // Same table as the backend test (tests/test_trust_levels.py), so both sides agree.
  it.each([
    [9, 5.0, 100, "none"],
    [10, 4.5, 90, "silver"],
    [39, 5.0, 100, "silver"],
    [40, 4.7, 95, "gold"],
    [99, 5.0, 100, "gold"],
    [100, 4.8, 98, "diamond"],
    [100, 4.79, 99, "gold"],
    [100, 5.0, 97.9, "gold"],
    [40, 4.6, 100, "silver"],
    [10, 4.4, 100, "none"],
  ] as const)("%i deals, rating %f, %f%% without disputes → %s", (completed, rating, rate, expected) => {
    expect(tier(completed, rating, rate)).toBe(expected)
  })

  it("gives nothing before the documents are checked", () => {
    expect(tier(500, 5, 100, "pending")).toBe("none")
  })

  it("is ordered from the lowest to the highest mark", () => {
    expect(TRUST_LEVELS.map((l) => l.id)).toEqual(["silver", "gold", "diamond"])
    const deals = TRUST_LEVELS.map((l) => l.minCompleted)
    expect([...deals].sort((a, b) => a - b)).toEqual(deals)
  })
})

describe("tier helpers", () => {
  it("maps the old ladder values to no mark", () => {
    expect(normalizeReputationTier("shield")).toBe("none")
    expect(normalizeReputationTier("verified")).toBe("none")
    expect(normalizeReputationTier("DIAMOND")).toBe("diamond")
  })

  it("trusts the tier from the API, counting only demo data locally", () => {
    const strong = { verification_status: "verified", completed_contracts: 12, rating: 4.6, success_rate: 95 }
    expect(pickReputationTier("gold", { verification_status: "pending" })).toBe("gold")
    // The API may say "none" on purpose (admin removed the mark, lost disputes as a buyer).
    expect(pickReputationTier("none", strong)).toBe("none")
    expect(pickReputationTier(undefined, strong)).toBe("silver")
  })

  it("names the marks and says they cannot be bought", () => {
    expect(reputationTierLabel("diamond")).toBe("Алмаз")
    expect(reputationTierLabel(null)).toBe("Без знака")
    expect(reputationTierHint("gold")).toContain("купить нельзя")
  })
})
