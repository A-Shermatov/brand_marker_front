import type { Proposal } from "@/types"
import { statusPillClass } from "@/components/ui/status-badge"
import { proposalStatusMeta } from "@/lib/proposal-display"
import { formatDeliveryTime, formatMoneyDisplay } from "@/lib/format"

type RfqProposalsListProps = {
  proposals: Proposal[]
  currentActorId: number
  getSupplierName: (supplierId: number) => string
}

export const RfqProposalsList = ({
  proposals,
  currentActorId,
  getSupplierName,
}: RfqProposalsListProps) => (
  <section className="bg-card border border-border rounded-xl p-6">
    <h2 className="text-sm font-semibold text-foreground mb-4">
      Существующие предложения
      {proposals.length > 0 && (
        <span className="ml-2 text-sm font-normal text-muted-foreground">({proposals.length})</span>
      )}
    </h2>

    {proposals.length === 0 ? (
      <p className="text-sm text-muted-foreground">Пока нет предложений от других поставщиков</p>
    ) : (
      <div className="space-y-3">
        {proposals.map((proposal) => {
          const meta = proposalStatusMeta[proposal.status]
          const isMine = proposal.supplier_actor_id === currentActorId
          return (
            <div
              key={proposal.id}
              className={`rounded-xl border p-4 ${
                isMine ? "border-primary/30 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground wrap-anywhere">
                    {getSupplierName(proposal.supplier_actor_id)}
                    {isMine && (
                      <span className={`${statusPillClass} ml-2 bg-primary/10 text-primary`}>
                        Ваше
                      </span>
                    )}
                  </p>
                  {proposal.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 wrap-anywhere">{proposal.message}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 min-w-0 max-w-[45%]">
                  <p className="text-sm font-bold text-primary wrap-anywhere">
                    {formatMoneyDisplay(proposal.price, proposal.currency)}
                  </p>
                  {proposal.delivery_time && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 wrap-anywhere">
                      {formatDeliveryTime(proposal.delivery_time)}
                    </p>
                  )}
                  <span className={`${statusPillClass} mt-1 ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )}
  </section>
)
