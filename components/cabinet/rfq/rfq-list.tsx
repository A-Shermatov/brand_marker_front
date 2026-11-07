"use client"

import Link from "next/link"
import { ClockIcon } from "@phosphor-icons/react/dist/ssr"
import type { RfqWithRelations } from "@/types"
import { Button } from "@/components/ui/button"
import {
  CardAction,
  CardChip,
  CardFact,
  CardLine,
  CardList,
  CardMeta,
  CardNo,
  CardTitle,
  ListCard,
  ListCardBody,
  StatusPill,
  type CardTone,
} from "@/components/layout/card-list"
import { useCategoryOptions } from "@/hooks/use-category-options"
import { buyerRfqBadgeLabel, isModeratedRfq } from "@/lib/buyer-rfq-display"
import { formatIsoDate, formatRfqBudget, pluralRu } from "@/lib/format"

type RfqListProps = {
  rfqs: RfqWithRelations[]
  getProposalCount: (rfqId: string) => number
}

const formatRfqNo = (rfqId: string): string => {
  const digits = rfqId.replace(/\D/g, "")
  return `З‑${(digits || rfqId).slice(-4)}`
}

const whatLine = (rfq: RfqWithRelations): string =>
  rfq.type === "product" ? `товар, ${rfq.quantity} шт.` : "услуга"

const isCollecting = (rfq: RfqWithRelations) =>
  rfq.status === "published" || rfq.status === "receiving_proposals"

const isDeal = (rfq: RfqWithRelations) =>
  rfq.status === "supplier_selected" || rfq.status === "contract_created" || rfq.status === "in_progress"

/** The state of a request as a colour: collecting, in a deal, or done. */
const toneOf = (rfq: RfqWithRelations): CardTone => {
  if (isModeratedRfq(rfq)) return "danger"
  if (isCollecting(rfq)) return "brand"
  if (isDeal(rfq)) return "safe"
  return "muted"
}

/** The buyer's own requests as cards: what was asked, how many offers came, what to do next. */
export const RfqList = ({ rfqs, getProposalCount }: RfqListProps) => {
  const { getRfqCategoryLabel } = useCategoryOptions()
  return (
    <CardList label="Мои заявки">
      {rfqs.map((rfq) => {
        const href = `/customer/rfqs/${rfq.id}`
        const offers = getProposalCount(rfq.id)
        const collecting = isCollecting(rfq)
        const tone = toneOf(rfq)
        const category = getRfqCategoryLabel(rfq.category_id)
        return (
          <ListCard key={rfq.id} tone={tone} dim={tone === "muted" && rfq.status !== "draft"}>
            <ListCardBody
              aside={
                <>
                  <CardFact label="Бюджет" className="min-w-[150px]">
                    {formatRfqBudget(rfq.budget_type, rfq.budget_from, rfq.budget_to, rfq.currency)}
                  </CardFact>
                  <CardFact label="Предложения" className="min-w-[96px]">
                    <span className={offers && collecting ? "text-brand-700" : undefined}>
                      {offers} {pluralRu(offers, "КП", "КП", "КП")}
                    </span>
                  </CardFact>
                  {collecting && rfq.deadline ? (
                    <StatusPill tone="brand" icon={ClockIcon}>
                      Приём до {formatIsoDate(rfq.deadline)}
                    </StatusPill>
                  ) : (
                    <StatusPill tone={tone}>{buyerRfqBadgeLabel(rfq.status)}</StatusPill>
                  )}
                  <CardAction>
                    {collecting && offers > 0 ? (
                      <Button asChild size="sm">
                        <Link href={href}>Сравнить КП</Link>
                      </Button>
                    ) : (
                      <Link href={href} className="text-[13.5px] font-semibold text-brand-700 hover:underline">
                        {rfq.status === "draft" ? "Дополнить" : "Открыть"}
                      </Link>
                    )}
                  </CardAction>
                </>
              }
            >
              <CardMeta>
                {category ? <CardChip>{category}</CardChip> : null}
                <span>{whatLine(rfq)}</span>
                <CardNo>{formatRfqNo(rfq.id)}</CardNo>
              </CardMeta>
              <CardTitle href={href}>{rfq.title}</CardTitle>
              {isModeratedRfq(rfq) ? (
                <CardLine className="text-red-700">
                  Снята модератором{rfq.moderation_reason ? `: ${rfq.moderation_reason}` : ""}
                </CardLine>
              ) : null}
            </ListCardBody>
          </ListCard>
        )
      })}
    </CardList>
  )
}
