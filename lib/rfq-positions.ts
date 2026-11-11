import type { Rfq } from "@/types"

export type RfqPosition = {
  name: string
  /** «25 шт», as the buyer wrote it. */
  amount: string
}

export type RfqNeed = {
  positions: RfqPosition[]
  /** What the buyer added in their own words: wishes for goods, the task for a service. */
  text: string
}

// A line of the goods form: «Ноутбук 15″ — 25 шт».
const POSITION_LINE = /^(.*?)\s*—\s*(\d+(?:[.,]\d+)?)\s+(\S+)\s*$/

/**
 * What a request asks for, split the way a reader takes it in: the list of
 * positions, then the free text. Goods written with the request form keep
 * their lines; anything else is one position named after the request.
 */
export const readRfqNeed = (rfq: Pick<Rfq, "type" | "title" | "description"> & { quantity?: number }): RfqNeed => {
  const description = (rfq.description ?? "").trim()
  if (rfq.type !== "product") return { positions: [], text: description }

  const [first = "", ...rest] = description.split(/\n\n+/)
  const lines = first
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const parsed = lines.map((line) => POSITION_LINE.exec(line))
  if (lines.length > 0 && parsed.every(Boolean)) {
    return {
      positions: parsed.map((match) => ({
        name: match![1].trim(),
        amount: `${match![2].replace(",", ".")} ${match![3]}`,
      })),
      text: rest.join("\n\n").trim(),
    }
  }
  return {
    positions: [{ name: rfq.title, amount: `${rfq.quantity ?? 1} шт` }],
    text: description,
  }
}
