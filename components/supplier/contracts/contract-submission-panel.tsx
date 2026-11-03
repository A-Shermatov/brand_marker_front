"use client"

import { statusPillClass } from "@/components/ui/status-badge"
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react"
import { FileTextIcon as FileText, ImageIcon, LinkIcon as Link2, PackageIcon as Package, PlusIcon as Plus, UploadSimpleIcon as Upload, VideoCameraIcon as Video, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import type { ContractWithRelations, SubmissionAsset, SubmissionAssetKind } from "@/types"
import {
  getSubmissionTypeLabel,
  workSubmissionStatusMeta,
} from "@/lib/contract-display"
import { formatIsoDate } from "@/lib/format"
import { isApiEnabled } from "@/lib/api/config"
import { resolveFileUrl } from "@/lib/file-url"
import { supplierContractsApi } from "@/lib/api/supplier/contracts"
import {
  normalizeSubmissionAssets,
  SubmissionAssetsList,
} from "@/components/contracts/submission-assets-list"

type SubmitWorkPayload = {
  note: string
  fileNames: string[]
  assets: SubmissionAsset[]
}

type ContractSubmissionPanelProps = {
  contract: ContractWithRelations
  onSubmit: (input: SubmitWorkPayload) => void
  disabled?: boolean
}

const KIND_OPTIONS: {
  value: SubmissionAssetKind
  label: string
  icon: typeof ImageIcon
  accept?: string
}[] = [
  {
    value: "image",
    label: "Изображение",
    icon: ImageIcon,
    accept: "image/jpeg,image/png,image/webp,image/gif",
  },
  {
    value: "video",
    label: "Видео",
    icon: Video,
    accept: "video/mp4,video/webm",
  },
  {
    value: "file",
    label: "Файл",
    icon: FileText,
    accept:
      "application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip",
  },
  {
    value: "link",
    label: "Ссылка",
    icon: Link2,
  },
]

const isValidUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const ContractSubmissionPanel = ({
  contract,
  onSubmit,
  disabled = false,
}: ContractSubmissionPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState("")
  const [kind, setKind] = useState<SubmissionAssetKind>("image")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkName, setLinkName] = useState("")
  const [assets, setAssets] = useState<SubmissionAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submissions = [...contract.submissions].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  )

  const canSubmit =
    !disabled &&
    !["completed", "cancelled", "disputed"].includes(contract.status)

  const selectedKind = KIND_OPTIONS.find((option) => option.value === kind)!
  const pendingLinkUrl = linkUrl.trim()
  const hasPendingLink = kind === "link" && isValidUrl(pendingLinkUrl)
  const hasAttachments = assets.length > 0 || hasPendingLink

  const handlePickFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      if (isApiEnabled()) {
        const updated = await supplierContractsApi.uploadFile(contract.id, file)
        const uploaded =
          updated.files
            .filter((f) => f.file_name === file.name)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )[0] ??
          [...updated.files].sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0]

        if (!uploaded) {
          setError("Не удалось получить URL загруженного файла")
          return
        }

        setAssets((prev) => [
          ...prev,
          {
            kind,
            name: uploaded.file_name,
            url: uploaded.file_url,
            file_type: uploaded.file_type,
          },
        ])
      } else {
        const objectUrl = URL.createObjectURL(file)
        setAssets((prev) => [
          ...prev,
          {
            kind,
            name: file.name,
            url: objectUrl,
            file_type: file.type || null,
          },
        ])
      }
    } catch {
      setError("Ошибка загрузки файла")
    } finally {
      setUploading(false)
    }
  }

  const handleAddLink = () => {
    const trimmedUrl = linkUrl.trim()
    if (!isValidUrl(trimmedUrl)) {
      setError("Укажите корректную ссылку (http/https)")
      return
    }
    const name = linkName.trim() || trimmedUrl
    if (assets.some((a) => a.url === trimmedUrl)) return
    setError(null)
    setAssets((prev) => [
      ...prev,
      {
        kind: "link",
        name,
        url: trimmedUrl,
        file_type: null,
      },
    ])
    setLinkUrl("")
    setLinkName("")
  }

  const handleLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return
    event.preventDefault()
    handleAddLink()
  }

  const handleRemoveAsset = (index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const trimmedNote = note.trim()
    if (!trimmedNote) return

    let nextAssets = assets
    if (kind === "link") {
      const trimmedUrl = linkUrl.trim()
      if (isValidUrl(trimmedUrl) && !assets.some((a) => a.url === trimmedUrl)) {
        const name = linkName.trim() || trimmedUrl
        nextAssets = [
          ...assets,
          {
            kind: "link",
            name,
            url: trimmedUrl,
            file_type: null,
          },
        ]
      }
    }

    if (nextAssets.length === 0) {
      setError("Добавьте хотя бы одно вложение: изображение, файл, видео или ссылку")
      return
    }

    onSubmit({
      note: trimmedNote,
      fileNames: nextAssets.map((a) => a.name),
      assets: nextAssets,
    })
    setNote("")
    setAssets([])
    setLinkUrl("")
    setLinkName("")
    setError(null)
  }

  const submissionLabel =
    submissions[0]?.type
      ? getSubmissionTypeLabel(submissions[0].type)
      : contract.status === "delivered"
        ? "Доставка"
        : "Выполнение работ"

  return (
    <section className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Package size={16} className="text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">Сдача работы · {submissionLabel}</h2>
      </div>

      {canSubmit && (
        <div className="rounded-xl border border-border p-4 mb-5 space-y-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Опишите выполненную работу..."
            aria-label="Комментарий к отправке"
            className="w-full px-4 py-3 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />

          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS.map((option) => {
              const Icon = option.icon
              const active = kind === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setKind(option.value)}
                  className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                  aria-pressed={active}
                  aria-label={`Тип вложения: ${option.label}`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              )
            })}
          </div>

          {kind === "link" ? (
            <div className="space-y-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={handleLinkKeyDown}
                placeholder="https://..."
                aria-label="Ссылка на результат работы"
                className="w-full h-10 px-4 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  onKeyDown={handleLinkKeyDown}
                  placeholder="Название ссылки (необязательно)"
                  aria-label="Название ссылки"
                  className="flex-1 h-10 px-4 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="h-10 px-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                  aria-label="Добавить ссылку"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={selectedKind.accept}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handlePickFile}
                disabled={uploading}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-border hover:bg-secondary transition-colors text-sm font-semibold disabled:opacity-50"
                aria-label={`Загрузить ${selectedKind.label.toLowerCase()}`}
              >
                <Upload size={16} />
                {uploading ? "Загрузка..." : `Загрузить ${selectedKind.label.toLowerCase()}`}
              </button>
            </div>
          )}

          {assets.length > 0 && (
            <ul className="space-y-2">
              {assets.map((asset, index) => (
                <li
                  key={`${asset.url}-${index}`}
                  className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2"
                >
                  <a
                    href={resolveFileUrl(asset.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-foreground truncate flex-1 hover:text-primary"
                  >
                    [{asset.kind}] {asset.name}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset(index)}
                    aria-label={`Удалить ${asset.name}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!note.trim() || !hasAttachments || uploading}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Отправить на проверку
          </button>
        </div>
      )}

      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Отправок пока нет</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const meta = workSubmissionStatusMeta[submission.status]
            const submissionAssets = normalizeSubmissionAssets(submission)
            return (
              <div key={submission.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {getSubmissionTypeLabel(submission.type)} ·{" "}
                      {formatIsoDate(
                        submission.submitted_at.split("T")[0] ?? submission.submitted_at,
                      )}
                    </p>
                    <p className="text-sm text-foreground mt-1">{submission.note}</p>
                  </div>
                  <span
                    className={`${statusPillClass} shrink-0 ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <SubmissionAssetsList assets={submissionAssets} />
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
