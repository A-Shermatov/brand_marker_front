"use client"

import { useRef, useState } from "react"
import { WarningIcon as AlertTriangle, FileTextIcon as FileText, PaperclipIcon as Paperclip } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { FilePreviewLink } from "@/components/shared/file-preview-link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatIsoDate } from "@/lib/format"
import type { ContractDispute, DisputeStatus } from "@/types"

const disputeStatusLabel: Record<DisputeStatus, string> = {
  open: "Открыт",
  under_review: "На рассмотрении — запрошены доказательства",
  resolved: "Закрыт",
  appealed: "Апелляция",
}

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.doc,.docx,.zip"

type ContractDisputePanelProps = {
  dispute: ContractDispute
  canUpload?: boolean
  uploading?: boolean
  onUpload?: (file: File) => void | Promise<void>
  viewerSide?: "buyer" | "supplier"
  canSubmitStatement?: boolean
  submittingStatement?: boolean
  onSubmitStatement?: (text: string) => void | Promise<void>
}

const MIN_STATEMENT_LENGTH = 10
const MAX_STATEMENT_LENGTH = 5000

export const ContractDisputePanel = ({
  dispute,
  canUpload = false,
  uploading = false,
  onUpload,
  viewerSide,
  canSubmitStatement = false,
  submittingStatement = false,
  onSubmitStatement,
}: ContractDisputePanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const showUpload = canUpload && Boolean(onUpload)
  const ownStatement =
    (viewerSide === "buyer" ? dispute.buyer_statement : dispute.supplier_statement) ?? ""
  const [statementDraft, setStatementDraft] = useState<string | null>(null)
  const statementText = statementDraft ?? ownStatement
  const showStatementForm = canSubmitStatement && Boolean(viewerSide) && Boolean(onSubmitStatement)
  const trimmedStatement = statementText.trim()
  const statementChanged = trimmedStatement !== ownStatement.trim()

  const handleSubmitStatement = async () => {
    if (!onSubmitStatement) return
    if (trimmedStatement.length < MIN_STATEMENT_LENGTH) {
      toast.error(`Заявление должно содержать не менее ${MIN_STATEMENT_LENGTH} символов`)
      return
    }
    await onSubmitStatement(trimmedStatement)
    setStatementDraft(null)
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !onUpload) return
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Файл «${file.name}» больше ${MAX_FILE_SIZE_MB} МБ`)
      return
    }
    await onUpload(file)
  }

  const statusLabel = disputeStatusLabel[dispute.status] || dispute.status
  const showInstructions =
    Boolean(dispute.admin_instructions?.trim()) ||
    dispute.status === "under_review"

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle size={18} className="text-destructive" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Спор #{dispute.id}</h2>
            <p className="text-sm text-destructive font-medium">{statusLabel}</p>
            <p className="text-xs text-muted-foreground">
              Открыт {formatIsoDate(dispute.created_at.split("T")[0] ?? dispute.created_at)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          Закрыть спор может только администратор. До решения статус сделки остаётся «Спор».
        </p>
      </div>

      {showInstructions && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Инструкции администратора
          </h3>
          {dispute.admin_instructions?.trim() ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {dispute.admin_instructions}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Администратор запросил дополнительные доказательства. Следуйте уведомлению и
              подготовьте материалы по спору.
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Заявления сторон</h3>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Покупатель</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {dispute.buyer_statement?.trim() || "Заявление не предоставлено"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Поставщик</p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {dispute.supplier_statement?.trim() || "Заявление не предоставлено"}
          </p>
        </div>
        {showStatementForm && (
          <div className="space-y-2 border-t border-border pt-4">
            <label
              htmlFor="dispute-statement"
              className="text-xs font-medium text-muted-foreground"
            >
              {ownStatement.trim() ? "Изменить своё заявление" : "Ваше заявление"}
            </label>
            <Textarea
              id="dispute-statement"
              value={statementText}
              maxLength={MAX_STATEMENT_LENGTH}
              rows={4}
              placeholder="Опишите вашу позицию по спору"
              onChange={(event) => setStatementDraft(event.target.value)}
            />
            <Button
              type="button"
              size="sm"
              disabled={
                submittingStatement ||
                !statementChanged ||
                trimmedStatement.length < MIN_STATEMENT_LENGTH
              }
              onClick={handleSubmitStatement}
            >
              {submittingStatement ? "Сохранение..." : "Сохранить заявление"}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Доказательства</h3>
        {dispute.evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <FileText size={14} aria-hidden="true" />
            Пока нет загруженных файлов
          </p>
        ) : (
          <ul className="space-y-2">
            {dispute.evidence.map((item) => (
              <li key={item.id}>
                <FilePreviewLink
                  url={item.file_url}
                  fileName={item.file_name}
                  fileType={item.file_type}
                />
                {item.note ? (
                  <p className="text-xs text-muted-foreground mt-1 px-1">{item.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {showUpload && (
          <div className="mt-4">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              onChange={handleFileChange}
              aria-label="Выбрать файл-доказательство"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip size={14} />
              {uploading ? "Загрузка..." : "Добавить файл"}
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
