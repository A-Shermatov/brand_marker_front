"use client"

import Link from "next/link"
import type { ProposalStatus, RfqWithRelations } from "@/types"
import { StatusBadge } from "@/components/bm"
import { cn } from "@/lib/utils"
import {
  formatCurrency,
  formatRfqBudget,
  getDaysLeft,
  pluralRu,
} from "@/lib/format"
import { OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import {
  isCatalogOfferRfq,
  isPendingCatalogOffer,
} from "@/lib/rfq-board"

type MyProposalSummary = {
  price: number
  currency: string
  status: ProposalStatus
}

type RfqBoardTableProps = {
  rfqs: RfqWithRelations[]
  actorId: number
  getMyProposal?: (rfqId: string) => MyProposalSummary | undefined
  getBuyerName: (rfq: RfqWithRelations) => string
  getBuyerVerified: (rfq: RfqWithRelations) => boolean
  onSubmitProposal: (rfqId: string) => void
  /** Category name shown under the title, e.g. "Веб-разработка". */
  getCategoryLabel?: (rfq: RfqWithRelations) => string | undefined
}

const URGENT_DAYS = 3

const formatRfqNo = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  const short = (digits || rfqId).slice(-4)
  return `З‑${short}`
}

const positionsLine = (rfq: RfqWithRelations): string => {
  if (rfq.type === "product") {
    return `${rfq.quantity} шт.`
  }
  return "услуга"
}

const isExpired = (rfq: RfqWithRelations) =>
  rfq.status === "expired" || !OPEN_RFQ_STATUSES.includes(rfq.status)

export const RfqBoardTable = ({
  rfqs,
  getMyProposal,
  getBuyerName,
  getBuyerVerified,
  onSubmitProposal,
  getCategoryLabel,
}: RfqBoardTableProps) => (
  <>
    {/* Desktop */}
    <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {(["№", "Заявка", "Покупатель", "Бюджет", "Осталось", ""] as const).map(
              (label) => (
                <th
                  key={label || "action"}
                  className="px-5 py-3.5 text-left text-[13px] font-semibold text-mute"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-line">
          {rfqs.map((rfq) => {
            const href = `/supplier/rfqs/${rfq.id}`

            const myProposal =
              getMyProposal?.(rfq.id) ??
              (rfq.my_proposal_status
                ? {
                    price: 0,
                    currency: rfq.currency,
                    status: rfq.my_proposal_status,
                  }
                : undefined)

            const pendingOffer = isPendingCatalogOffer(myProposal?.status)
            const responded = Boolean(myProposal) && !pendingOffer
            const expired = isExpired(rfq)
            const daysLeft = getDaysLeft(rfq.deadline)
            const overdue = daysLeft < 0
            const urgent = !expired && !overdue && daysLeft <= URGENT_DAYS
            const verified = getBuyerVerified(rfq)
            const catalog = isCatalogOfferRfq(rfq)

            return (
              <tr
                key={rfq.id}
                className={cn("hover:bg-canvas", expired && "opacity-60")}
              >
                <td className="whitespace-nowrap px-5 py-3.5">
                  <Link href={href} className="mono text-mute">
                    {formatRfqNo(rfq.id)}
                  </Link>
                </td>

                <td className="px-5 py-3.5">
                  <Link href={href} className="block min-w-0">
                    <b className="font-semibold text-ink line-clamp-2">
                      {rfq.title}
                    </b>
                    <div className="text-[12.5px] text-mute">
                      {[getCategoryLabel?.(rfq), positionsLine(rfq)].filter(Boolean).join(", ")}
                    </div>
                  </Link>
                </td>

                <td className="px-5 py-3.5">
                  <Link href={href} className="block">
                    <span className="text-ink">{getBuyerName(rfq)}</span>
                    <div
                      className={cn(
                        "text-[12px]",
                        verified ? "text-safe-700" : "text-amber-800",
                      )}
                    >
                      {verified ? "проверена" : "не проверена"}
                    </div>
                  </Link>
                </td>

                <td className="whitespace-nowrap px-5 py-3.5">
                  <Link href={href} className="mono text-ink">
                    {catalog && myProposal?.price
                      ? formatCurrency(myProposal.price, myProposal.currency)
                      : formatRfqBudget(
                          rfq.budget_type,
                          rfq.budget_from,
                          rfq.budget_to,
                          rfq.currency,
                        )}
                  </Link>
                </td>

                <td className="whitespace-nowrap px-5 py-3.5">
                  <Link href={href} className="block">
                    {expired ? (
                      <span className="text-[13px] text-amber-800">
                        приём закрыт
                      </span>
                    ) : overdue ? (
                      <span className="text-[13px] font-semibold text-red-700">
                        Просрочено
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "mono",
                          urgent && "font-semibold text-red-700",
                        )}
                      >
                        {daysLeft} {pluralRu(daysLeft, "день", "дня", "дней")}
                      </span>
                    )}
                  </Link>
                </td>

                <td className="px-5 py-3.5 text-right">
                  {responded ? (
                    <Link href={href} className="inline-flex">
                      <StatusBadge status="sent" label="Отправлено" />
                    </Link>
                  ) : expired ? null : (
                    <button
                      type="button"
                      onClick={() => onSubmitProposal(rfq.id)}
                      className="text-[13px] font-semibold whitespace-nowrap text-brand-700 hover:underline"
                    >
                      Ответить →
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    {/* Mobile */}
    <ul className="grid gap-2 md:hidden">
      {rfqs.map((rfq) => {
        const href = `/supplier/rfqs/${rfq.id}`
        const myProposal = getMyProposal?.(rfq.id)
        const pendingOffer = isPendingCatalogOffer(myProposal?.status)
        const responded = Boolean(myProposal) && !pendingOffer
        const expired = isExpired(rfq)
        const daysLeft = getDaysLeft(rfq.deadline)
        const overdue = daysLeft < 0
        const urgent = !expired && !overdue && daysLeft <= URGENT_DAYS
        const verified = getBuyerVerified(rfq)

        return (
          <li key={rfq.id}>
            <div
              className={cn(
                "grid gap-2 rounded-2xl border border-line bg-white p-3.5",
                expired && "opacity-60",
              )}
            >
              <Link href={href} className="grid gap-1">
                <span className="flex justify-between gap-2">
                  <span className="mono text-[12px] text-mute">
                    {formatRfqNo(rfq.id)}
                  </span>

                  {responded ? (
                    <StatusBadge status="sent" label="Отправлено" />
                  ) : expired ? (
                    <span className="text-[12px] text-amber-800">
                      приём закрыт
                    </span>
                  ) : overdue ? (
                    <span className="text-[12px] font-semibold text-red-700">
                      Просрочено
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-[12px] font-semibold",
                        urgent ? "text-red-700" : "text-brand-700",
                      )}
                    >
                      {daysLeft} {pluralRu(daysLeft, "день", "дня", "дней")}
                    </span>
                  )}
                </span>

                <b className="text-[14px] leading-snug text-ink">
                  {rfq.title}
                </b>

                <span className="text-[12.5px] text-mute">
                  {getBuyerName(rfq)}
                  {verified ? " · проверена" : " · не проверена"} · бюджет{" "}
                  <span className="mono">
                    {formatRfqBudget(
                      rfq.budget_type,
                      rfq.budget_from,
                      rfq.budget_to,
                      rfq.currency,
                    )}
                  </span>
                </span>
              </Link>

              {!responded && !expired ? (
                <button
                  type="button"
                  onClick={() => onSubmitProposal(rfq.id)}
                  className="justify-self-start text-[13px] font-semibold text-brand-700"
                >
                  Ответить →
                </button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  </>
)