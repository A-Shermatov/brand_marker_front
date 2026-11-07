import { describe, expect, it } from "vitest"
import { outcomeOf, outcomeView } from "@/lib/proposal-outcome"
import type { ProposalWithRelations } from "@/types"

const proposal = (over: Partial<ProposalWithRelations> = {}): ProposalWithRelations => ({
  id: 1,
  rfq_id: "rfq-1",
  supplier_actor_id: 3,
  price: 14500,
  currency: "TJS",
  delivery_time: "12",
  message: null,
  status: "viewed",
  created_at: "2026-11-07T10:00:00Z",
  attachment: null,
  ...over,
})

describe("proposal outcome", () => {
  it("says the buyer is still choosing, with the deadline", () => {
    const view = outcomeView({ kind: "waiting" }, "2026-12-07")
    expect(view.title).toBe("Покупатель ещё выбирает")
    expect(view.hint).toMatch(/^Приём КП до .*г\.$/)
    expect(view.tone).toBe("waiting")
  })

  it("names the supplier who got the order", () => {
    const view = outcomeView({ kind: "lost", winner_name: "ТехноСнаб" })
    expect(view.title).toBe("Выбран другой поставщик")
    expect(view.hint).toBe("Заказ получил «ТехноСнаб».")
    expect(view.action).toBeUndefined()
  })

  it("leads the winner to the deal", () => {
    const view = outcomeView({ kind: "won", contract_id: 42 })
    expect(view.title).toBe("Покупатель выбрал вас")
    expect(view.action).toEqual({ label: "Открыть сделку", href: "/supplier/contracts/42" })
    expect(outcomeView({ kind: "won", contract_id: null }).action?.href).toBe("/supplier/contracts")
  })

  it("prefers the outcome from the API over the status", () => {
    const lost = proposal({ status: "archived", outcome: { kind: "lost", winner_name: "А" } })
    expect(outcomeOf(lost)).toEqual({ kind: "lost", winner_name: "А" })
  })

  it.each([
    ["accepted", "won"],
    ["rejected", "rejected"],
    ["withdrawn", "withdrawn"],
    ["pending_supplier", "your_move"],
    ["archived", "closed"],
    ["submitted", "waiting"],
  ] as const)("reads %s without an API outcome as %s", (status, kind) => {
    expect(outcomeOf(proposal({ status })).kind).toBe(kind)
  })
})
