import Link from "next/link"
import { HandshakeIcon } from "@phosphor-icons/react/dist/ssr"
import { PanelEmpty } from "@/components/layout/panel-empty"
import type { ContractWithRelations } from "@/types"
import { formatCurrency } from "@/lib/format"
import { DealStageBar } from "@/components/process"

type HomeDealsPanelProps = {
  contracts: ContractWithRelations[]
  getSupplierName: (supplierActorId: number) => string
  loading?: boolean
}

export const HomeDealsPanel = ({
  contracts,
  getSupplierName,
  loading = false,
}: HomeDealsPanelProps) => {
  const list = contracts.slice(0, 6)

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15.5px] font-semibold text-ink">Сделки в работе</h2>
        <Link
          href="/customer/contracts?tab=active"
          className="text-[13px] font-medium text-mute hover:text-ink"
        >
          Все сделки
        </Link>
      </div>

      {loading ? (
        <div className="h-32 rounded-lg bm-shimmer" />
      ) : list.length === 0 ? (
        <PanelEmpty
          icon={HandshakeIcon}
          text="Сейчас сделок в работе нет. Новая появится, когда вы выберете предложение поставщика или купите товар в каталоге."
          action={{ label: "Мои заявки", href: "/customer/rfqs?status=quotes" }}
        />
      ) : (
        <ul className="divide-y divide-line bm-stagger">
          {list.map((contract) => (
            <li key={contract.id}>
              <Link
                href={`/customer/contracts/${contract.id}`}
                className="grid w-full gap-2 py-3 text-left"
              >
                <span className="flex justify-between gap-3">
                  <span className="min-w-0">
                    <b className="block truncate text-[14px]">{contract.title}</b>
                    <span className="text-[12.5px] text-mute">
                      БМ‑{contract.id} · {getSupplierName(contract.supplier_actor_id)}
                    </span>
                  </span>
                  <b className="mono shrink-0 text-[14px]">
                    {formatCurrency(contract.agreed_amount, contract.currency)}
                  </b>
                </span>
                <DealStageBar contract={contract} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
