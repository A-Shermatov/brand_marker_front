"use client"

import { use, useState } from "react"
import { useSearchParams } from "next/navigation"
import { WarningIcon as AlertTriangle, CertificateIcon as FileCheck, ChatTextIcon as MessageSquare, PaperclipIcon as Paperclip, UploadSimpleIcon as Upload, GavelIcon as Gavel } from "@phosphor-icons/react/dist/ssr"
import { PageFrame, PageHeader } from "@/components/layout"
import { DealStepper } from "@/components/process"
import { SupplierDealNextAction } from "@/components/supplier/contracts/supplier-deal-next-action"
import { statusPillClass } from "@/components/ui/status-badge"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { usePublicBuyerQuery } from "@/hooks/api/use-public-query"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { supplierReviewsApi } from "@/lib/api/companies"
import {
  useMarkMessagesReadMutation,
  useSupplierContractQuery,
  useSupplierOpenDisputeMutation,
  useSupplierSendMessageMutation,
  useSupplierSubmitDisputeStatementMutation,
  useSupplierSubmitWorkMutation,
  useSupplierUploadContractFileMutation,
  useSupplierUploadDisputeEvidenceMutation,
} from "@/hooks/api/use-contracts-query"
import {
  useCreateSupplierReviewMutation,
  useSupplierReviewsQuery,
} from "@/hooks/api/use-reviews-query"
import { canUploadContractFiles, contractStatusMeta } from "@/lib/contract-display"
import { formatCurrency, formatIsoDate } from "@/lib/format"
import { DeadlineCountdown } from "@/components/contracts/deadline-countdown"
import { ContractBuyerCard } from "@/components/supplier/contracts/contract-buyer-card"
import { ContractMilestonesPanel } from "@/components/supplier/contracts/contract-milestones-panel"
import { ContractEscrowCard } from "@/components/supplier/contracts/contract-escrow-card"
import { ContractFilesPanel } from "@/components/supplier/contracts/contract-files-panel"
import { ContractMessagesPanel } from "@/components/supplier/contracts/contract-messages-panel"
import { ContractSubmissionPanel } from "@/components/supplier/contracts/contract-submission-panel"
import { ContractDisputeDialog } from "@/components/supplier/contracts/contract-dispute-dialog"
import { ContractDisputePanel } from "@/components/contracts/contract-dispute-panel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { ContractWithRelations } from "@/types"

type PageProps = {
  params: Promise<{ id: string }>
}

const DISPUTE_DISABLED_STATUSES = ["disputed", "cancelled", "completed"] as const
const LINKABLE_TABS = ["overview", "messages", "files", "submission", "dispute"]

export default function SupplierContractDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const contractId = Number(id)
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const userId = user?.userId ?? 0
  const useApi = isApiEnabled()

  const getContractLocal = useContractsStore((s) => s.getContract)
  const submitWorkLocal = useContractsStore((s) => s.submitWork)
  const openDisputeLocal = useContractsStore((s) => s.openDispute)
  const addMessageLocal = useContractsStore((s) => s.addMessage)
  const markConversationReadLocal = useContractsStore((s) => s.markConversationRead)
  const addFileLocal = useContractsStore((s) => s.addFile)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [tab, setTab] = useState<string | null>(
    tabParam && LINKABLE_TABS.includes(tabParam) ? tabParam : null,
  )

  const { data: apiContract, isLoading } = useSupplierContractQuery(
    contractId,
    hydrated && useApi,
  )
  const sendMessageMutation = useSupplierSendMessageMutation()
  const markMessagesReadMutation = useMarkMessagesReadMutation("supplier")
  const openDisputeMutation = useSupplierOpenDisputeMutation()
  const submitWorkMutation = useSupplierSubmitWorkMutation()
  const uploadFileMutation = useSupplierUploadContractFileMutation()
  const uploadDisputeEvidenceMutation = useSupplierUploadDisputeEvidenceMutation()
  const submitDisputeStatementMutation = useSupplierSubmitDisputeStatementMutation()
  const createReviewMutation = useCreateSupplierReviewMutation()
  const { data: givenReviews } = useSupplierReviewsQuery(hydrated && useApi)

  const localContract = hydrated ? getContractLocal(contractId) : undefined
  const contract: ContractWithRelations | undefined = useApi
    ? (apiContract as ContractWithRelations | undefined)
    : localContract

  const buyerActorId = contract?.buyer_actor_id ?? 0
  const buyerQuery = usePublicBuyerQuery(
    buyerActorId,
    hydrated && useApi && buyerActorId > 0,
  )

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-8 w-1/3 rounded-xl bg-secondary" />
        <div className="h-40 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  if (!contract || contract.supplier_actor_id !== actorId) {
    return (
      <PageFrame>
        <PageHeader title="Сделка не найдена" backHref="/supplier/contracts" backLabel="Вернуться к сделкам" />
      </PageFrame>
    )
  }

  const meta = contractStatusMeta[contract.status]
  const buyer = buyerQuery.data
  const buyerName = buyer?.display_name ?? "Заказчик"
  const hasReview = Boolean(
    givenReviews?.items?.some((review) => review.contract_id === contractId),
  )
  const canDispute = !DISPUTE_DISABLED_STATUSES.includes(
    contract.status as (typeof DISPUTE_DISABLED_STATUSES)[number],
  )
  const messageCount = contract.conversation?.messages?.length ?? 0
  const fileCount = contract.files?.length ?? 0
  const activeDispute = contract.dispute ?? null
  const canUploadDisputeEvidence =
    useApi &&
    (activeDispute?.status === "open" ||
      activeDispute?.status === "under_review" ||
      activeDispute?.status === "appealed")
  const showDisputeTab =
    Boolean(activeDispute) || contract.status === "disputed"
  const defaultTab =
    activeDispute?.status === "under_review" ? "dispute" : "overview"
  const activeTab = tab === "dispute" && !showDisputeTab ? defaultTab : (tab ?? defaultTab)

  const handleSendMessage = (text: string) => {
    if (useApi) {
      sendMessageMutation.mutate({ contractId, text })
      return
    }
    addMessageLocal(contractId, userId, text, user?.name)
  }

  const handleSubmitWork = (input: {
    note: string
    fileNames: string[]
    assets: { kind: "image" | "video" | "file" | "link"; name: string; url: string; file_type?: string | null }[]
  }) => {
    if (useApi) {
      submitWorkMutation.mutate({
        contractId,
        note: input.note,
        fileNames: input.fileNames,
        assets: input.assets,
      })
      return
    }
    submitWorkLocal(contractId, input)
  }

  const handleUploadDisputeEvidence = async (file: File) => {
    try {
      await uploadDisputeEvidenceMutation.mutateAsync({ contractId, file })
    } catch {
      // error toast comes from the mutation meta
    }
  }

  const handleSubmitDisputeStatement = async (text: string) => {
    try {
      await submitDisputeStatementMutation.mutateAsync({ contractId, text })
    } catch {
      // error toast comes from the mutation meta
    }
  }

  const handleUploadFiles = async (files: File[]) => {
    if (!useApi) {
      files.forEach((file) => {
        addFileLocal(
          contractId,
          {
            file_name: file.name,
            file_url: URL.createObjectURL(file),
            file_type: file.type || "application/octet-stream",
          },
          { id: userId, name: user?.name, side: "supplier" },
        )
      })
      return
    }
    setIsUploadingFiles(true)
    try {
      for (const file of files) {
        try {
          await uploadFileMutation.mutateAsync({ contractId, file })
        } catch {
          // error toast comes from the mutation meta
        }
      }
    } finally {
      setIsUploadingFiles(false)
    }
  }

  return (
    <PageFrame>
      <PageHeader
        title={contract.title}
        description={buyerName}
        backHref="/supplier/contracts"
        backLabel="Мои сделки"
        actions={
          <p className="text-lg font-bold text-primary tnum">
            {formatCurrency(contract.agreed_amount, contract.currency)}
          </p>
        }
      />

      <div className="grid gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
        <DealStepper contract={contract} />
        <div className="flex flex-wrap items-center gap-3">
          <DeadlineCountdown
            dueDate={contract.due_date}
            status={contract.status}
            variant="prominent"
            showAbsoluteDate
          />
          <span className={`${statusPillClass} ${meta.className}`}>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground">
            с {formatIsoDate(contract.start_date)}
          </span>
          {canDispute && (
            <button
              type="button"
              onClick={() => setDisputeOpen(true)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              <AlertTriangle size={12} />
              Открыть спор
            </button>
          )}
          {showDisputeTab && (
            <span className="ml-auto text-xs text-destructive font-semibold">Спор открыт</span>
          )}
        </div>
      </div>

      <SupplierDealNextAction
        contract={contract}
        buyerName={buyerName}
        hasReview={hasReview}
        onOpenTab={setTab}
        onSubmitReview={(payload) => {
          if (!useApi) return
          createReviewMutation.mutate({
            contract_id: contractId,
            target_actor_id: contract.buyer_actor_id,
            rating: payload.rating,
            service_rating: payload.service_rating,
            delivery_rating: payload.delivery_rating,
            quality_rating: payload.quality_rating,
            tags: payload.tags,
            comment: payload.comment || null,
            photos: payload.photos,
          })
        }}
        onUploadReviewPhoto={
          useApi ? (file) => supplierReviewsApi.uploadMedia(file) : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <FileCheck size={14} /> Обзор
          </TabsTrigger>
          {showDisputeTab && (
            <TabsTrigger value="dispute" className="gap-1.5">
              <Gavel size={14} /> Спор
            </TabsTrigger>
          )}
          <TabsTrigger value="messages" className="gap-1.5">
            <MessageSquare size={14} /> Сообщения
            {messageCount > 0 && (
              <span className="ml-1 text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                {messageCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-1.5">
            <Paperclip size={14} /> Файлы
            {fileCount > 0 && (
              <span className="ml-1 text-[10px] bg-muted text-muted-foreground font-semibold px-1.5 py-0.5 rounded-full">
                {fileCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="submission" className="gap-1.5">
            <Upload size={14} /> Сдача работы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-3 gap-5 items-start">
            <div className="lg:col-span-2 space-y-5">
              {contract.description && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-foreground mb-2">Описание</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{contract.description}</p>
                </div>
              )}
              <ContractMilestonesPanel contract={contract} />
            </div>
            <div className="space-y-5 lg:sticky lg:top-24">
              <ContractBuyerCard buyer={buyer} loading={buyerQuery.isLoading} />
              <ContractEscrowCard contract={contract} showPayout />
            </div>
          </div>
        </TabsContent>

        {showDisputeTab && (
          <TabsContent value="dispute">
            {activeDispute ? (
              <ContractDisputePanel
                dispute={activeDispute}
                canUpload={canUploadDisputeEvidence}
                uploading={uploadDisputeEvidenceMutation.isPending}
                onUpload={handleUploadDisputeEvidence}
                viewerSide="supplier"
                canSubmitStatement={canUploadDisputeEvidence}
                submittingStatement={submitDisputeStatementMutation.isPending}
                onSubmitStatement={handleSubmitDisputeStatement}
              />
            ) : (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                <p className="text-sm font-semibold text-destructive">Спор открыт</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Закрыть спор может только администратор.
                </p>
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="messages">
          <ContractMessagesPanel
            contract={contract}
            currentUserId={userId}
            counterpartName={buyerName}
            onSendMessage={handleSendMessage}
            onMarkRead={(id) => {
              if (useApi) markMessagesReadMutation.mutate(id)
              else markConversationReadLocal(id, userId)
            }}
          />
        </TabsContent>

        <TabsContent value="files">
          <ContractFilesPanel
            files={contract.files}
            canUpload={canUploadContractFiles(contract.status)}
            uploading={isUploadingFiles}
            onUpload={handleUploadFiles}
          />
        </TabsContent>

        <TabsContent value="submission">
          <ContractSubmissionPanel
            contract={contract}
            onSubmit={handleSubmitWork}
          />
        </TabsContent>
      </Tabs>

      <ContractDisputeDialog
        open={disputeOpen}
        onOpenChange={setDisputeOpen}
        onConfirm={(reason) => {
          if (useApi) {
            openDisputeMutation.mutate({ contractId, reason })
            return
          }
          openDisputeLocal(contractId, reason, actorId)
        }}
      />
    </PageFrame>
  )
}
