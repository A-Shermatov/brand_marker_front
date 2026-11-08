"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import {
  CaretLeftIcon,
  CaretRightIcon,
  ImageIcon,
  MagnifyingGlassPlusIcon,
  PlayIcon as Play,
} from "@phosphor-icons/react/dist/ssr"
import type { ItemMedia } from "@/types"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { resolveFileUrl } from "@/lib/file-url"
import { cn } from "@/lib/utils"

type CatalogItemGalleryProps = {
  media: ItemMedia[]
  title: string
}

type GalleryItem = {
  key: number
  kind: "image" | "video"
  url: string
  fileName: string
}

/** How much the photo grows under the cursor. */
const ZOOM = 2.4

export const CatalogItemGallery = ({ media, title }: CatalogItemGalleryProps) => {
  const visualItems = useMemo<GalleryItem[]>(() => {
    const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order)
    return sorted
      .filter((entry) => entry.media_type !== "document")
      .map((entry) => {
        const url = resolveFileUrl(entry.file_url)
        if (!url) return null
        return {
          key: entry.id,
          kind: entry.media_type === "video" ? ("video" as const) : ("image" as const),
          url,
          fileName: entry.file_name,
        }
      })
      .filter((entry): entry is GalleryItem => entry != null)
  }, [media])

  const [activeIndex, setActiveIndex] = useState(0)
  const [mode, setMode] = useState<"photos" | "video">("photos")
  // Where the cursor is over the photo, in percent; null when it is elsewhere.
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)
  const [fullOpen, setFullOpen] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)

  const photos = visualItems.filter((item) => item.kind === "image")
  const videos = visualItems.filter((item) => item.kind === "video")
  const modeItems = mode === "video" ? videos : photos.length ? photos : visualItems
  const safeIndex = modeItems.length ? Math.min(activeIndex, modeItems.length - 1) : 0
  const active = modeItems[safeIndex]

  if (visualItems.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-card">
        <ImageIcon size={48} className="text-mute" aria-hidden="true" />
      </div>
    )
  }

  const step = (delta: number) =>
    setActiveIndex((current) => (current + delta + modeItems.length) % modeItems.length)

  const trackLens = (event: React.MouseEvent<HTMLDivElement>) => {
    const box = frameRef.current?.getBoundingClientRect()
    if (!box) return
    setLens({
      x: Math.min(100, Math.max(0, ((event.clientX - box.left) / box.width) * 100)),
      y: Math.min(100, Math.max(0, ((event.clientY - box.top) / box.height) * 100)),
    })
  }

  return (
    <div className="grid gap-3">
      {videos.length > 0 && (
        <div className="flex gap-2">
          {photos.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMode("photos")
                setActiveIndex(0)
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "photos" ? "bg-contrast text-white" : "bg-canvas text-mute hover:text-ink",
              )}
            >
              Фото
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setMode("video")
              setActiveIndex(0)
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              mode === "video" ? "bg-contrast text-white" : "bg-canvas text-mute hover:text-ink",
            )}
          >
            Видео
          </button>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 lg:flex-row">
        {modeItems.length > 1 && (
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:max-h-[560px] lg:flex-col lg:overflow-y-auto">
            {modeItems.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveIndex(index)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-card lg:h-[76px] lg:w-[76px]",
                  index === safeIndex ? "border-brand-600" : "border-line hover:border-line-strong",
                )}
                aria-label={`Фото ${index + 1}`}
                aria-pressed={index === safeIndex}
              >
                {item.kind === "image" ? (
                  <Image src={item.url} alt="" fill unoptimized className="object-cover" sizes="76px" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-contrast text-white">
                    <Play size={20} aria-hidden="true" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div
          ref={frameRef}
          className={cn(
            "group relative aspect-square max-h-[580px] min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-white",
            active?.kind === "image" && "cursor-zoom-in",
          )}
          onMouseMove={active?.kind === "image" ? trackLens : undefined}
          onMouseLeave={() => setLens(null)}
          onClick={() => active?.kind === "image" && setFullOpen(true)}
          data-testid="product-photo"
        >
          {active?.kind === "image" ? (
            <>
              <Image
                src={active.url}
                alt={title}
                fill
                unoptimized
                className="object-contain transition-transform duration-150 ease-out will-change-transform"
                style={
                  lens
                    ? { transform: `scale(${ZOOM})`, transformOrigin: `${lens.x}% ${lens.y}%` }
                    : undefined
                }
                sizes="(max-width: 1024px) 100vw, 640px"
                priority
              />
              <span
                className={cn(
                  "pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white transition-opacity",
                  lens ? "opacity-0" : "opacity-100",
                )}
              >
                <MagnifyingGlassPlusIcon className="size-4" aria-hidden />
                Наведите, чтобы приблизить
              </span>
            </>
          ) : active?.kind === "video" ? (
            <video src={active.url} controls className="h-full w-full bg-black object-contain" aria-label={title} />
          ) : null}

          {modeItems.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-ink opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <CaretLeftIcon className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-ink opacity-0 shadow transition-opacity group-hover:opacity-100"
              >
                <CaretRightIcon className="size-4" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <Dialog open={fullOpen} onOpenChange={setFullOpen}>
        <DialogContent className="max-w-[min(96vw,1100px)] border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,1100px)]">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {active?.kind === "image" ? (
            <div className="relative h-[86vh] w-full overflow-hidden rounded-2xl bg-white">
              <Image src={active.url} alt={title} fill unoptimized className="object-contain" sizes="96vw" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
