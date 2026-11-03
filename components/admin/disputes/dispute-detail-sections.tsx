"use client"

import { useRef, useState } from "react"
import { AdminLink } from "@/components/admin/admin-link"
import { formatCurrency } from "@/lib/format"
import { FileTextIcon as FileText, PaperclipIcon as Paperclip } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { AdminDisputeDetail, AdminParty } from "@/lib/api/admin"
import {
  adminActorKindLabels,
  adminDisputeResolutionLabels,
  adminDisputeStatusMeta,
  adminHistoryActionLabels,
  adminLabel,
} from "@/lib/admin-display"
import { contractStatusMeta, escrowSummaryMeta } from "@/lib/contract-display"
import { resolveFileUrl } from "@/lib/file-url"
import type { ContractStatus } from "@/types"

const formatMoney = (value: number | null | undefined, currency?: string | null) =>
  value == null ? "—" : formatCurrency(value, currency || "TJS")

const sectionClassName = "scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6"

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))


const EmptyState = ({ children }: { children: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
    {children}
  </div>
)

const partyLabel = (party: AdminParty | null | undefined) =>
  party?.company_title || party?.name || party?.display_name || "—"

const PartySection = ({
  id,
  title,
  party,
}: {
  id: string
  title: string
  party: AdminParty | null
}) => (
  <section id={id} className={sectionClassName}>
    <h2 className="mb-5 text-lg font-bold">{title}</h2>
    {party ? (
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[12.5px] font-medium text-muted-foreground">
            Имя
          </dt>
          <dd className="mt-1 text-sm font-medium">{partyLabel(party)}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] font-medium text-muted-foreground">
            Email
          </dt>
          <dd className="mt-1 text-sm font-medium">{party.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] font-medium text-muted-foreground">
            Профиль
          </dt>
          <dd className="mt-1 text-sm font-medium">
            #{party.actor_id} · {adminLabel(adminActorKindLabels, party.actor_kind)}
          </dd>
        </div>
        {party.company_id && (
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Компания
            </dt>
            <dd className="mt-1 text-sm font-medium">
              <AdminLink
                href={`/admin/companies/${party.company_id}`}
                className="text-primary hover:underline"
              >
                {party.company_title || `ID ${party.company_id}`}
              </AdminLink>
            </dd>
          </div>
        )}
      </dl>
    ) : (
      <EmptyState>{`${title} не найден.`}</EmptyState>
    )}
  </section>
)

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.doc,.docx,.zip"

export const AdminDisputeDetailSections = ({
  dispute,
  onUploadEvidence,
  uploadingEvidence = false,
  canSendChat = false,
  sendingChat = false,
  onSendChat,
}: {
  dispute: AdminDisputeDetail
  onUploadEvidence?: (file: File) => void | Promise<void>
  uploadingEvidence?: boolean
  canSendChat?: boolean
  sendingChat?: boolean
  onSendChat?: (text: string) => void | Promise<void>
}) => {
  const evidenceInputRef = useRef<HTMLInputElement>(null)
  const [chatText, setChatText] = useState("")
  const canUploadEvidence = Boolean(onUploadEvidence) && dispute.status !== "resolved"

  const handleSendChat = async () => {
    const text = chatText.trim()
    if (!text || !onSendChat) return
    try {
      await onSendChat(text)
      setChatText("")
    } catch {
      // error toast comes from the mutation meta; keep the draft
    }
  }

  const handleEvidenceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !onUploadEvidence) return
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Файл «${file.name}» больше ${MAX_FILE_SIZE_MB} МБ`)
      return
    }
    await onUploadEvidence(file)
  }

  const statusMeta = adminDisputeStatusMeta[dispute.status] || {
    label: dispute.status,
    className: "bg-muted text-muted-foreground",
  }
  const contractStatus =
    contractStatusMeta[dispute.contract.status as ContractStatus] || {
      label: dispute.contract.status,
      className: "bg-muted text-muted-foreground",
    }

  return (
    <div className="space-y-5">
      <section id="overview" className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">Обзор</h2>
          <Badge variant="outline" className={statusMeta.className}>
            {statusMeta.label}
          </Badge>
          <Badge variant="outline" className={contractStatus.className}>
            Контракт: {contractStatus.label}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {dispute.contract.description || "Описание контракта не заполнено."}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Контракт
            </dt>
            <dd className="mt-1 text-sm font-medium">
              <AdminLink
                href={`/admin/contracts/${dispute.contract.id}`}
                className="text-primary hover:underline"
              >
                {dispute.contract.title}
              </AdminLink>
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Сумма
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatMoney(dispute.contract.agreed_amount, dispute.contract.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] font-medium text-muted-foreground">
              Решение
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {adminLabel(adminDisputeResolutionLabels, dispute.resolution)}
            </dd>
          </div>
          {dispute.partial_buyer_amount != null && (
            <div>
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                Частичный возврат
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatMoney(dispute.partial_buyer_amount, dispute.contract.currency)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section id="buyer-statement" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Заявление покупателя</h2>
        {dispute.buyer_statement ? (
          <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {dispute.buyer_statement}
          </p>
        ) : (
          <EmptyState>Заявление покупателя отсутствует.</EmptyState>
        )}
      </section>

      <section id="supplier-statement" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Заявление исполнителя</h2>
        {dispute.supplier_statement ? (
          <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {dispute.supplier_statement}
          </p>
        ) : (
          <EmptyState>Заявление исполнителя отсутствует.</EmptyState>
        )}
      </section>

      <section id="admin-instructions" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Инструкции сторонам</h2>
        {dispute.admin_instructions ? (
          <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {dispute.admin_instructions}
          </p>
        ) : (
          <EmptyState>Инструкции ещё не отправлены.</EmptyState>
        )}
      </section>

      <PartySection id="buyer" title="Покупатель" party={dispute.buyer} />
      <PartySection id="supplier" title="Исполнитель" party={dispute.supplier} />

      <section id="evidence" className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Доказательства</h2>
          {canUploadEvidence && (
            <>
              <input
                ref={evidenceInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={handleEvidenceChange}
                aria-label="Выбрать файл-доказательство"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingEvidence}
                onClick={() => evidenceInputRef.current?.click()}
              >
                <Paperclip size={14} aria-hidden="true" />
                {uploadingEvidence ? "Загрузка..." : "Добавить файл"}
              </Button>
            </>
          )}
        </div>
        {dispute.evidence.length ? (
          <div className="space-y-2">
            {dispute.evidence.map((item) => (
              <a
                key={item.id}
                href={resolveFileUrl(item.file_url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <FileText size={15} aria-hidden="true" />
                {item.file_name}
                {item.note ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    · {item.note}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
        ) : (
          <EmptyState>Доказательств пока нет.</EmptyState>
        )}
      </section>

      <section id="files" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Файлы</h2>
        {dispute.files.length ? (
          <div className="space-y-2">
            {dispute.files.map((file) => (
              <a
                key={file.id}
                href={resolveFileUrl(file.file_url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <FileText size={15} aria-hidden="true" />
                {file.file_name}
                <span className="text-xs font-normal text-muted-foreground">
                  · {formatDate(file.created_at)}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState>Файлов контракта нет.</EmptyState>
        )}
      </section>

      <section id="chat" className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Чат</h2>
          {dispute.chat_id ? (
            <AdminLink
              href={`/admin/chats?chat=${encodeURIComponent(dispute.chat_id)}&filter=disp`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Открыть в переписках
            </AdminLink>
          ) : null}
        </div>
        {dispute.messages.length ? (
          <div className="space-y-3">
            {dispute.messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">Пользователь #{message.sender_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(message.created_at)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {message.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Сообщений нет.</EmptyState>
        )}
        {dispute.chat_id && canSendChat && onSendChat ? (
          <div className="mt-4 space-y-2">
            <label htmlFor="dispute-chat-message" className="text-sm font-semibold">
              Сообщение в чат спора
            </label>
            <Textarea
              id="dispute-chat-message"
              value={chatText}
              onChange={(event) => setChatText(event.target.value)}
              placeholder="Написать сообщение сторонам"
              className="min-h-24"
              disabled={sendingChat}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                disabled={sendingChat || !chatText.trim()}
                onClick={handleSendChat}
              >
                {sendingChat ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section id="escrow" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-semibold">Деньги на гарантии</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["held", dispute.escrow.held],
              ["released", dispute.escrow.released],
              ["disputed", dispute.escrow.disputed],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-border p-4">
              <dt className="text-[12.5px] font-medium text-muted-foreground">
                {escrowSummaryMeta[key].label}
              </dt>
              <dd className="mt-2 text-lg font-bold">
                {formatMoney(value, dispute.escrow.currency)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="timeline" className={sectionClassName}>
        <h2 className="mb-5 text-lg font-bold">Хронология</h2>
        {dispute.timeline.length ? (
          <div className="space-y-3">
            {dispute.timeline.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">
                    {adminLabel(adminHistoryActionLabels, entry.action)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.actor?.name || entry.actor?.email || "Система"}
                </p>
                {typeof entry.details?.reason === "string" && entry.details.reason && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Причина: {entry.details.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState>Хронология пуста.</EmptyState>
        )}
      </section>
    </div>
  )
}
