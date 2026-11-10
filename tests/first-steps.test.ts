import { describe, expect, it } from "vitest"
import { buildBuyerFirstSteps, buildSupplierFirstSteps } from "@/lib/process/first-steps"
import type { ContractWithRelations, PaymentMilestone } from "@/types"

type Deal = Pick<ContractWithRelations, "id" | "status" | "payment_type" | "payment_plan" | "dispute">

const milestone = (status: PaymentMilestone["status"]): PaymentMilestone => ({
  id: 1,
  contract_id: 7,
  title: "Оплата",
  percentage: 100,
  amount: 5000,
  trigger: "contract_signed",
  status,
})

const deal = (status: Deal["status"], paid: PaymentMilestone["status"] = "awaiting_payment"): Deal => ({
  id: 7,
  status,
  payment_type: "full_prepayment",
  payment_plan: { id: 1, contract_id: 7, payment_type: "full_prepayment", milestones: [milestone(paid)] },
  dispute: null,
})

const done = (steps: { id: string; done: boolean }[]) => steps.filter((s) => s.done).map((s) => s.id)
const current = (steps: { id: string; done: boolean }[]) => steps.find((s) => !s.done)?.id

describe("first steps of a buyer", () => {
  it("starts an empty account at the request, with the catalogue as the other way in", () => {
    const steps = buildBuyerFirstSteps({ rfqs: [], offers: [], contracts: [] })
    expect(done(steps)).toEqual([])
    expect(current(steps)).toBe("ask")
    expect(steps[0]!.actions!.map((a) => a.href)).toEqual(["/customer/rfqs/new", "/customer/catalog"])
  })

  it("sends a saved draft back to be finished", () => {
    const steps = buildBuyerFirstSteps({
      rfqs: [{ id: "rfq-1", status: "draft", title: "Ноутбуки" }],
      offers: [],
      contracts: [],
    })
    expect(current(steps)).toBe("ask")
    expect(steps[0]!.actions![0]!.href).toBe("/customer/rfqs/rfq-1/edit")
  })

  it("points at the request with the most offers once offers arrive", () => {
    const steps = buildBuyerFirstSteps({
      rfqs: [
        { id: "rfq-1", status: "published", title: "Ноутбуки" },
        { id: "rfq-2", status: "receiving_proposals", title: "Бумага" },
      ],
      offers: [
        { rfqId: "rfq-1", count: 1 },
        { rfqId: "rfq-2", count: 4 },
      ],
      contracts: [],
    })
    expect(done(steps)).toEqual(["ask"])
    expect(current(steps)).toBe("choose")
    expect(steps[1]!.text).toContain("Пришло 5 предложений")
    expect(steps[1]!.actions![0]!.href).toBe("/customer/rfqs/rfq-2")
  })

  it("moves to payment when a deal waits for it, and on to acceptance when it is paid", () => {
    const waiting = buildBuyerFirstSteps({ rfqs: [], offers: [], contracts: [deal("pending_payment")] })
    expect(done(waiting)).toEqual(["ask", "choose"])
    expect(current(waiting)).toBe("pay")
    expect(waiting[2]!.actions![0]).toEqual({ label: "Перейти к оплате", href: "/customer/contracts/7" })

    const paid = buildBuyerFirstSteps({ rfqs: [], offers: [], contracts: [deal("delivered", "funded")] })
    expect(current(paid)).toBe("accept")
    expect(paid[3]!.actions![0]!.label).toBe("Проверить и принять")
  })

  it("is finished after the first accepted deal", () => {
    const steps = buildBuyerFirstSteps({ rfqs: [], offers: [], contracts: [deal("completed", "released")] })
    expect(steps.every((s) => s.done)).toBe(true)
  })
})

describe("first steps of a supplier", () => {
  const base = { profileGaps: [], newRfqCount: 0, proposalCount: 0, contracts: [], hasPayoutAccount: true }

  it("lists what the profile still misses and leads to the first gap", () => {
    const steps = buildSupplierFirstSteps({
      ...base,
      profileGaps: [
        { label: "товар или услуга в каталоге", cta: "Добавить товар", href: "/supplier/catalog/new" },
        { label: "счёт для выплат", cta: "Добавить счёт", href: "/supplier/finance#payout" },
      ],
      hasPayoutAccount: false,
    })
    expect(current(steps)).toBe("profile")
    expect(steps[0]!.text).toContain("товар или услуга в каталоге, счёт для выплат")
    expect(steps[0]!.actions![0]).toEqual({ label: "Добавить товар", href: "/supplier/catalog/new" })
    expect(steps[3]!.actions![0]!.href).toBe("/supplier/finance#payout")
  })

  it("asks for an offer and says how many requests wait", () => {
    const steps = buildSupplierFirstSteps({ ...base, newRfqCount: 9 })
    expect(current(steps)).toBe("offer")
    expect(steps[1]!.text).toContain("9 заявок покупателей ждут ответа")
  })

  it("follows the deal to delivery and to the money", () => {
    const working = buildSupplierFirstSteps({ ...base, proposalCount: 2, contracts: [deal("active", "funded")] })
    expect(current(working)).toBe("deliver")
    expect(working[2]!.actions![0]!.href).toBe("/supplier/contracts/7")

    const delivered = buildSupplierFirstSteps({ ...base, contracts: [deal("delivered", "funded")] })
    expect(current(delivered)).toBe("money")

    const paid = buildSupplierFirstSteps({ ...base, contracts: [deal("completed", "released")] })
    expect(paid.every((s) => s.done)).toBe(true)
  })
})
