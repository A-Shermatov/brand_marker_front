"use client"

import Link from "next/link"
import {
  BuildingsIcon,
  CheckCircleIcon,
  ClockIcon,
  SealCheckIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import type { ProposalStatus, RfqWithRelations } from "@/types"
import { cn } from "@/lib/utils"
import { formatCurrency, formatRfqBudget, getDaysLeft, pluralRu } from "@/lib/format"
import { OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import { isCatalogOfferRfq, isPendingCatalogOffer } from "@/lib/rfq-board"

type MyProposalSummary = {
  price: number
  currency: string
  status: ProposalStatus
}

type RfqBoardListProps = {
  rfqs: RfqWithRelations[]
  actorId: number
  getMyProposal?: (rfqId: string) => MyProposalSummary | undefined
  getBuyerName: (rfq: RfqWithRelations) => string
  getBuyerVerified: (rfq: RfqWithRelations) => boolean
  onSubmitProposal: (rfqId: string) => void
  /** Category name, e.g. "Веб-разработка". */
  getCategoryLabel?: (rfq: RfqWithRelations) => string | undefined
}

const URGENT_DAYS = 3

const formatRfqNo = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  return `З‑${(digits || rfqId).slice(-4)}`
}

const whatLine = (rfq: RfqWithRelations): string =>
  rfq.type === "product" ? `товар, ${rfq.quantity} шт.` : "услуга"

const isClosed = (rfq: RfqWithRelations) =>
  rfq.status === "expired" || !OPEN_RFQ_STATUSES.includes(rfq.status)

/** How much time is left to answer, as words and a colour that says how urgent it is. */
function deadlineBadge(rfq: RfqWithRelations): { label: string; className: string } {
  if (isClosed(rfq)) return { label: "Приём закрыт", className: "bg-surface-muted text-mute" }
  const days = getDaysLeft(rfq.deadline)
  if (days < 0) return { label: "Срок вышел", className: "bg-red-50 text-red-700" }
  const label = days === 0 ? "Последний день" : `Осталось ${days} ${pluralRu(days, "день", "дня", "дней")}`
  return days <= URGENT_DAYS
    ? { label, className: "bg-amber-50 text-amber-800" }
    : { label, className: "bg-brand-50 text-brand-700" }
}

/**
 * Open requests as cards, one per row: what is wanted and from whom on the
 * left; on the right the budget, the time left and the one thing to do.
 */
export const RfqBoardList = ({
  rfqs,
  getMyProposal,
  getBuyerName,
  getBuyerVerified,
  onSubmitProposal,
  getCategoryLabel,
}: RfqBoardListProps) => (
  <ul className="grid gap-3" aria-label="Заявки покупателей">
    {rfqs.map((rfq) => {
      const href = `/supplier/rfqs/${rfq.id}`
      const myProposal =
        getMyProposal?.(rfq.id) ??
        (rfq.my_proposal_status
          ? { price: 0, currency: rfq.currency, status: rfq.my_proposal_status }
          : undefined)
      const responded = Boolean(myProposal) && !isPendingCatalogOffer(myProposal?.status)
      const closed = isClosed(rfq)
      const catalog = isCatalogOfferRfq(rfq)
      const verified = getBuyerVerified(rfq)
      const category = getCategoryLabel?.(rfq)
      const deadline = deadlineBadge(rfq)
      const ownPrice = catalog && myProposal?.price

      return (
        <li
          key={rfq.id}
          className={cn(
            "rounded-2xl border border-line bg-card transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-[0_10px_24px_-16px_rgb(0_80_200/0.45)]",
            closed && "opacity-70",
          )}
        >
          <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 md:px-5">
            <div className="grid min-w-0 gap-1.5">
              <p className="flex flex-wrap items-center gap-2 text-[12.5px]">
                {category ? (
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 font-medium text-brand-700">{category}</span>
                ) : null}
                <span className="text-mute">{whatLine(rfq)}</span>
                {catalog ? (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-800">из каталога</span>
                ) : null}
                <span className="mono text-faint">{formatRfqNo(rfq.id)}</span>
              </p>
              <Link
                href={href}
                className="line-clamp-2 text-[16.5px] font-semibold leading-snug text-ink hover:text-brand-700"
              >
                {rfq.title}
              </Link>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-soft">
                <BuildingsIcon className="size-4 text-mute" aria-hidden />
                <span>{getBuyerName(rfq)}</span>
                {verified ? (
                  <span className="inline-flex items-center gap-1 text-safe-700">
                    <SealCheckIcon weight="fill" className="size-4" aria-hidden />
                    проверена
                  </span>
                ) : (
                  <span className="text-amber-800">не проверена</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-3 md:flex-nowrap md:border-t-0 md:pt-0">
              <div className="grid min-w-[150px]">
                <span className="text-[12px] text-mute">{ownPrice ? "Ваша цена" : "Бюджет"}</span>
                <b className="whitespace-nowrap text-[16px] font-semibold text-ink tnum">
                  {ownPrice
                    ? formatCurrency(myProposal!.price, myProposal!.currency)
                    : formatRfqBudget(rfq.budget_type, rfq.budget_from, rfq.budget_to, rfq.currency)}
                </b>
              </div>
              <span
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-medium",
                  deadline.className,
                )}
              >
                <ClockIcon className="size-4" aria-hidden />
                {deadline.label}
              </span>
              <div className="ml-auto md:w-[150px] md:text-right">
                {responded ? (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-safe-700 hover:underline"
                  >
                    <CheckCircleIcon weight="fill" className="size-4" aria-hidden />
                    КП отправлено
                  </Link>
                ) : closed ? null : (
                  <Button size="sm" onClick={() => onSubmitProposal(rfq.id)}>
                    Ответить
                  </Button>
                )}
              </div>
            </div>
          </div>
        </li>
      )
    })}
  </ul>
)
