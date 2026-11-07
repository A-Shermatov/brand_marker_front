"use client"

import { useState, type ChangeEvent, type DragEvent } from "react"
import { CaretLeftIcon as ChevronLeft, CaretRightIcon as ChevronRight, FileTextIcon as FileText, CircleNotchIcon as Loader2, PlusIcon as Plus, StarIcon as Star, TrashIcon as Trash2, UploadSimpleIcon as Upload, VideoCameraIcon as Video } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { isApiEnabled } from "@/lib/api/config"
import { supplierCatalogApi } from "@/lib/api/supplier/catalog"
import { resolveFileUrl } from "@/lib/file-url"
import type { ItemMediaType } from "@/types"

export type MediaFieldRow = {
  file_name: string
  file_url: string
  media_type: ItemMediaType
}

const MAX_PHOTOS = 9

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"))
    reader.readAsDataURL(file)
  })

const mediaTypeFromFile = (file: File): ItemMediaType => {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  return "document"
}

const uploadFiles = async (files: File[]): Promise<MediaFieldRow[]> => {
  const uploaded: MediaFieldRow[] = []
  for (const file of files) {
    if (isApiEnabled()) {
      const result = await supplierCatalogApi.uploadMedia(file)
      uploaded.push({
        file_name: result.file_name || file.name,
        file_url: result.file_url,
        media_type: result.media_type || mediaTypeFromFile(file),
      })
    } else {
      uploaded.push({
        file_name: file.name,
        file_url: await readAsDataUrl(file),
        media_type: mediaTypeFromFile(file),
      })
    }
  }
  return uploaded
}

const splitMedia = (media: MediaFieldRow[]) => ({
  images: media.filter((m) => m.media_type === "image"),
  videos: media.filter((m) => m.media_type === "video"),
  documents: media.filter((m) => m.media_type === "document"),
})

const rebuildMedia = (
  images: MediaFieldRow[],
  videos: MediaFieldRow[],
  documents: MediaFieldRow[],
): MediaFieldRow[] => [...images, ...videos, ...documents]

type PhotoGalleryFieldsProps = {
  media: MediaFieldRow[]
  onChange: (media: MediaFieldRow[]) => void
  error?: string
}

export const PhotoGalleryFields = ({
  media,
  onChange,
  error,
}: PhotoGalleryFieldsProps) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const { images, videos, documents } = splitMedia(media)

  const commitImages = (nextImages: MediaFieldRow[]) => {
    onChange(rebuildMedia(nextImages, videos, documents))
  }

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"))
    if (files.length === 0) return
    const room = MAX_PHOTOS - images.length
    if (room <= 0) return
    const toUpload = files.slice(0, room)

    setUploadError(null)
    setUploading(true)
    try {
      const uploaded = await uploadFiles(toUpload)
      commitImages([...images, ...uploaded.map((u) => ({ ...u, media_type: "image" as const }))])
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Не удалось загрузить фото"
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  const onInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    // Copy first: FileList is live and resetting the input below empties it,
    // which silently dropped every chosen photo.
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    await handleFiles(files)
  }

  const onDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragging(false)
    await handleFiles(event.dataTransfer.files)
  }

  const setMain = (index: number) => {
    if (index === 0) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    if (!item) return
    next.unshift(item)
    commitImages(next)
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const tmp = next[index]!
    next[index] = next[target]!
    next[target] = tmp
    commitImages(next)
  }

  const remove = (index: number) => {
    commitImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((photo, index) => {
          const src = resolveFileUrl(photo.file_url)
          return (
            <div
              key={`${photo.file_url}-${index}`}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-xl border-2 bg-canvas",
                index === 0 ? "border-brand-600" : "border-line",
              )}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-mute text-xs">
                  Нет превью
                </span>
              )}
              {index === 0 ? (
                <span className="absolute left-1.5 top-1.5 grid h-6 place-items-center rounded-md bg-brand-600 px-2 text-[11.5px] font-bold text-white">
                  Главное
                </span>
              ) : null}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => setMain(index)}
                    className="grid h-7 place-items-center rounded-md bg-card/95 px-2 text-[11.5px] font-semibold shadow"
                    title="Сделать главным"
                  >
                    <Star className="size-3.5" aria-hidden />
                  </button>
                ) : (
                  <span />
                )}
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className={cn(
                      "grid size-7 place-items-center rounded-md bg-card/95 shadow",
                      index === 0 && "invisible",
                    )}
                    aria-label="Левее"
                  >
                    <ChevronLeft className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    className={cn(
                      "grid size-7 place-items-center rounded-md bg-card/95 shadow",
                      index === images.length - 1 && "invisible",
                    )}
                    aria-label="Правее"
                  >
                    <ChevronRight className="size-3.5" aria-hidden />
                  </button>
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-md bg-card/95 text-red-600 shadow"
                aria-label="Удалить фото"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          )
        })}
        {images.length < MAX_PHOTOS ? (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "aspect-square cursor-pointer grid place-items-center rounded-xl border-2 border-dashed p-2 text-center transition",
              error || uploadError
                ? "border-red-400 bg-red-50/40"
                : dragging
                  ? "border-brand-600 bg-brand-50/40"
                  : "border-line-strong hover:border-brand-600 hover:bg-brand-50/40",
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={onInputChange}
              disabled={uploading}
            />
            <span className="grid justify-items-center gap-1.5">
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-brand-700" />
              ) : (
                <Plus className="size-6 text-brand-700" aria-hidden />
              )}
              <span className="text-[13px] font-semibold">
                {images.length ? "Ещё фото" : "Добавить фото"}
              </span>
              <span className="text-[11.5px] text-mute">
                {images.length}/{MAX_PHOTOS}
              </span>
            </span>
          </label>
        ) : null}
      </div>
      {(error || uploadError) && (
        <p className="text-[13px] text-red-600" role="alert">
          {error || uploadError}
        </p>
      )}
      <div className="flex gap-2.5 rounded-xl bg-canvas p-3.5 text-[13.5px] text-ink/80">
        <span>
          Хороший набор: <b>главное фото на белом фоне</b>, вид спереди, сбоку и
          сзади, крупный план деталей. Квадратные фото от 800×800 px, JPG или PNG.
        </span>
      </div>
    </div>
  )
}

type VideoMediaFieldsProps = {
  media: MediaFieldRow[]
  onChange: (media: MediaFieldRow[]) => void
}

const isVideoLink = (row: MediaFieldRow): boolean =>
  /^https?:\/\//i.test(row.file_url) && row.file_name === row.file_url

export const VideoMediaFields = ({ media, onChange }: VideoMediaFieldsProps) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { images, videos, documents } = splitMedia(media)
  const video = videos[0] ?? null
  const linkOnly = Boolean(video && isVideoLink(video))
  const uploadedFile = Boolean(video && !isVideoLink(video))

  const setVideos = (next: MediaFieldRow[]) => {
    onChange(rebuildMedia(images, next.slice(0, 1), documents))
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const [uploaded] = await uploadFiles([file])
      if (!uploaded) return
      setVideos([{ ...uploaded, media_type: "video" }])
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Не удалось загрузить видео"
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  const handleUrlChange = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) {
      setVideos([])
      return
    }
    setVideos([
      {
        file_name: trimmed,
        file_url: trimmed,
        media_type: "video",
      },
    ])
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
      <div className="grid gap-2">
        <span className="text-[14px] font-semibold">Видео товара</span>
        {uploadedFile && video ? (
          <div className="flex items-center gap-3 rounded-xl border border-line p-3">
            <span className="grid size-10 place-items-center rounded-lg bg-contrast text-white">
              <Video className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[14px]">{video.file_name}</b>
              <span className="text-[12.5px] text-mute">Загруженный файл</span>
            </span>
            <button
              type="button"
              onClick={() => setVideos([])}
              className="grid size-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"
              aria-label="Удалить видео"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-3.5 hover:border-brand-600">
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
            <span className="grid size-10 place-items-center rounded-lg bg-canvas">
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Video className="size-4" aria-hidden />
              )}
            </span>
            <span>
              <b className="block text-[14px]">
                {uploading ? "Загрузка..." : "Загрузить видео"}
              </b>
              <span className="text-[12.5px] text-mute">MP4, WebM до 100 МБ</span>
            </span>
          </label>
        )}
        {uploadError ? (
          <p className="text-[13px] text-red-600" role="alert">
            {uploadError}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="pd-vurl" className="mb-1.5 block text-[14px] font-semibold">
          или ссылка на видео
        </label>
        <input
          id="pd-vurl"
          type="url"
          value={linkOnly && video ? video.file_url : ""}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://youtu.be/..."
          disabled={uploadedFile}
          className="h-11 w-full rounded-lg border border-line bg-card px-4 text-[14.5px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15 disabled:bg-canvas disabled:text-mute"
        />
        <p className="mt-1.5 text-[12.5px] text-mute">YouTube или другой сервис</p>
      </div>
    </div>
  )
}

type DocumentMediaFieldsProps = {
  media: MediaFieldRow[]
  onChange: (media: MediaFieldRow[]) => void
}

export const DocumentMediaFields = ({
  media,
  onChange,
}: DocumentMediaFieldsProps) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const { images, videos, documents } = splitMedia(media)

  const setDocuments = (next: MediaFieldRow[]) => {
    onChange(rebuildMedia(images, videos, next))
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      const uploaded = await uploadFiles(files)
      setDocuments([
        ...documents,
        ...uploaded.map((u) => ({ ...u, media_type: "document" as const })),
      ])
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Не удалось загрузить документ"
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid gap-3">
      {documents.map((doc, index) => (
        <div
          key={`${doc.file_url}-${index}`}
          className="flex items-center gap-3 rounded-xl border border-line px-4 py-3"
        >
          <FileText className="size-5 shrink-0 text-mute" aria-hidden />
          <span className="flex-1 truncate text-[14.5px]">{doc.file_name}</span>
          <button
            type="button"
            onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
            className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"
            aria-label="Удалить"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-4 hover:border-brand-600">
        <input
          type="file"
          multiple
          accept=".pdf,image/*,.doc,.docx"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading}
        />
        <span className="grid size-10 place-items-center rounded-lg bg-canvas">
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" aria-hidden />
          )}
        </span>
        <span>
          <b className="block text-[14px]">
            {uploading ? "Загрузка..." : "Загрузить документы"}
          </b>
          <span className="text-[12.5px] text-mute">
            PDF, JPG или PNG. Покупатели увидят их на странице товара.
          </span>
        </span>
      </label>
      {uploadError ? (
        <p className="text-[13px] text-red-600" role="alert">
          {uploadError}
        </p>
      ) : null}
      <div className="flex gap-2.5 rounded-xl bg-canvas p-3.5 text-[13.5px] text-ink/80">
        <span>
          Загружайте только настоящие документы. Площадка может попросить оригинал
          при проверке.
        </span>
      </div>
    </div>
  )
}
