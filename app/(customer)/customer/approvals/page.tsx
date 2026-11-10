"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { SealCheckIcon as BadgeCheck, InfoIcon as Info, GearIcon as Settings } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/bm"
import {
  ListSkeleton,
  PageEmptyState,
  PageFrame,
  PageHeader,
  SegmentedControl,
} from "@/components/layout"
import {
  MOCK_BUYER_APPROVALS,
  type BuyerApproval,
  type BuyerApprovalStatus,
} from "@/lib/mock/buyer-approvals"
import { formatCurrency, formatIsoDate } from "@/lib/format"
import { isApiEnabled } from "@/lib/api/config"
import { useHydrated } from "@/hooks/use-hydrated"
import { ListPagination } from "@/components/list-pagination"
import {
  emptyBuyerNavCounts,
  useBuyerNavCounts,
  useMarkNavSectionSeen,
} from "@/hooks/api/use-nav-counts-query"
import {
  useApprovalsQuery,
  useDecideApprovalMutation,
} from "@/hooks/api/use-approvals-query"
import type { PurchaseApproval } from "@/lib/api/approvals"

type Tab = "wait" | "hist"

const STATUS_LABEL: Record<BuyerApprovalStatus, string> = {
  wait: "Ждёт решения",
  auto: "В лимите",
  approved: "Согласовано",
  rejected: "Отклонено",
}

const mapApiApproval = (a: PurchaseApproval): BuyerApproval => ({
  id: String(a.id),
  whoName: a.who_name,
  whoRole: a.who_role,
  limitLabel: a.limit_label,
  what: a.title,
  supplierName: a.supplier_name,
  amount: a.amount,
  currency: a.currency,
  created: a.created_at.slice(0, 10),
  status: a.status,
  reason: a.reason,
})

export default function CustomerApprovalsPage() {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  useMarkNavSectionSeen("buyer", "approvals")
  const [tab, setTab] = useState<Tab>("wait")
  const [page, setPage] = useState(1)
  const [localItems, setLocalItems] = useState<BuyerApproval[]>(MOCK_BUYER_APPROVALS)

  const { data: apiPage, isLoading } = useApprovalsQuery(
    tab,
    hydrated && useApi,
    { page },
  )
  const navCounts = useBuyerNavCounts(hydrated && useApi).data ?? emptyBuyerNavCounts()
  const decideMutation = useDecideApprovalMutation()

  const items: BuyerApproval[] = useApi
    ? (apiPage?.items ?? []).map(mapApiApproval)
    : localItems
  const totalPages = useApi ? (apiPage?.total_pages ?? 0) : 1

  const waitCount = useApi
    ? navCounts.approvals
    : items.filter((a) => a.status === "wait").length
  const list = useMemo(
    () =>
      items.filter((a) =>
        tab === "wait" ? a.status === "wait" : a.status !== "wait",
      ),
    [items, tab],
  )

  const handleTabChange = (next: Tab) => {
    setTab(next)
    setPage(1)
  }

  const decide = async (id: string, status: "approved" | "rejected") => {
    if (useApi) {
      await decideMutation.mutateAsync({ id: Number(id), action: status })
      return
    }
    setLocalItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Согласования"
        description="Покупки сотрудников дороже их лимита ждут вашего решения"
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/customer/company">
              <Settings size={16} />
              Лимиты сотрудников
            </Link>
          </Button>
        }
      />

      <SegmentedControl
        value={tab}
        onChange={handleTabChange}
        ariaLabel="Фильтр согласований"
        options={[
          { value: "wait", label: "Ждут решения", count: waitCount },
          { value: "hist", label: "История" },
        ]}
        className="mb-5"
      />

      {useApi && isLoading ? (
        <ListSkeleton label="Загружаем согласования" />
      ) : list.length === 0 ? (
        <PageEmptyState
          variant="card"
          icon={<BadgeCheck />}
          title="Нет покупок на согласовании"
          description="Когда сотрудник захочет купить дороже своего лимита, заявка появится здесь."
        />
      ) : (
        <div className="grid gap-3">
          {list.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6"
            >
              <div className="flex flex-wrap items-start gap-4">
                <div className="grid min-w-[240px] flex-1 gap-1">
                  <b className="text-[16px]">{a.what}</b>
                  <span className="text-[13.5px] text-mute">
                    {a.whoName} · {a.whoRole} · лимит {a.limitLabel} ·{" "}
                    {formatIsoDate(a.created)}
                  </span>
                  <span className="text-[13.5px]">
                    Поставщик: {a.supplierName}
                  </span>
                  {a.status === "wait" && a.reason ? (
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-amber-800">
                      <Info className="size-4 shrink-0" aria-hidden />
                      {a.reason}
                    </span>
                  ) : null}
                </div>
                <div className="grid justify-items-end gap-2 text-right">
                  <b className="mono text-[20px]">
                    {formatCurrency(a.amount, a.currency)}
                  </b>
                  {a.status === "wait" ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9"
                        disabled={decideMutation.isPending}
                        onClick={() => void decide(a.id, "rejected")}
                      >
                        Отклонить
                      </Button>
                      <Button
                        type="button"
                        className="h-9"
                        disabled={decideMutation.isPending}
                        onClick={() => void decide(a.id, "approved")}
                      >
                        Согласовать
                      </Button>
                    </div>
                  ) : (
                    <StatusBadge
                      status={a.status}
                      label={STATUS_LABEL[a.status]}
                    />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  )
}
