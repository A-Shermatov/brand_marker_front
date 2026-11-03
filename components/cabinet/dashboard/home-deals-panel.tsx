import Link from "next/link"
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
    <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-mute">Сделки в работе</span>
        <Link
          href="/customer/contracts?tab=active"
          className="text-[13px] text-brand-700 hover:underline"
        >
          Все сделки →
        </Link>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-lg bg-canvas" />
      ) : list.length === 0 ? (
        <p className="py-6 text-[14px] text-mute">Сделок пока нет.</p>
      ) : (
        <ul className="divide-y divide-line">
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
