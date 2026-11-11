"use client"

import Link from "next/link"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import {
  BellRingingIcon,
  CheckCircleIcon,
  HourglassMediumIcon,
  MinusCircleIcon,
  UserSwitchIcon,
} from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { formatDeliveryTime, formatIsoDate, formatMoneyDisplay } from "@/lib/format"
import { outcomeOf, outcomeView, type OutcomeTone } from "@/lib/proposal-outcome"
import { cn } from "@/lib/utils"
import { PromotedTag } from "@/components/bm/promoted"
import type { ProposalWithRelations } from "@/types"

type MyProposalsListProps = {
  proposals: ProposalWithRelations[]
  /** Fallbacks for proposals without a request summary (local data). */
  getRfqTitle: (rfqId: string) => string
  getBuyerName: (rfqId: string) => string
  getDeadline: (rfqId: string) => string | null | undefined
}

const TONES: Record<OutcomeTone, { bar: string; pill: string; icon: PhosphorIcon }> = {
  waiting: { bar: "bg-brand-500", pill: "bg-brand-50 text-brand-700", icon: HourglassMediumIcon },
  action: { bar: "bg-amber-500", pill: "bg-amber-50 text-amber-800", icon: BellRingingIcon },
  won: { bar: "bg-safe-500", pill: "bg-safe-50 text-safe-700", icon: CheckCircleIcon },
  lost: { bar: "bg-line-strong", pill: "bg-surface-muted text-ink-soft", icon: UserSwitchIcon },
  muted: { bar: "bg-line-strong", pill: "bg-surface-muted text-mute", icon: MinusCircleIcon },
}

const formatRfqNo = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  return `З‑${(digits || rfqId).slice(-4)}`
}

/**
 * Sent proposals as cards: the request and the offer on the left, and on the
 * right the answer to "what happened to it" — still waiting, chosen, or who
 * got the order instead.
 */
export function MyProposalsList({ proposals, getRfqTitle, getBuyerName, getDeadline }: MyProposalsListProps) {
  return (
    <ul className="grid gap-3" aria-label="Мои коммерческие предложения">
      {proposals.map((proposal) => {
        const rfq = proposal.rfq_summary
        const deadline = rfq?.deadline ?? getDeadline(proposal.rfq_id)
        const view = outcomeView(outcomeOf(proposal), deadline)
        const tone = TONES[view.tone]
        const Icon = tone.icon
        const href = `/supplier/rfqs/${proposal.rfq_id}`
        return (
          <li
            key={proposal.id}
            data-outcome={view.tone}
            className="relative overflow-hidden rounded-2xl border border-line bg-card"
          >
            <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", tone.bar)} />
            <div className="grid gap-4 p-4 pl-5 md:grid-cols-[minmax(0,1fr)_300px] md:items-center md:gap-6">
              <div className="grid min-w-0 gap-1">
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-mute">
                  {proposal.promoted && view.tone === "waiting" ? <PromotedTag className="mr-1" /> : null}
                  <span className="mono">{formatRfqNo(proposal.rfq_id)}</span>
                  {" · "}
                  {proposal.actor?.name ?? getBuyerName(proposal.rfq_id)}
                </p>
                <Link
                  href={href}
                  className="line-clamp-2 text-[16px] font-semibold leading-snug text-ink hover:text-brand-700"
                >
                  {rfq?.title ?? getRfqTitle(proposal.rfq_id)}
                </Link>
                <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-ink-soft">
                  <span>
                    Ваше КП:{" "}
                    <b className="font-semibold text-ink tnum">
                      {formatMoneyDisplay(proposal.price, proposal.currency)}
                    </b>
                  </span>
                  <span>Срок: {formatDeliveryTime(proposal.delivery_time)}</span>
                  <span className="text-mute">Отправлено {formatIsoDate(proposal.created_at)}</span>
                </p>
              </div>

              <div className="grid justify-items-start gap-1.5 border-t border-line pt-3 md:border-t-0 md:border-l md:pl-6 md:pt-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13.5px] font-semibold",
                    tone.pill,
                  )}
                >
                  <Icon weight="fill" className="size-4" aria-hidden />
                  {view.title}
                </span>
                <p className="text-[13px] leading-snug text-mute">{view.hint}</p>
                {view.action ? (
                  <Button asChild size="sm" className="mt-1">
                    <Link href={view.action.href}>{view.action.label}</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
