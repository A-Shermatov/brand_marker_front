"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ImageIcon, PlayIcon as Play } from "@phosphor-icons/react/dist/ssr"
import type { ItemMedia } from "@/types"
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

  const photos = visualItems.filter((item) => item.kind === "image")
  const videos = visualItems.filter((item) => item.kind === "video")
  const modeItems = mode === "video" ? videos : photos.length ? photos : visualItems
  const safeIndex = modeItems.length ? Math.min(activeIndex, modeItems.length - 1) : 0
  const active = modeItems[safeIndex]

  if (visualItems.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-line bg-white">
        <ImageIcon size={40} className="text-mute" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {(photos.length > 0 || videos.length > 0) && videos.length > 0 && (
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
                mode === "photos"
                  ? "bg-ink text-white"
                  : "bg-canvas text-mute hover:text-ink",
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
              mode === "video"
                ? "bg-ink text-white"
                : "bg-canvas text-mute hover:text-ink",
            )}
          >
            Видео
          </button>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 lg:flex-row">
        {modeItems.length > 1 && (
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:max-h-[480px] lg:flex-col lg:overflow-y-auto">
            {modeItems.map((item, index) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white lg:h-[72px] lg:w-[72px]",
                  index === safeIndex
                    ? "border-ink"
                    : "border-line hover:border-line-strong",
                )}
                aria-label={`Миниатюра ${index + 1}`}
                aria-pressed={index === safeIndex}
              >
                {item.kind === "image" ? (
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="72px"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-ink text-white">
                    <Play size={20} aria-hidden="true" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-white">
          {active?.kind === "image" ? (
            <Image
              src={active.url}
              alt={title}
              fill
              unoptimized
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 560px"
              priority
            />
          ) : active?.kind === "video" ? (
            <video
              src={active.url}
              controls
              className="h-full w-full object-contain"
              aria-label={title}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon size={40} className="text-mute" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
