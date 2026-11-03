import type { ContractWithRelations } from "@/types"
import { ShieldIcon as Shield } from "@phosphor-icons/react/dist/ssr"
import { statusPillClass } from "@/components/ui/status-badge"
import {
  contractStatusMeta,
  escrowSummaryMeta,
  getEscrowSummary,
} from "@/lib/contract-display"
import { formatCurrency } from "@/lib/format"

type ContractEscrowCardProps = {
  contract: ContractWithRelations
  showPayout?: boolean
}

const formatCommissionTerms = (contract: ContractWithRelations) => {
  if (contract.commission_percent == null) return null
  const percent = `${contract.commission_percent.toLocaleString("ru-RU")}%`
  if (!contract.commission_min) return percent
  return `${percent}, минимум ${formatCurrency(contract.commission_min, contract.currency)}`
}

export const ContractEscrowCard = ({ contract, showPayout = false }: ContractEscrowCardProps) => {
  const summary = getEscrowSummary(contract)
  const statusMeta = contractStatusMeta[contract.status]

  const rows = [
    { key: "held" as const, amount: summary.held },
    { key: "released" as const, amount: summary.released },
    { key: "disputed" as const, amount: summary.disputed },
  ].filter((row) => row.amount > 0)
  const commission = contract.commission_amount ?? 0
  const commissionTerms = formatCommissionTerms(contract)

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Shield size={16} className="text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Безопасная оплата</h2>
      </div>

      <span className={`${statusPillClass} mb-4 ${statusMeta.className}`}>
        {contract.status === "disputed" ? "Средства заморожены" : statusMeta.label}
      </span>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет активных движений по оплате</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const meta = escrowSummaryMeta[row.key]
            return (
              <div key={row.key} className="flex items-center justify-between">
                <span className={`${statusPillClass} ${meta.className}`}>
                  {meta.label}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(row.amount, summary.currency)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {commission > 0 && (
        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              Комиссия платформы
              {commissionTerms && <span className="block text-xs">{commissionTerms}</span>}
            </dt>
            <dd className="font-semibold text-foreground">
              {formatCurrency(commission, contract.currency)}
            </dd>
          </div>
          {showPayout && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Вы получите</dt>
              <dd className="font-bold text-foreground">
                {formatCurrency(contract.agreed_amount - commission, contract.currency)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  )
}
