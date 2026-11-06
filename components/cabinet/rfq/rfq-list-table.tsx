"use client"

import Link from "next/link"
import type { RfqWithRelations } from "@/types"
import { StatusBadge } from "@/components/bm"
import { useCategoryOptions } from "@/hooks/use-category-options"
import {
  buyerRfqBadgeLabel,
  buyerRfqBadgeStatus,
  isModeratedRfq,
} from "@/lib/buyer-rfq-display"
import { formatIsoDate, formatRfqBudget, pluralRu } from "@/lib/format"

type RfqListTableProps = {
  rfqs: RfqWithRelations[]
  getProposalCount: (rfqId: string) => number
}

const formatRfqNo = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  const short = (digits || rfqId).slice(-4)
  return `З‑${short}`
}

const positionsLabel = (rfq: RfqWithRelations): string => {
  if (rfq.type === "product") {
    const n = rfq.quantity
    return `${n} ${pluralRu(n, "шт.", "шт.", "шт.")}`
  }
  return "1 позиция"
}

const rfqHref = (rfq: RfqWithRelations) => `/customer/rfqs/${rfq.id}`

export const RfqListTable = ({ rfqs, getProposalCount }: RfqListTableProps) => {
  const { getRfqCategoryLabel } = useCategoryOptions()

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              {(
                [
                  "№",
                  "Заявка",
                  "Позиции",
                  "Бюджет",
                  "Приём КП до",
                  "КП",
                  "Статус",
                ] as const
              ).map((label) => (
                <th
                  key={label}
                  className="px-5 py-3.5 text-left text-[13px] font-semibold text-mute"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rfqs.map((rfq) => {
              const href = rfqHref(rfq)
              const n = getProposalCount(rfq.id)
              const collecting =
                rfq.status === "published" || rfq.status === "receiving_proposals"
              return (
                <tr key={rfq.id} className="hover:bg-canvas">
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <Link href={href} className="mono text-mute">
                      {formatRfqNo(rfq.id)}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={href} className="block min-w-0">
                      <b className="font-semibold text-ink line-clamp-2">{rfq.title}</b>
                      <div className="text-[12.5px] text-mute">
                        {getRfqCategoryLabel(rfq.category_id)}
                      </div>
                      {isModeratedRfq(rfq) ? (
                        <div className="mt-1 text-[12.5px] text-red-700">
                          Снята модератором
                          {rfq.moderation_reason ? `: ${rfq.moderation_reason}` : ""}
                        </div>
                      ) : null}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-ink">
                    <Link href={href} className="block">
                      {positionsLabel(rfq)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <Link href={href} className="mono text-ink">
                      {formatRfqBudget(
                        rfq.budget_type,
                        rfq.budget_from,
                        rfq.budget_to,
                        rfq.currency,
                      )}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink">
                    <Link href={href} className="block">
                      {rfq.deadline ? formatIsoDate(rfq.deadline) : "—"}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={href}
                      className={
                        n && collecting
                          ? "mono font-semibold text-brand-700"
                          : "mono text-ink"
                      }
                    >
                      {n}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={href} className="inline-flex">
                      <StatusBadge
                        status={buyerRfqBadgeStatus(rfq.status)}
                        label={buyerRfqBadgeLabel(rfq.status)}
                      />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 md:hidden">
        {rfqs.map((rfq) => {
          const href = rfqHref(rfq)
          const n = getProposalCount(rfq.id)
          return (
            <li key={rfq.id}>
              <Link
                href={href}
                className="grid gap-2 rounded-2xl border border-line bg-white p-4 hover:bg-canvas"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="mono text-[12.5px] text-mute">
                      {formatRfqNo(rfq.id)}
                    </span>
                    <b className="block font-semibold text-ink line-clamp-2">
                      {rfq.title}
                    </b>
                    <span className="text-[12.5px] text-mute">
                      {getRfqCategoryLabel(rfq.category_id)}
                    </span>
                  </span>
                  <StatusBadge
                    status={buyerRfqBadgeStatus(rfq.status)}
                    label={buyerRfqBadgeLabel(rfq.status)}
                  />
                </span>
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                  <span className="mono font-semibold">
                    {formatRfqBudget(
                      rfq.budget_type,
                      rfq.budget_from,
                      rfq.budget_to,
                      rfq.currency,
                    )}
                  </span>
                  <span className="text-mute">
                    до {rfq.deadline ? formatIsoDate(rfq.deadline) : "—"}
                  </span>
                  <span className="mono text-mute">КП: {n}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
