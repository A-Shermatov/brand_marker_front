"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cropImageToFile } from "@/lib/crop-image"

type ImageCropDialogProps = {
  open: boolean
  imageSrc: string | null
  fileName?: string
  /** Crop aspect ratio (width / height). Default 4/3 for company gallery. */
  aspect?: number
  /** A round frame for profile photos and logos shown in circles. */
  round?: boolean
  title?: string
  description?: string
  confirmLabel?: string
  busy?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => void | Promise<void>
}

export function ImageCropDialog({
  open,
  imageSrc,
  fileName = "photo.jpg",
  aspect = 4 / 3,
  round = false,
  title = "Обрезать фото",
  description = "Перетащите фото и настройте границы рамки. Масштаб — ползунком.",
  confirmLabel = "Добавить",
  busy = false,
  onOpenChange,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError(null)
    setSaving(false)
  }, [open, imageSrc])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setSaving(true)
    setError(null)
    try {
      const file = await cropImageToFile(imageSrc, croppedAreaPixels, fileName)
      // Parent owns open state (may open the next file in a queue).
      await onConfirm(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось обрезать фото")
    } finally {
      setSaving(false)
    }
  }

  const disabled = busy || saving || !croppedAreaPixels || !imageSrc

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] gap-4 rounded-2xl sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative h-[360px] overflow-hidden rounded-xl bg-[#1a1d24]">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={!round}
              cropShape={round ? "round" : "rect"}
              objectFit="contain"
            />
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between text-[13px] text-mute">
            <span>Масштаб</span>
            <span className="tnum">{zoom.toFixed(1)}×</span>
          </div>
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
            disabled={!imageSrc}
            aria-label="Масштаб фото"
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || busy}
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={disabled}
            aria-busy={saving || busy}
          >
            {saving || busy ? "Сохранение…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type CropBeforeUploadOptions = {
  aspect: number
  round?: boolean
  title: string
  description: string
  confirmLabel?: string
  /** Receives the cropped picture; the dialog closes when it resolves. */
  onCropped: (file: File) => void | Promise<void>
}

/**
 * Pick a picture, then choose the part of it to keep before it is uploaded.
 * `choose(file)` opens the frame; `dialog` must be rendered once on the page.
 */
export function useCropBeforeUpload({
  aspect,
  round,
  title,
  description,
  confirmLabel = "Сохранить",
  onCropped,
}: CropBeforeUploadOptions): { choose: (file: File) => void; dialog: ReactNode; busy: boolean } {
  const [source, setSource] = useState<{ src: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source.src)
    },
    [source],
  )

  const dialog = (
    <ImageCropDialog
      open={Boolean(source)}
      imageSrc={source?.src ?? null}
      fileName={source?.name}
      aspect={aspect}
      round={round}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      busy={busy}
      onOpenChange={(open) => {
        if (!open && !busy) setSource(null)
      }}
      onConfirm={async (file) => {
        setBusy(true)
        try {
          await onCropped(file)
          setSource(null)
        } finally {
          setBusy(false)
        }
      }}
    />
  )

  return {
    choose: (file: File) => setSource({ src: URL.createObjectURL(file), name: file.name }),
    dialog,
    busy,
  }
}
