"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { PaperPlaneRightIcon as Send, ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { ListPagination } from "@/components/list-pagination"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
} from "@/components/layout"
import { useAuthStore } from "@/lib/store/auth-store"
import { useProposalsStore } from "@/lib/store/proposals-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { getRfqBuyerName } from "@/lib/buyer-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  useSupplierProposalsQuery,
  useSupplierRfqBoardQuery,
} from "@/hooks/api/use-supplier-rfqs-query"
import { MyProposalsList } from "@/components/supplier/proposals/my-proposals-list"
import type { ProposalWithRelations, RfqWithRelations } from "@/types"

export default function SupplierProposalsPage() {
  const hydrated = useHydrated()
  const [page, setPage] = useState(1)
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const getProposalsBySupplier = useProposalsStore((s) => s.getProposalsBySupplier)
  const getRfq = useRfqsStore((s) => s.getRfq)
  const getCompany = useCompaniesStore((s) => s.getCompany)

  const useApi = isApiEnabled()
  const { data: apiProposals, isLoading } = useSupplierProposalsQuery(hydrated && useApi, {
    page,
  })
  const { data: apiBoard } = useSupplierRfqBoardQuery(hydrated && useApi)

  const localProposals: ProposalWithRelations[] = hydrated
    ? getProposalsBySupplier(actorId).map((p) => ({ attachment: null, ...p }))
    : []
  const allProposals: ProposalWithRelations[] = useApi
    ? (apiProposals?.items ?? [])
    : localProposals
  const totalPages = useApi ? (apiProposals?.total_pages ?? 0) : 1

  const rfqById = useMemo(() => {
    const map = new Map<string, RfqWithRelations>()
    for (const rfq of apiBoard?.items ?? []) {
      map.set(rfq.id, rfq)
    }
    return map
  }, [apiBoard])

  const resolveRfq = (rfqId: string): RfqWithRelations | undefined =>
    rfqById.get(rfqId) ?? getRfq(rfqId)

  const getRfqTitle = (rfqId: string) => resolveRfq(rfqId)?.title ?? rfqId

  const getBuyerName = (rfqId: string) => {
    const rfq = resolveRfq(rfqId)
    return rfq ? getRfqBuyerName(rfq, getCompany) : "Покупатель"
  }

  const getDeadline = (rfqId: string) => resolveRfq(rfqId)?.deadline

  return (
    <PageFrame>
      <PageHeader
        title="Мои КП"
        description="Отправленные КП и что с ними: покупатель ещё выбирает, выбрал вас или другого поставщика"
      />

      {!hydrated || (useApi && isLoading) ? (
        <PageSurface className="animate-pulse p-12">
          <div className="mx-auto h-4 w-1/3 rounded bg-secondary" />
        </PageSurface>
      ) : allProposals.length === 0 ? (
        <PageSurface>
          <PageEmptyState
            icon={<Send size={32} />}
            title="Предложений нет"
            description="Вы ещё не отправляли предложений на заявки."
          />
          <div className="flex justify-center pb-10">
            <Button asChild size="lg">
              <Link href="/supplier/rfqs">
                К заявкам <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        </PageSurface>
      ) : (
        <MyProposalsList
          proposals={allProposals}
          getRfqTitle={getRfqTitle}
          getBuyerName={getBuyerName}
          getDeadline={getDeadline}
        />
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </PageFrame>
  )
}
