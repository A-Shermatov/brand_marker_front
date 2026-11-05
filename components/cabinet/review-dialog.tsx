"use client"

import { useRef, useState } from "react"
import { ImageSquareIcon as ImagePlus, StarIcon as Star, XIcon as X } from "@phosphor-icons/react/dist/ssr"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { resolveFileUrl } from "@/lib/file-url"
import { cn } from "@/lib/utils"

export type ReviewAxisRatings = {
  rating: number
  service_rating: number
  delivery_rating: number
  quality_rating: number
  tags: string[]
  comment: string
  photos: Array<{ file_name: string; file_url: string }>
}

/** about_supplier: buyer rates performer; about_buyer: supplier rates customer */
export type ReviewDialogVariant = "about_supplier" | "about_buyer"

const VARIANT_CONFIG: Record<
  ReviewDialogVariant,
  {
    axes: Array<{ key: "service_rating" | "delivery_rating" | "quality_rating"; label: string }>
    tags: string[]
    defaultLabel: string
  }
> = {
  about_supplier: {
    axes: [
      { key: "service_rating", label: "Сервис" },
      { key: "delivery_rating", label: "Сроки" },
      { key: "quality_rating", label: "Качество" },
    ],
    tags: ["Надёжный", "Вежливый", "Быстро", "Качественно", "Рекомендую", "Дорого"],
    defaultLabel: "исполнителем",
  },
  about_buyer: {
    axes: [
      { key: "service_rating", label: "Коммуникация" },
      { key: "delivery_rating", label: "Оплата" },
      { key: "quality_rating", label: "ТЗ и ясность" },
    ],
    tags: [
      "Пунктуальный",
      "Понятное ТЗ",
      "Быстрая оплата",
      "Вежливый",
      "Рекомендую",
      "Сложный клиент",
    ],
    defaultLabel: "заказчиком",
  },
}

const MAX_PHOTOS = 5

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  counterpartName: string
  counterpartLabel?: string
  variant?: ReviewDialogVariant
  onUploadPhoto?: (file: File) => Promise<{ file_name: string; file_url: string }>
  onConfirm: (payload: ReviewAxisRatings) => void
}

const AxisStars = ({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${label}: ${n}`}
          className="p-0.5"
        >
          <Star
            size={20}
            className={cn(
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  </div>
)

export default function ReviewDialog({
  open,
  onOpenChange,
  counterpartName,
  counterpartLabel,
  variant = "about_supplier",
  onUploadPhoto,
  onConfirm,
}: ReviewDialogProps) {
  const config = VARIANT_CONFIG[variant]
  const [service, setService] = useState(5)
  const [delivery, setDelivery] = useState(5)
  const [quality, setQuality] = useState(5)
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState("")
  const [photos, setPhotos] = useState<Array<{ file_name: string; file_url: string }>>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const average = Math.round((service + delivery + quality) / 3)
  const label = counterpartLabel ?? config.defaultLabel

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const reset = () => {
    setText("")
    setService(5)
    setDelivery(5)
    setQuality(5)
    setTags([])
    setPhotos([])
  }

  const handleConfirm = () => {
    onConfirm({
      rating: average,
      service_rating: service,
      delivery_rating: delivery,
      quality_rating: quality,
      tags,
      comment: text.trim(),
      photos,
    })
    reset()
    onOpenChange(false)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !onUploadPhoto) return
    const remaining = MAX_PHOTOS - photos.length
    const batch = Array.from(files).slice(0, remaining)
    if (!batch.length) return
    setUploading(true)
    try {
      const uploaded: Array<{ file_name: string; file_url: string }> = []
      for (const file of batch) {
        if (!file.type.startsWith("image/")) continue
        uploaded.push(await onUploadPhoto(file))
      }
      if (uploaded.length) setPhotos((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Оставить отзыв</DialogTitle>
          <DialogDescription>
            Поделитесь опытом работы с {label} «{counterpartName}»
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {config.axes.map((axis) => (
            <AxisStars
              key={axis.key}
              label={axis.label}
              value={
                axis.key === "service_rating"
                  ? service
                  : axis.key === "delivery_rating"
                    ? delivery
                    : quality
              }
              onChange={
                axis.key === "service_rating"
                  ? setService
                  : axis.key === "delivery_rating"
                    ? setDelivery
                    : setQuality
              }
            />
          ))}
          <p className="text-center text-sm text-muted-foreground">
            Средняя оценка: <b className="text-foreground">{average}</b> из 5
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {config.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                tags.includes(tag)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Что понравилось, что можно улучшить"
          className="w-full px-4 py-3 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
        />

        {onUploadPhoto ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.file_url}
                  className="relative size-16 overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveFileUrl(photo.file_url)}
                    alt=""
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    aria-label="Удалить фото"
                    className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((p) => p.file_url !== photo.file_url))
                    }
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="flex size-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-[10px] font-semibold text-muted-foreground hover:bg-secondary"
                >
                  <ImagePlus size={16} />
                  Фото
                </button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void handleFiles(e.target.files)}
            />
          </div>
        ) : null}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors"
          >
            Отправить отзыв
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
