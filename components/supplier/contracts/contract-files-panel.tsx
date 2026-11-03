"use client"

import { useRef } from "react"
import { PaperclipIcon as Paperclip } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { FilePreviewLink } from "@/components/shared/file-preview-link"
import { Button } from "@/components/ui/button"
import type { ContractFile } from "@/types"
import { formatIsoDate } from "@/lib/format"

type ContractFilesPanelProps = {
  files: ContractFile[]
  canUpload?: boolean
  uploading?: boolean
  onUpload?: (files: File[]) => void | Promise<void>
}

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.doc,.docx,.zip"

const sideLabel: Record<"buyer" | "supplier", string> = {
  buyer: "Заказчик",
  supplier: "Исполнитель",
}

const fileMetaLine = (file: ContractFile): string => {
  const parts: string[] = []
  if (file.uploaded_by_name) parts.push(file.uploaded_by_name)
  if (file.uploaded_by_side) parts.push(sideLabel[file.uploaded_by_side])
  parts.push(formatIsoDate(file.created_at.split("T")[0] ?? file.created_at))
  return parts.join(" · ")
}

export const ContractFilesPanel = ({
  files,
  canUpload = false,
  uploading = false,
  onUpload,
}: ContractFilesPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const showUpload = canUpload && Boolean(onUpload)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (selected.length === 0 || !onUpload) return

    const oversized = selected.filter((file) => file.size > MAX_FILE_SIZE_BYTES)
    oversized.forEach((file) => {
      toast.error(`Файл «${file.name}» больше ${MAX_FILE_SIZE_MB} МБ`)
    })

    const accepted = selected.filter((file) => file.size <= MAX_FILE_SIZE_BYTES)
    if (accepted.length === 0) return
    await onUpload(accepted)
  }

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-semibold text-foreground">Файлы</h2>
        {showUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              onChange={handleFileChange}
              aria-label="Выбрать файлы для сделки"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip size={14} />
              {uploading ? "Загрузка..." : "Добавить файлы"}
            </Button>
          </>
        )}
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {showUpload
            ? "Файлы не прикреплены. Добавьте документы, чертежи или ТЗ."
            : "Файлы не прикреплены"}
        </p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.id}>
              <FilePreviewLink
                url={file.file_url}
                fileName={file.file_name}
                fileType={file.file_type}
              />
              <p className="text-xs text-muted-foreground mt-1 px-1">
                {fileMetaLine(file)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
