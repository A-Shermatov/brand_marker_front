"use client"

import Link from "next/link"
import { statusPillClass } from "@/components/ui/status-badge"
import type { Proposal, ProposalWithRelations, PublicSupplier } from "@/types"
import { ContactPerson } from "@/components/company/contact-person"
import { proposalStatusMeta } from "@/lib/proposal-display"
import { formatDeliveryTime, formatMoneyDisplay } from "@/lib/format"
import { SupplierProposalInfo } from "@/components/cabinet/rfq/supplier-proposal-info"
import { MoneyIcon as Banknote, ClockIcon as Clock, ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"

type ProposalReviewCardProps = {
  proposal: Proposal
  supplier: PublicSupplier | undefined
  supplierName: string
  canManage: boolean
  onShortlist: () => void
  onReject: () => void
  onAccept: () => void
  /** Comparison badges like «Самая низкая цена». */
  marks?: string[]
}

export const ProposalReviewCard = ({
  proposal,
  supplier,
  supplierName,
  canManage,
  onShortlist,
  onReject,
  onAccept,
  marks = [],
}: ProposalReviewCardProps) => {
  const meta = proposalStatusMeta[proposal.status]
  // The offer comes from a company: show which of its people wrote it.
  const contact = (proposal as ProposalWithRelations).actor
  const isFinal = ["accepted", "rejected", "withdrawn", "archived", "pending_supplier"].includes(
    proposal.status,
  )

  return (
    <article
      className={`bg-card border rounded-2xl p-5 sm:p-6 ${proposal.status === "accepted" ? "border-primary" : "border-border"}`}
    >
      <SupplierProposalInfo
        supplier={supplier}
        supplierId={proposal.supplier_actor_id}
        supplierName={supplierName}
      />
      <ContactPerson
        name={contact?.kind === "company" ? contact.contact_name : null}
        role={contact?.contact_role}
        className="mt-2"
      />

      {marks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {marks.map((mark) => (
            <span
              key={mark}
              className="text-xs font-semibold rounded-full px-2 py-0.5 bg-brand-50 text-brand-700"
            >
              {mark}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-border">
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Banknote size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Цена</p>
            <p className="text-sm font-bold text-primary mt-0.5 wrap-anywhere" title={formatMoneyDisplay(proposal.price, proposal.currency)}>
              {formatMoneyDisplay(proposal.price, proposal.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Clock size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Срок поставки / работ</p>
            <p className="text-sm font-semibold text-foreground mt-0.5 wrap-anywhere" title={formatDeliveryTime(proposal.delivery_time)}>
              {formatDeliveryTime(proposal.delivery_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center sm:justify-end">
          <span className={`${statusPillClass} ${meta.className}`}>
            {meta.label}
          </span>
        </div>
      </div>

      {proposal.message && (
        <div className="mt-5 pt-5 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Сообщение</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line wrap-anywhere">{proposal.message}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
        {canManage && !isFinal && proposal.status !== "shortlisted" && (
          <button
            type="button"
            onClick={onShortlist}
            className="h-10 px-4 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-colors"
          >
            В избранное
          </button>
        )}
        <Link
          href={`/customer/messages?proposal=${proposal.id}`}
          aria-label="Обсудить проект"
          className="h-10 px-4 rounded-xl border border-border text-sm font-bold hover:bg-secondary transition-colors inline-flex items-center gap-2"
        >
          <MessageSquare size={16} /> Обсудить проект
        </Link>
        {canManage && !isFinal && (
          <>
            <button
              type="button"
              onClick={onReject}
              className="h-10 px-4 rounded-xl border border-destructive/30 text-destructive text-sm font-bold hover:bg-destructive/5 transition-colors"
            >
              Отклонить
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              Выбрать поставщика
            </button>
          </>
        )}
      </div>
    </article>
  )
}
