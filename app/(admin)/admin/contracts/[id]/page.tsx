"use client"

import { use, useState } from "react"
import { formatCurrency } from "@/lib/format"
import Link from "next/link"
import { BookOpenIcon as BookOpen, CheckCircleIcon as CheckCircle2, GavelIcon as Gavel, ArrowsCounterClockwiseIcon as RefreshCcw, SnowflakeIcon as Snowflake, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { ContractActionDialog } from "@/components/admin/contracts/contract-action-dialog"
import { AdminContractDetailSections } from "@/components/admin/contracts/contract-detail-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAdminContractQuery } from "@/hooks/api/use-admin-contracts-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminContractAction } from "@/lib/api/admin"
import { contractStatusMeta } from "@/lib/contract-display"
import type { ContractStatus } from "@/types"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sections = [
  ["overview", "Обзор"],
  ["buyer", "Покупатель"],
  ["supplier", "Исполнитель"],
  ["payment-plan", "План оплаты"],
  ["milestones", "Этапы"],
  ["files", "Файлы"],
  ["messages", "Сообщения"],
  ["escrow", "Гарантия"],
  ["history", "История"],
] as const

const DetailSkeleton = () => (
  <PageFrame className="animate-pulse space-y-5">
    <div className="h-5 w-36 rounded bg-muted" />
    <div className="h-56 rounded-xl bg-muted" />
    <div className="h-14 rounded-xl bg-muted" />
    <div className="h-80 rounded-xl bg-muted" />
  </PageFrame>
)


type PageProps = {
  params: Promise<{ id: string }>
}

export default function AdminContractDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const contractId = Number(id)
  const contractQuery = useAdminContractQuery(contractId)
  const [selectedAction, setSelectedAction] = useState<AdminContractAction | null>(null)
  const canUpdate = useAdminPermission("admin_contracts.update")
  const canForceComplete = useAdminPermission("admin_contracts.force_complete")

  if (!Number.isInteger(contractId) || contractId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID контракта</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/contracts">Вернуться к контрактам</Link>
        </Button>
      </div>
    )
  }

  if (contractQuery.isLoading) return <DetailSkeleton />

  if (contractQuery.isError || !contractQuery.data) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Контракт не найден</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/contracts">К списку</Link>
            </Button>
            <Button type="button" onClick={() => contractQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const contract = contractQuery.data
  const statusMeta = contractStatusMeta[contract.status as ContractStatus] || {
    label: contract.status,
    className: "bg-muted text-muted-foreground",
  }
  const isClosed = ["completed", "cancelled"].includes(contract.status)
  const buyerName =
    contract.buyer?.company_title ||
    contract.buyer?.name ||
    contract.buyer?.display_name ||
    "Без покупателя"
  const supplierName =
    contract.supplier?.company_title ||
    contract.supplier?.name ||
    contract.supplier?.display_name ||
    "Без исполнителя"

  return (
    <PageFrame>
      <PageHeader
        title={contract.title}
        description={
          <>
            {buyerName} → {supplierName}
            {" · "}
            {formatMoney(contract.agreed_amount, contract.currency)}
          </>
        }
        backHref="/admin/contracts"
        backLabel="Все контракты"
      />
      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-muted-foreground">
              Контракт · #{contract.id}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
              {contract.escrow_held > 0 && (
                <Badge variant="outline">
                  На гарантии: {formatMoney(contract.escrow_held, contract.currency)}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:max-w-xl xl:justify-end">
            {canUpdate && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("freeze")}
              >
                <Snowflake aria-hidden="true" />
                Заморозить
              </Button>
            )}
            {canUpdate && !isClosed && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("cancel")}
              >
                <XCircle aria-hidden="true" />
                Отменить
              </Button>
            )}
            {canForceComplete && contract.status !== "completed" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("force_complete")}
              >
                <CheckCircle2 aria-hidden="true" />
                Принудительно завершить
              </Button>
            )}
            {canUpdate && !isClosed && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAction("open_investigation")}
              >
                <Gavel aria-hidden="true" />
                Открыть расследование
              </Button>
            )}
          </div>
        </div>
      </PageSurface>

      <nav
        className="flex gap-2 overflow-x-auto rounded-xl border border-border bg-card p-2"
        aria-label="Секции контракта"
      >
        {sections.map(([sectionId, label]) => (
          <a
            key={sectionId}
            href={`#${sectionId}`}
            className="shrink-0 rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {label}
          </a>
        ))}
      </nav>

      <AdminContractDetailSections contract={contract} />

      <ContractActionDialog
        contractId={contract.id}
        contractTitle={contract.title}
        action={selectedAction}
        onOpenChange={(open) => {
          if (!open) setSelectedAction(null)
        }}
      />
    </PageFrame>
  )
}
