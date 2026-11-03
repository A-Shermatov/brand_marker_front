"use client"

import { useRef, useState } from "react"
import { FileTextIcon as FileText, CircleNotchIcon as Loader2, ShieldCheckIcon as ShieldCheck, TrashIcon as Trash2, UploadSimpleIcon as Upload } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { IndividualStatusBadge } from "@/components/verification/individual-status-badge"
import {
  useDeleteMyVerificationDocumentMutation,
  useMyVerificationQuery,
  useSubmitMyVerificationMutation,
  useUploadMyVerificationDocumentMutation,
} from "@/hooks/api/use-client-verification-query"
import {
  INDIVIDUAL_DOCUMENT_TYPE_LABELS,
  type IndividualDocumentType,
} from "@/lib/api/client-verification"
import { resolveFileUrl } from "@/lib/file-url"

export const IDENTITY_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp"

const DOCUMENT_TYPES = Object.keys(INDIVIDUAL_DOCUMENT_TYPE_LABELS) as IndividualDocumentType[]

const STATUS_HINTS: Record<string, string> = {
  none: "Загрузите паспорт и селфи с документом, затем отправьте заявку. После проверки в профиле появится отметка «Проверен».",
  pending: "Заявка на проверке. Обычно это занимает до 1 рабочего дня.",
  needs_documents: "Администратор запросил дополнительные документы.",
  verified: "Личность подтверждена. Клиенты видят отметку «Проверен».",
  rejected: "Проверка отклонена. Исправьте документы и отправьте заявку повторно.",
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  )

type IdentityVerificationCardProps = {
  enabled?: boolean
}

export function IdentityVerificationCard({ enabled = true }: IdentityVerificationCardProps) {
  const query = useMyVerificationQuery(enabled)
  const uploadMutation = useUploadMyVerificationDocumentMutation()
  const deleteMutation = useDeleteMyVerificationDocumentMutation()
  const submitMutation = useSubmitMyVerificationMutation()
  const [docType, setDocType] = useState<IndividualDocumentType>("passport")
  const fileRef = useRef<HTMLInputElement>(null)

  if (!enabled || query.isError) return null
  if (query.isLoading || !query.data) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-label="Загрузка" />
  }

  const state = query.data
  if (!state.is_individual) return null

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      await uploadMutation.mutateAsync({ file, docType })
      toast.success("Документ загружен")
    } catch {
      // error toast via MutationCache
    }
  }

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync(undefined)
      toast.success("Заявка отправлена на проверку")
    } catch {
      // error toast via MutationCache
    }
  }

  const showReason =
    Boolean(state.reason) && (state.status === "rejected" || state.status === "needs_documents")

  return (
    <PageSurface className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
            Подтверждение личности
          </h2>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            {STATUS_HINTS[state.status]}
          </p>
        </div>
        <IndividualStatusBadge status={state.status} />
      </div>

      {showReason && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <b className="font-semibold">Комментарий проверяющего:</b> {state.reason}
        </p>
      )}

      {state.documents.length > 0 ? (
        <ul className="grid gap-2">
          {state.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              <FileText size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{doc.doc_type_label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {doc.file_name || "Файл"} · {formatDate(doc.uploaded_at)}
                </span>
              </span>
              {doc.file_url ? (
                <a
                  href={resolveFileUrl(doc.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary"
                >
                  Открыть
                </a>
              ) : null}
              {state.can_edit_documents && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(doc.id)}
                  aria-label={`Удалить ${doc.doc_type_label}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Документы ещё не загружены
        </p>
      )}

      {(state.can_upload || state.can_submit) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {state.can_upload && (
            <>
              <label htmlFor="identity-doc-type" className="sr-only">
                Тип документа
              </label>
              <select
                id="identity-doc-type"
                value={docType}
                onChange={(event) => setDocType(event.target.value as IndividualDocumentType)}
                className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {INDIVIDUAL_DOCUMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept={IDENTITY_ACCEPT}
                className="hidden"
                onChange={(event) => void handleFile(event)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                Загрузить документ
              </Button>
            </>
          )}
          {state.can_submit && (
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              disabled={submitMutation.isPending}
              onClick={() => void handleSubmit()}
            >
              {submitMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Отправить на проверку
            </Button>
          )}
        </div>
      )}
      {state.can_upload && (
        <p className="text-[11px] text-muted-foreground">PDF, JPG, PNG или WEBP.</p>
      )}
    </PageSurface>
  )
}
