"use client"

import Link from "next/link"
import { ArrowRightIcon as ArrowRight, BriefcaseIcon as Briefcase } from "@phosphor-icons/react/dist/ssr"
import type { ContractWithRelations } from "@/types"
import { PageEmptyState } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { DealList } from "@/components/contracts/deal-list"

type ActiveContractsPanelProps = {
  contracts: ContractWithRelations[]
  hydrated: boolean
  getBuyerName: (buyerId: number) => string
  limit?: number
}

export const ActiveContractsPanel = ({
  contracts,
  hydrated,
  getBuyerName,
  limit = 4,
}: ActiveContractsPanelProps) => (
  <section className="grid gap-3" aria-labelledby="supplier-deals-title">
    <div className="flex items-center justify-between gap-3">
      <h2 id="supplier-deals-title" className="text-lg font-bold">
        Мои сделки
      </h2>
      <Link
        href="/supplier/contracts"
        className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        Все сделки <ArrowRight size={14} />
      </Link>
    </div>

    {!hydrated ? (
      <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
    ) : contracts.length === 0 ? (
      <PageEmptyState
        variant="card"
        icon={<Briefcase />}
        title="Сделок пока нет"
        description="Сделка начнётся, когда заказчик выберет ваше предложение"
        action={
          <Button asChild variant="outline">
            <Link href="/supplier/rfqs">Смотреть заявки</Link>
          </Button>
        }
      />
    ) : (
      <DealList
        contracts={contracts.slice(0, limit)}
        role="supplier"
        getCounterpartName={(c) => getBuyerName(c.buyer_actor_id)}
      />
    )}
  </section>
)
