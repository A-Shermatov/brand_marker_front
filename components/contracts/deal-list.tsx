"use client"

import Link from "next/link"
import { BuildingsIcon } from "@phosphor-icons/react/dist/ssr"
import type { ContractWithRelations } from "@/types"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/format"
import {
  DEAL_NEXT_STEP,
  dealNeedsAction,
  getDealPhase,
  getDealStepIndex,
  getDealSteps,
  type DealRole,
} from "@/lib/process/deal-stages"
import { DealStageBar } from "@/components/process"
import {
  CardAction,
  CardFact,
  CardLine,
  CardList,
  CardMeta,
  CardNo,
  CardTitle,
  ListCard,
  ListCardBody,
  type CardTone,
} from "@/components/layout/card-list"

type DealListProps = {
  contracts: ContractWithRelations[]
  role: DealRole
  getCounterpartName: (contract: ContractWithRelations) => string
}

const DEAL_HREF_BASE: Record<DealRole, string> = {
  buyer: "/customer/contracts",
  supplier: "/supplier/contracts",
}

const COUNTERPART: Record<DealRole, string> = {
  buyer: "Поставщик",
  supplier: "Покупатель",
}

const formatDealNo = (id: number) => `БМ‑${id}`

const stageLabel = (contract: ContractWithRelations): string => {
  const phase = getDealPhase(contract)
  if (phase === "cancelled") return "Отменена"
  if (phase === "done") return "Завершена"
  if (phase === "disputed") return "Спор"
  const steps = getDealSteps(contract)
  return steps[getDealStepIndex(contract)]?.label ?? "—"
}

const toneOf = (contract: ContractWithRelations): CardTone => {
  const phase = getDealPhase(contract)
  if (phase === "disputed") return "danger"
  if (phase === "done") return "safe"
  if (phase === "cancelled") return "muted"
  return "brand"
}

/**
 * Deals as cards: title and the other party on the left; on the right the
 * amount, how far the deal has come, and what happens next — in bold blue
 * when it is the reader's move.
 */
export const DealList = ({ contracts, role, getCounterpartName }: DealListProps) => (
  <CardList label="Сделки">
    {contracts.map((contract) => {
      const href = `${DEAL_HREF_BASE[role]}/${contract.id}`
      const phase = getDealPhase(contract)
      const yourMove = dealNeedsAction(role, contract) && phase !== "disputed"
      const nextStep = DEAL_NEXT_STEP[role][phase]
      return (
        <ListCard key={contract.id} tone={toneOf(contract)} dim={phase === "cancelled"}>
          <ListCardBody
            aside={
              <>
                <CardFact label="Сумма" className="min-w-[130px]">
                  {formatCurrency(contract.agreed_amount, contract.currency)}
                </CardFact>
                <div className="grid w-36 gap-1.5">
                  <DealStageBar contract={contract} />
                  <span className="text-[12.5px] text-mute">Этап: {stageLabel(contract)}</span>
                </div>
                <CardAction>
                  <Link
                    href={href}
                    className={cn(
                      "inline-flex items-start gap-1.5 text-left text-[13.5px] leading-snug md:justify-end md:text-right",
                      yourMove ? "font-semibold text-brand-700" : "text-mute hover:text-ink",
                    )}
                  >
                    {yourMove ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" /> : null}
                    {nextStep}
                  </Link>
                </CardAction>
              </>
            }
          >
            <CardMeta>
              <CardNo>{formatDealNo(contract.id)}</CardNo>
            </CardMeta>
            <CardTitle href={href}>{contract.title}</CardTitle>
            <CardLine icon={BuildingsIcon}>
              <span className="text-mute">{COUNTERPART[role]}:</span>
              {getCounterpartName(contract)}
            </CardLine>
          </ListCardBody>
        </ListCard>
      )
    })}
  </CardList>
)
