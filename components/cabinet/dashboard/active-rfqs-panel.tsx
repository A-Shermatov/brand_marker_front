"use client"

import Link from "next/link"
import { CaretRightIcon as ChevronRight, FileTextIcon as FileText, PlusIcon as Plus, ShoppingCartIcon as ShoppingCart } from "@phosphor-icons/react/dist/ssr"
import type { RfqWithRelations } from "@/types"
import { RfqStatusBadge } from "@/components/rfq/rfq-status-badge"
import { PageEmptyState } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { useCategoryOptions } from "@/hooks/use-category-options"
import { OPEN_RFQ_STATUSES } from "@/lib/rfq-display"
import { formatCount, formatIsoDate, formatRfqBudget } from "@/lib/format"
import { cn } from "@/lib/utils"

type ActiveRfqsPanelProps = {
  rfqs: RfqWithRelations[]
  hydrated: boolean
  /** Proposals count per RFQ id, shown for RFQs that accept proposals. */
  proposalsCount?: Map<string, number>
  title?: string
  limit?: number
}

const rfqHref = (rfq: RfqWithRelations) =>
  rfq.status === "draft" ? `/customer/rfqs/${rfq.id}/edit` : `/customer/rfqs/${rfq.id}`

export const ActiveRfqsPanel = ({
  rfqs,
  hydrated,
  proposalsCount,
  title = "Мои заявки",
  limit = 3,
}: ActiveRfqsPanelProps) => {
  const { getRfqCategoryLabel } = useCategoryOptions()

  return (
    <section className="grid gap-3" aria-label={title}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href="/customer/rfqs" className="text-sm font-semibold text-brand-700 hover:underline">
          Все заявки →
        </Link>
      </div>

      {!hydrated ? (
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      ) : rfqs.length === 0 ? (
        <PageEmptyState
          variant="card"
          icon={<FileText />}
          title="Здесь пока пусто"
          description="Опишите, что нужно, — исполнители пришлют цены. Это займёт 3 минуты."
          action={
            <Button asChild>
              <Link href="/customer/rfqs/new">
                <Plus /> Новая заявка
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {rfqs.slice(0, limit).map((rfq) => {
            const isOpen = OPEN_RFQ_STATUSES.includes(rfq.status)
            const count = proposalsCount?.get(rfq.id) ?? 0
            const when = rfq.deadline
              ? isOpen
                ? `приём до ${formatIsoDate(rfq.deadline)}`
                : formatIsoDate(rfq.deadline)
              : "срок не указан"
            const Icon = rfq.type === "product" ? ShoppingCart : FileText
            return (
              <li key={rfq.id}>
                <Link
                  href={rfqHref(rfq)}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-nowrap"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
                    aria-hidden="true"
                  >
                    <Icon size={20} />
                  </span>
                  <span className="min-w-45 flex-1">
                    <b className="block">{rfq.title}</b>
                    <span className="text-sm text-muted-foreground">
                      {getRfqCategoryLabel(rfq.category_id)} ·{" "}
                      {formatRfqBudget(rfq.budget_type, rfq.budget_from, rfq.budget_to, rfq.currency)} · {when}
                    </span>
                  </span>
                  {isOpen && proposalsCount ? (
                    <span
                      className={cn(
                        "whitespace-nowrap text-sm font-semibold",
                        count > 0 ? "text-brand-700" : "text-muted-foreground",
                      )}
                    >
                      {formatCount(count, "предложение", "предложения", "предложений")}
                    </span>
                  ) : null}
                  <RfqStatusBadge status={rfq.status} />
                  <ChevronRight size={20} className="hidden text-muted-foreground sm:block" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
