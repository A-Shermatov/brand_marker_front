"use client"

import { use, useState } from "react"
import Link from "next/link"
import { WarningIcon as AlertTriangle, CertificateIcon as FileCheck, ChatTextIcon as MessageSquare, PaperclipIcon as Paperclip, ClockIcon as Clock, PackageIcon as Package, GavelIcon as Gavel } from "@phosphor-icons/react/dist/ssr"
import { ConfirmActionDialog, DealStepper } from "@/components/process"
import { BuyerDealNextAction } from "@/components/cabinet/contracts/buyer-deal-next-action"
import { PageFrame, PageHeader } from "@/components/layout"
import { PaymentModeBadge } from "@/components/payments/payment-mode-choice"
import { statusPillClass } from "@/components/ui/status-badge"
import { useAuthStore } from "@/lib/store/auth-store"
import { useContractsStore } from "@/lib/store/contracts-store"
import { useCompaniesStore } from "@/lib/store/companies-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { getActorId } from "@/lib/auth-display"
import { isApiEnabled } from "@/lib/api/config"
import { reviewsApi } from "@/lib/api/companies"
import {
  useApproveSubmissionMutation,
  useContractQuery,
  useMarkMessagesReadMutation,
  useOpenDisputeMutation,
  useRejectSubmissionMutation,
  useSendMessageMutation,
  useSubmitDisputeStatementMutation,
  useUploadContractFileMutation,
  useUploadDisputeEvidenceMutation,
} from "@/hooks/api/use-contracts-query"
import { useCreateReviewMutation, useBuyerReviewsQuery } from "@/hooks/api/use-reviews-query"
import { useSupplierActorName } from "@/hooks/api/use-supplier-name"
import {
  useAlifPayment,
  useFundAndConfirmMilestoneMutation,
  useApproveMilestoneMutation,
  usePaymentHistoryQuery,
} from "@/hooks/api/use-payments-query"
import {
  ALIF_CONFIRM_LABEL,
  AlifPaymentNote,
} from "@/components/cabinet/payments/alif-payment-note"
import { canUploadContractFiles, contractStatusMeta } from "@/lib/contract-display"
import { formatCurrency, formatIsoDate } from "@/lib/format"
import { DeadlineCountdown } from "@/components/contracts/deadline-countdown"
import { ContractSupplierCard } from "@/components/cabinet/contracts/contract-supplier-card"
import { BuyerContractMilestonesPanel } from "@/components/cabinet/contracts/buyer-contract-milestones-panel"
import { BuyerContractSubmissionsPanel } from "@/components/cabinet/contracts/buyer-contract-submissions-panel"
import { ContractPaymentHistoryPanel } from "@/components/cabinet/contracts/contract-payment-history-panel"
import { ContractEscrowCard } from "@/components/supplier/contracts/contract-escrow-card"
import { ContractFilesPanel } from "@/components/supplier/contracts/contract-files-panel"
import { ContractMessagesPanel } from "@/components/supplier/contracts/contract-messages-panel"
import { ContractDisputeDialog } from "@/components/supplier/contracts/contract-dispute-dialog"
import { ContractDisputePanel } from "@/components/contracts/contract-dispute-panel"
import type { PaymentHistoryEvent } from "@/lib/buyer-payments-display"
import { mapApiPaymentHistoryEvent } from "@/lib/buyer-payments-display"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { ContractWithRelations } from "@/types"

type PageProps = {
  params: Promise<{ id: string }>
}

const DISPUTE_DISABLED_STATUSES = ["disputed", "cancelled", "completed"] as const

type PendingAction = { kind: "fund" | "release" | "accept" | "rework"; id: number }

export default function BuyerContractDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const contractId = Number(id)
  const hydrated = useHydrated()
  const user = useAuthStore((s) => s.user)
  const actorId = getActorId(user)
  const userId = user?.userId ?? 0
  const useApi = isApiEnabled()

  const getContractLocal = useContractsStore((s) => s.getContract)
  const fundMilestoneLocal = useContractsStore((s) => s.fundMilestone)
  const approveMilestoneLocal = useContractsStore((s) => s.approveMilestone)
  const getPaymentHistoryLocal = useContractsStore((s) => s.getPaymentHistory)
  const openDisputeLocal = useContractsStore((s) => s.openDispute)
  const addMessageLocal = useContractsStore((s) => s.addMessage)
  const markConversationReadLocal = useContractsStore((s) => s.markConversationRead)
  const approveSubmissionLocal = useContractsStore((s) => s.approveSubmission)
  const rejectSubmissionLocal = useContractsStore((s) => s.rejectSubmission)
  const addFileLocal = useContractsStore((s) => s.addFile)
  const getCompany = useCompaniesStore((s) => s.getCompany)
  const submitReview = useCompaniesStore((s) => s.submitReview)
  const hasReviewForContract = useCompaniesStore((s) => s.hasReviewForContract)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [tab, setTab] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const { data: apiContract, isLoading } = useContractQuery(contractId, hydrated && useApi)
  const { data: paymentHistoryPage } = usePaymentHistoryQuery(hydrated && useApi)
  const paymentHistoryApi = paymentHistoryPage?.items ?? []
  const { viaAlif, currency: alifCurrency } = useAlifPayment(hydrated && useApi)
  const { data: buyerReviewsPage } = useBuyerReviewsQuery(hydrated && useApi)
  const buyerReviews = buyerReviewsPage?.items ?? []
  const sendMessageMutation = useSendMessageMutation()
  const markMessagesReadMutation = useMarkMessagesReadMutation("buyer")
  const openDisputeMutation = useOpenDisputeMutation()
  const fundAndConfirmMutation = useFundAndConfirmMilestoneMutation()
  const approveMilestoneMutation = useApproveMilestoneMutation()
  const createReviewMutation = useCreateReviewMutation()
  const approveSubmissionMutation = useApproveSubmissionMutation()
  const rejectSubmissionMutation = useRejectSubmissionMutation()
  const uploadFileMutation = useUploadContractFileMutation()
  const uploadDisputeEvidenceMutation = useUploadDisputeEvidenceMutation()
  const submitDisputeStatementMutation = useSubmitDisputeStatementMutation()

  const supplierActorId =
    (useApi ? apiContract?.supplier_actor_id : getContractLocal(contractId)?.supplier_actor_id) ?? 0
  const resolveSupplierName = useSupplierActorName(
    supplierActorId ? [supplierActorId] : [],
  )

  const localContract = hydrated ? getContractLocal(contractId) : undefined
  const contract: ContractWithRelations | undefined = useApi
    ? (apiContract as ContractWithRelations | undefined)
    : localContract

  if (!hydrated || (useApi && isLoading)) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-8 w-1/3 rounded-xl bg-secondary" />
        <div className="h-40 rounded-xl bg-secondary" />
      </PageFrame>
    )
  }

  if (!contract || contract.buyer_actor_id !== actorId) {
    return (
      <PageFrame>
        <PageHeader title="Сделка не найдена" backHref="/customer/contracts" backLabel="Вернуться к сделкам" />
      </PageFrame>
    )
  }

  const meta = contractStatusMeta[contract.status]
  const supplier = getCompany(contract.supplier_actor_id)
  const supplierName = useApi
    ? resolveSupplierName(contract.supplier_actor_id)
    : (supplier?.title ?? "Исполнитель")
  // A decided dispute on a closed deal can be appealed within the API's window.
  const canAppeal = Boolean(
    contract.appeal_until && new Date(contract.appeal_until).getTime() > Date.now(),
  )
  const canDispute =
    canAppeal ||
    !DISPUTE_DISABLED_STATUSES.includes(
      contract.status as (typeof DISPUTE_DISABLED_STATUSES)[number],
    )
  const paymentHistory: PaymentHistoryEvent[] = useApi
    ? paymentHistoryApi
        .filter((p) => p.contract_id === contractId)
        .map(mapApiPaymentHistoryEvent)
    : getPaymentHistoryLocal(contractId)
  const hasReview = useApi
    ? buyerReviews.some((r) => r.contract_id === contractId)
    : hasReviewForContract(actorId, contractId)

  const handleSendMessage = (text: string) => {
    if (useApi) {
      sendMessageMutation.mutate({ contractId, text })
      return
    }
    addMessageLocal(contractId, userId, text, user?.name)
    markConversationReadLocal(contractId, userId)
  }

  const handleSubmitReview = (payload: {
    rating: number
    service_rating: number
    delivery_rating: number
    quality_rating: number
    tags: string[]
    comment: string
    photos: Array<{ file_name: string; file_url: string }>
  }) => {
    if (useApi) {
      createReviewMutation.mutate({
        contract_id: contractId,
        target_actor_id: contract.supplier_actor_id,
        rating: payload.rating,
        service_rating: payload.service_rating,
        delivery_rating: payload.delivery_rating,
        quality_rating: payload.quality_rating,
        tags: payload.tags,
        comment: payload.comment || null,
        photos: payload.photos,
      })
      return
    }
    submitReview({
      contractId,
      reviewerActorId: actorId,
      targetActorId: contract.supplier_actor_id,
      rating: payload.rating,
      comment: payload.comment || null,
    })
  }

  const handleFund = (milestoneId: number) => {
    if (useApi) {
      fundAndConfirmMutation.mutate(milestoneId)
      return
    }
    fundMilestoneLocal(contractId, milestoneId, actorId)
  }

  const handleApprove = (milestoneId: number) => {
    if (useApi) {
      approveMilestoneMutation.mutate(milestoneId)
      return
    }
    approveMilestoneLocal(contractId, milestoneId, actorId)
  }

  const handleApproveSubmission = (submissionId: number) => {
    if (useApi) {
      approveSubmissionMutation.mutate({ contractId, submissionId })
      return
    }
    approveSubmissionLocal(contractId, submissionId)
  }

  const handleRejectSubmission = (submissionId: number) => {
    if (useApi) {
      rejectSubmissionMutation.mutate({ contractId, submissionId })
      return
    }
    rejectSubmissionLocal(contractId, submissionId)
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
          { id: userId, name: user?.name, side: "buyer" },
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

  const messageCount = contract.conversation?.messages?.length ?? 0
  const fileCount = contract.files?.length ?? 0
  const submissionCount = contract.submissions?.length ?? 0
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
  const activeTab = tab ?? defaultTab
  const paymentBusy = fundAndConfirmMutation.isPending || approveMilestoneMutation.isPending
  const submissionBusy =
    approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending

  // Sending the work back cannot be undone: ask first, then open the chat so the
  // buyer explains what to fix.
  const handleRequestChanges = (submissionId: number) => {
    setPendingAction({ kind: "rework", id: submissionId })
  }

  // Escrow: work can be accepted only after it is paid into the bank hold.
  const unpaidMilestone = contract.payment_plan?.milestones.find(
    (m) => m.status === "pending" || m.status === "awaiting_payment",
  )

  const handleConfirmPendingAction = () => {
    if (!pendingAction) return
    if (pendingAction.kind === "fund") handleFund(pendingAction.id)
    if (pendingAction.kind === "release") handleApprove(pendingAction.id)
    if (pendingAction.kind === "rework") {
      handleRejectSubmission(pendingAction.id)
      setTab("messages")
    }
    if (pendingAction.kind === "accept") {
      if (unpaidMilestone) handleFund(unpaidMilestone.id)
      else handleApproveSubmission(pendingAction.id)
    }
    setPendingAction(null)
  }

  const pendingMilestone =
    pendingAction && (pendingAction.kind === "fund" || pendingAction.kind === "release")
    ? contract.payment_plan?.milestones.find((m) => m.id === pendingAction.id)
    : undefined
  const pendingAmount = formatCurrency(
    pendingMilestone?.amount ?? contract.agreed_amount,
    contract.currency,
  )
  // What the supplier actually receives: the platform commission is withheld.
  const supplierGets = formatCurrency(
    pendingMilestone
      ? pendingMilestone.amount - (pendingMilestone.commission_amount ?? 0)
      : contract.agreed_amount - (contract.commission_amount ?? 0),
    contract.currency,
  )
  // "Pay at once": the money reaches the supplier on payment, nothing is held.
  const direct = contract.payment_mode === "direct"
  const fundDescription = direct
    ? `Вы выбрали оплату сразу: деньги получит ${supplierName} в момент оплаты. Вернуть их через гарантию площадки будет нельзя.`
    : contract.status === "completed"
      ? "Деньги будут удерживаться банком‑партнёром. Затем подтвердите выплату исполнителю."
      : "Деньги будут удерживаться банком‑партнёром. Исполнитель получит их только после того, как вы примете работу."
  const confirmCopy: Record<
    PendingAction["kind"],
    { title: string; description: React.ReactNode; confirmLabel: string }
  > = {
    fund: {
      title: `Оплатить ${pendingAmount}?`,
      description: viaAlif ? (
        <>
          <p>{fundDescription}</p>
          <AlifPaymentNote />
        </>
      ) : (
        fundDescription
      ),
      confirmLabel: viaAlif ? ALIF_CONFIRM_LABEL : "Оплатить",
    },
    rework: {
      title: "Отправить работу на доработку?",
      description: `Сдача будет отклонена, ${supplierName} увидит это в сделке. Затем откроется переписка — напишите, что нужно исправить.`,
      confirmLabel: "Отправить на доработку",
    },
    release: {
      title: "Перевести деньги исполнителю?",
      description: `${supplierName} получит ${supplierGets} (за вычетом комиссии площадки). Отменить выплату будет нельзя.`,
      confirmLabel: "Да, перевести",
    },
    accept: unpaidMilestone
      ? {
          title: "Сначала оплатите работу",
          description: direct
            ? `Принять работу можно после оплаты — ${formatCurrency(unpaidMilestone.amount, contract.currency)}. Деньги сразу получит исполнитель: после оплаты вернитесь сюда и примите работу.`
            : `Принять работу можно после оплаты — ${formatCurrency(unpaidMilestone.amount, contract.currency)}. Деньги будут удерживаться банком до вашей приёмки: после оплаты вернитесь сюда и примите работу.`,
          confirmLabel: viaAlif ? ALIF_CONFIRM_LABEL : "Оплатить",
        }
      : {
          title: "Принять работу?",
          description: direct
            ? `Подтвердите, что работа выполнена. ${supplierName} уже получил оплату. Отправить работу на доработку после приёмки будет нельзя.`
            : `${supplierName} получит ${supplierGets} из удерживаемых банком ${pendingAmount} (за вычетом комиссии площадки). Отправить работу на доработку после приёмки будет нельзя.`,
          confirmLabel: "Да, принять",
        },
  }

  return (
    <PageFrame>
      <PageHeader
        title={contract.title}
        description={supplierName}
        backHref="/customer/contracts"
        backLabel="Мои сделки"
        actions={
          <p className="text-lg font-bold text-primary tnum">
            {formatCurrency(contract.agreed_amount, contract.currency)}
          </p>
        }
      />

      <div className="grid gap-4 rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)]">
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
          <PaymentModeBadge mode={contract.payment_mode} />
          <span className="text-xs text-mute">
            с {formatIsoDate(contract.start_date)}
          </span>
          {canDispute && (
            <button
              type="button"
              onClick={() => setDisputeOpen(true)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-destructive transition-colors hover:text-destructive/80"
            >
              <AlertTriangle size={12} />
              {canAppeal ? "Обжаловать решение" : "Открыть спор"}
            </button>
          )}
          {showDisputeTab && (
            <span className="ml-auto text-xs font-semibold text-destructive">Спор открыт</span>
          )}
        </div>
      </div>

      <BuyerDealNextAction
        contract={contract}
        supplierName={supplierName}
        hasReview={hasReview}
        busy={paymentBusy || submissionBusy}
        viaAlif={viaAlif}
        alifCurrency={alifCurrency}
        onFund={(milestoneId) => setPendingAction({ kind: "fund", id: milestoneId })}
        onRelease={(milestoneId) => setPendingAction({ kind: "release", id: milestoneId })}
        onAcceptSubmission={(submissionId) => setPendingAction({ kind: "accept", id: submissionId })}
        onRequestChanges={handleRequestChanges}
        onOpenDispute={() => setDisputeOpen(true)}
        onOpenTab={setTab}
        onSubmitReview={handleSubmitReview}
        onUploadReviewPhoto={
          useApi ? (file) => reviewsApi.uploadMedia(file) : undefined
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
          <TabsTrigger value="submission" className="gap-1.5">
            <Package size={14} /> Сдача работы
            {submissionCount > 0 && (
              <span className="ml-1 text-[10px] bg-muted text-muted-foreground font-semibold px-1.5 py-0.5 rounded-full">
                {submissionCount}
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
          <TabsTrigger value="history" className="gap-1.5">
            <Clock size={14} /> История
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
              <BuyerContractMilestonesPanel
                contract={contract}
                viaAlif={viaAlif}
                alifCurrency={alifCurrency}
                onFund={(milestoneId) => setPendingAction({ kind: "fund", id: milestoneId })}
                onApprove={(milestoneId) => setPendingAction({ kind: "release", id: milestoneId })}
              />
            </div>
            <div className="space-y-5 lg:sticky lg:top-24">
              <ContractSupplierCard supplier={supplier} supplierTitle={supplierName} />
              <ContractEscrowCard contract={contract} />
              <Link
                href={`/customer/rfqs/${contract.rfq_id}`}
                className="block text-center text-sm font-semibold text-primary hover:underline"
              >
                Перейти к заявке
              </Link>
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
                viewerSide="buyer"
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
            counterpartName={supplierName}
            onSendMessage={handleSendMessage}
            onMarkRead={(id) => {
              if (useApi) markMessagesReadMutation.mutate(id)
              else markConversationReadLocal(id, userId)
            }}
          />
        </TabsContent>

        <TabsContent value="submission">
          <BuyerContractSubmissionsPanel
            contract={contract}
            onApprove={(submissionId) => setPendingAction({ kind: "accept", id: submissionId })}
            onReject={handleRequestChanges}
            busy={submissionBusy}
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

        <TabsContent value="history">
          <ContractPaymentHistoryPanel events={paymentHistory} />
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

      {pendingAction && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={confirmCopy[pendingAction.kind].title}
          description={confirmCopy[pendingAction.kind].description}
          confirmLabel={confirmCopy[pendingAction.kind].confirmLabel}
          onConfirm={handleConfirmPendingAction}
        />
      )}
    </PageFrame>
  )
}
