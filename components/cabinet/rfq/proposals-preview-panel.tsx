"use client"

import Link from "next/link"
import { ArrowRightIcon as ArrowRight, ClockIcon as Clock, UsersIcon as Users } from "@phosphor-icons/react/dist/ssr"
import type { Proposal, PublicSupplier } from "@/types"
import { ProposalReviewCard } from "@/components/cabinet/rfq/proposal-review-card"
import { PageEmptyState } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { getProposalMarks } from "@/lib/proposals-review"

type ProposalsPreviewPanelProps = {
  rfqId: string
  proposals: Proposal[]
  canManage: boolean
  getSupplier: (actorId: number) => PublicSupplier | undefined
  getSupplierName: (actorId: number) => string
  onShortlist: (proposalId: number) => void
  onReject: (proposalId: number) => void
  onAccept: (proposalId: number) => void
  limit?: number
}

export const ProposalsPreviewPanel = ({
  rfqId,
  proposals,
  canManage,
  getSupplier,
  getSupplierName,
  onShortlist,
  onReject,
  onAccept,
  limit = 3,
}: ProposalsPreviewPanelProps) => {
  const marks = getProposalMarks(proposals)
  const sorted = [...proposals].sort((a, b) => a.price - b.price)

  return (
    <section className="grid gap-3" aria-label="Предложения">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          Предложения
          {proposals.length > 0 && (
            <span className="ml-2 font-normal text-muted-foreground">· {proposals.length}</span>
          )}
        </h2>
        {proposals.length > 0 && (
          <Link
            href={`/customer/rfqs/${rfqId}/proposals`}
            className="flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"
          >
            Сравнить все <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {proposals.length === 0 ? (
        <PageEmptyState
          variant="card"
          icon={<Clock />}
          title="Предложений пока нет"
          description="Мы уведомим вас, когда исполнители ответят. Можно пригласить исполнителей самим."
          action={
            <Button asChild variant="outline">
              <Link href="/customer/suppliers">
                <Users /> Найти исполнителей
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {sorted.slice(0, limit).map((proposal) => (
            <ProposalReviewCard
              key={proposal.id}
              proposal={proposal}
              marks={marks.get(proposal.id)}
              supplier={getSupplier(proposal.supplier_actor_id)}
              supplierName={getSupplierName(proposal.supplier_actor_id)}
              canManage={canManage}
              onShortlist={() => onShortlist(proposal.id)}
              onReject={() => onReject(proposal.id)}
              onAccept={() => onAccept(proposal.id)}
            />
          ))}
          {proposals.length > limit && (
            <Link
              href={`/customer/rfqs/${rfqId}/proposals`}
              className="block py-2 text-center text-sm font-semibold text-brand-700 hover:underline"
            >
              Ещё {proposals.length - limit} — сравнить все предложения
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
