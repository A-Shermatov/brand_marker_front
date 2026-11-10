"use client"

import Link from "next/link"
import { ClockIcon as Clock } from "@phosphor-icons/react/dist/ssr"
import type { Proposal, PublicSupplier, RfqWithRelations } from "@/types"
import { CompanyName } from "@/components/bm"
import { supplierMarks } from "@/lib/supplier-marks"
import { StatusBadge } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { PageEmptyState } from "@/components/layout"
import { proposalBadgeStatus } from "@/lib/proposal-display"
import {
  formatCurrency,
  formatDeliveryTime,
  formatRating,
} from "@/lib/format"
import { cn } from "@/lib/utils"

type ProposalsCompareTableProps = {
  rfq: RfqWithRelations
  proposals: Proposal[]
  canManage: boolean
  getSupplier: (actorId: number) => PublicSupplier | undefined
  getSupplierName: (actorId: number) => string
  onAccept: (proposalId: number) => void
}

const deliveryDays = (value: string | null | undefined): number => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : Number.POSITIVE_INFINITY
}

const budgetCap = (rfq: RfqWithRelations): number | null => {
  if (rfq.budget_type === "open") return null
  if (rfq.budget_to != null) return rfq.budget_to
  if (rfq.budget_from != null) return rfq.budget_from
  return null
}

export const ProposalsCompareTable = ({
  rfq,
  proposals,
  canManage,
  getSupplier,
  getSupplierName,
  onAccept,
}: ProposalsCompareTableProps) => {
  if (proposals.length === 0) {
    return (
      <PageEmptyState
        variant="card"
        icon={<Clock />}
        title="КП пока нет"
        description="Поставщики уже видят заявку. Обычно первые предложения приходят в течение дня — мы пришлём уведомление, и сравнить цены можно будет прямо здесь."
      />
    )
  }

  const minPrice = Math.min(...proposals.map((p) => p.price))
  const minDays = Math.min(...proposals.map((p) => deliveryDays(p.delivery_time)))
  const cap = budgetCap(rfq)
  const minWidth = 220 + proposals.length * 190

  const supplierFor = (actorId: number) => {
    const supplier = getSupplier(actorId)
    return supplier ? supplierMarks(supplier) : null
  }

  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto rounded-xl border border-line bg-card scroll-thin">
        <table
          className="w-full table-fixed text-[13.5px]"
          style={{ minWidth }}
        >
          <thead>
            <tr className="border-b border-line">
              <th className="w-[190px] px-4 py-3 text-left text-[12.5px] font-medium text-mute">
                Сравнение КП
              </th>
              {proposals.map((proposal) => {
                const badge = proposalBadgeStatus(proposal.status)
                const name = getSupplierName(proposal.supplier_actor_id)
                return (
                  <th
                    key={proposal.id}
                    className="px-4 py-3 text-left align-top"
                  >
                    <Link
                      href={`/customer/suppliers/${proposal.supplier_actor_id}`}
                      className="flex min-w-0 hover:[&_*]:text-brand-700"
                    >
                      <CompanyName
                        name={name}
                        {...(supplierFor(proposal.supplier_actor_id) ?? {})}
                        size="sm"
                        nameClassName="text-[14px]"
                      />
                    </Link>
                    <Link
                      href={`/customer/suppliers/${proposal.supplier_actor_id}`}
                      className="mt-1 block text-[12.5px] font-semibold text-brand-700"
                    >
                      О поставщике →
                    </Link>
                    <div className="mt-1">
                      <StatusBadge status={badge.status} label={badge.label} />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <th className="px-4 py-2.5 text-left align-top font-normal text-mute">
                Итого
              </th>
              {proposals.map((proposal) => {
                const best = proposal.price === minPrice
                const over =
                  cap != null && proposal.price > cap
                    ? proposal.price - cap
                    : null
                return (
                  <td
                    key={proposal.id}
                    className={cn(
                      "px-4 py-2.5 align-top",
                      best && "bg-safe-50 font-semibold text-safe-700",
                    )}
                  >
                    <span className="mono text-[16px] font-semibold">
                      {formatCurrency(proposal.price, proposal.currency)}
                    </span>
                    {cap != null ? (
                      <div
                        className={cn(
                          "text-[12px]",
                          over == null ? "text-safe-700" : "text-red-700",
                        )}
                      >
                        {over == null
                          ? "в бюджете"
                          : `выше бюджета на ${formatCurrency(over, proposal.currency)}`}
                      </div>
                    ) : null}
                  </td>
                )
              })}
            </tr>

            <tr>
              <th className="px-4 py-2.5 text-left align-top font-normal text-mute">
                Срок поставки
              </th>
              {proposals.map((proposal) => {
                const days = deliveryDays(proposal.delivery_time)
                const best = Number.isFinite(minDays) && days === minDays
                return (
                  <td
                    key={proposal.id}
                    className={cn(
                      "px-4 py-2.5 align-top",
                      best && "bg-safe-50 font-semibold text-safe-700",
                    )}
                  >
                    <span className="mono">
                      {formatDeliveryTime(proposal.delivery_time)}
                    </span>
                  </td>
                )
              })}
            </tr>

            <tr>
              <th className="px-4 py-2.5 text-left align-top font-normal text-mute">
                Комментарий
              </th>
              {proposals.map((proposal) => (
                <td
                  key={proposal.id}
                  className="px-4 py-2.5 align-top text-[13px] text-ink"
                >
                  {proposal.message?.trim() || "—"}
                </td>
              ))}
            </tr>

            <tr>
              <th className="px-4 py-2.5 text-left align-top font-normal text-mute">
                Компания
              </th>
              {proposals.map((proposal) => {
                const supplier = getSupplier(proposal.supplier_actor_id)
                const verified = supplier?.verification_status === "verified"
                return (
                  <td
                    key={proposal.id}
                    className={cn(
                      "px-4 py-2.5 align-top",
                      verified && "bg-safe-50 font-semibold text-safe-700",
                    )}
                  >
                    <span className="text-ink">
                      {getSupplierName(proposal.supplier_actor_id)}
                    </span>
                    <div
                      className={cn(
                        "text-[12px]",
                        verified ? "text-safe-700" : "text-amber-800",
                      )}
                    >
                      {verified ? "проверена" : "не проверена"}
                    </div>
                  </td>
                )
              })}
            </tr>

            <tr>
              <th className="px-4 py-2.5 text-left align-top font-normal text-mute">
                Рейтинг
              </th>
              {proposals.map((proposal) => {
                const supplier = getSupplier(proposal.supplier_actor_id)
                const rating = supplier?.rating ?? 0
                const deals = supplier?.completed_contracts
                return (
                  <td key={proposal.id} className="px-4 py-2.5 align-top">
                    {rating > 0 ? (
                      <>
                        <span className="mono">{formatRating(rating)}</span>
                        {deals != null ? (
                          <span className="text-[12px] text-mute">
                            {" "}
                            · {deals} сделок
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-mute">нет сделок</span>
                    )}
                  </td>
                )
              })}
            </tr>

            {canManage ? (
              <tr>
                <th className="px-4 py-3" />
                {proposals.map((proposal) => {
                  const actionable = ["submitted", "viewed", "shortlisted"].includes(
                    proposal.status,
                  )
                  return (
                    <td key={proposal.id} className="px-4 py-3 align-top">
                      {actionable ? (
                        <div className="grid gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            className="h-9 w-full"
                            onClick={() => onAccept(proposal.id)}
                          >
                            Выбрать
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="h-9 w-full">
                            <Link href={`/customer/messages?proposal=${proposal.id}`}>
                              Задать вопрос
                            </Link>
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  )
                })}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1.5 text-[12.5px] text-mute">
        <span className="inline-block h-3 w-3 border border-safe-100 bg-safe-50" />
        Лучшее значение в строке
      </p>
    </div>
  )
}
