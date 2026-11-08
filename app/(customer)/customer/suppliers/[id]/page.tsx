"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageFrame, PageHeader } from "@/components/layout"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useItemsStore } from "@/lib/store/items-store"
import { useRfqsStore } from "@/lib/store/rfqs-store"
import { useNotificationsStore } from "@/lib/store/notifications-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import {
  usePublicSupplierCatalogQuery,
  usePublicSupplierQuery,
  usePublicSupplierReviewsQuery,
} from "@/hooks/api/use-public-query"
import {
  useInviteSuppliersMutation,
  useRfqsQuery,
} from "@/hooks/api/use-rfqs-query"
import {
  getActiveCatalogItemsCount,
  getSupplierCategories,
  isSupplierCompany,
  toPublicSupplierFromCompany,
} from "@/lib/supplier-directory"
import { SupplierProfileHeader } from "@/components/cabinet/suppliers/supplier-profile-header"
import { SupplierStatsPanel } from "@/components/cabinet/suppliers/supplier-stats-panel"
import { CustomerCatalogGrid } from "@/components/cabinet/catalog/customer-catalog-grid"
import { SupplierReviewsList } from "@/components/cabinet/suppliers/supplier-reviews-list"
import { InviteRfqDialog } from "@/components/cabinet/suppliers/invite-rfq-dialog"
import { useOpenDirectChatMutation } from "@/hooks/api/use-direct-chats-query"
import type { PublicSupplier } from "@/types"

type PageProps = {
  params: Promise<{ id: string }>
}

export default function SupplierProfilePage({ params }: PageProps) {
  const { id } = use(params)
  const supplierActorId = Number(id)
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const router = useRouter()
  const actorId = getActorId(useAuthStore((s) => s.user))
  const openDirectChat = useOpenDirectChatMutation("buyer")
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const getItemsBySupplier = useItemsStore((s) => s.getItemsBySupplier)
  const inviteSupplierToRfq = useRfqsStore((s) => s.inviteSupplierToRfq)
  const getInvitableRfqsForBuyer = useRfqsStore((s) => s.getInvitableRfqsForBuyer)
  const notify = useNotificationsStore((s) => s.add)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data: apiSupplier, isLoading: supplierLoading } = usePublicSupplierQuery(
    supplierActorId,
    hydrated && useApi,
  )
  const { data: apiCatalogPage } = usePublicSupplierCatalogQuery(
    supplierActorId,
    hydrated && useApi,
  )
  const apiCatalog = apiCatalogPage?.items ?? []
  const { data: apiReviewsPage } = usePublicSupplierReviewsQuery(
    supplierActorId,
    hydrated && useApi,
  )
  const apiReviews = apiReviewsPage?.items ?? []
  const { data: apiRfqsPage } = useRfqsQuery("published", hydrated && useApi)
  const apiRfqs = apiRfqsPage?.items ?? []
  const inviteMutation = useInviteSuppliersMutation()

  const localCompany = hydrated ? getCompany(supplierActorId) : undefined
  const localSupplier: PublicSupplier | undefined =
    localCompany && isSupplierCompany(localCompany)
      ? toPublicSupplierFromCompany(
          localCompany,
          getActiveCatalogItemsCount(getItemsBySupplier(localCompany.id)),
        )
      : undefined

  const supplier: PublicSupplier | undefined = useApi ? apiSupplier : localSupplier

  const catalogItems = useApi
    ? apiCatalog.filter((i) => i.status === "active")
    : hydrated && localCompany
      ? getItemsBySupplier(localCompany.id).filter((i) => i.status === "active")
      : []

  const categories = useApi
    ? (supplier?.industries.map((name, i) => ({
        id: i,
        parent_id: null,
        name,
        slug: name,
      })) ?? [])
    : getSupplierCategories(catalogItems)

  const invitableRfqs = useApi
    ? apiRfqs.filter(
        (r) =>
          (r.status === "published" || r.status === "receiving_proposals") &&
          String(r.actor_id) === String(actorId),
      )
    : hydrated
      ? getInvitableRfqsForBuyer(actorId)
      : []

  const reviews = useApi ? apiReviews : (localCompany?.reviews ?? [])

  if (!hydrated || (useApi && supplierLoading)) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-8 w-1/4 rounded-xl bg-secondary" />
        <div className="h-48 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  if (!supplier) {
    return (
      <PageFrame>
        <PageHeader title="Исполнитель не найден" backHref="/customer/suppliers" backLabel="К каталогу" />
      </PageFrame>
    )
  }

  const handleContact = () => {
    const messagesHref = `/customer/messages?supplier=${supplier.actor_id}`
    if (useApi) {
      openDirectChat.mutate(supplier.actor_id, {
        onSuccess: () => router.push(messagesHref),
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Не удалось открыть чат")
        },
      })
      return
    }
    router.push(messagesHref)
  }

  const handleInviteExisting = (rfqId: string) => {
    if (useApi) {
      inviteMutation.mutate(
        { id: rfqId, supplierIds: [supplier.actor_id] },
        {
          onSuccess: () => {
            toast.success("Поставщик приглашён")
            notify({
              type: "order",
              title: "Приглашение отправлено",
              body: `Исполнитель «${supplier.display_name}» приглашён к участию в заявке.`,
              href: `/customer/rfqs/${rfqId}`,
            })
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Не удалось пригласить исполнителя")
          },
        },
      )
      return
    }
    inviteSupplierToRfq(rfqId, supplier.actor_id)
    notify({
      type: "order",
      title: "Приглашение отправлено",
      body: `Исполнитель «${supplier.display_name}» приглашён к участию в заявке.`,
      href: `/customer/rfqs/${rfqId}`,
    })
  }

  return (
    <PageFrame>
      <PageHeader
        title={supplier.display_name}
        backHref="/customer/suppliers"
        backLabel="К каталогу"
      />

      <SupplierProfileHeader
        supplier={supplier}
        categories={categories}
        onContact={handleContact}
        onInvite={() => setInviteOpen(true)}
      />

      <SupplierStatsPanel supplier={supplier} />

      <div>
        <h2 className="text-base font-bold text-foreground mb-3">
          Каталог ({catalogItems.length})
        </h2>
        <CustomerCatalogGrid
          items={catalogItems}
          emptyText="У исполнителя пока нет опубликованных позиций в каталоге"
        />
      </div>

      <SupplierReviewsList reviews={reviews} />

      <InviteRfqDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        supplierId={supplier.actor_id}
        supplierName={supplier.display_name}
        invitableRfqs={invitableRfqs}
        onInviteExisting={handleInviteExisting}
      />
    </PageFrame>
  )
}
