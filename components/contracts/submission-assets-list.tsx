"use client"

import { DownloadSimpleIcon as Download, ArrowSquareOutIcon as ExternalLink, FileTextIcon as FileText, ImageIcon, LinkIcon as Link2, VideoCameraIcon as Video } from "@phosphor-icons/react/dist/ssr"
import type { SubmissionAsset } from "@/types"

type SubmissionAssetsListProps = {
  assets: SubmissionAsset[]
}

const kindIcon = {
  image: ImageIcon,
  video: Video,
  file: FileText,
  link: Link2,
} as const

export const SubmissionAssetsList = ({ assets }: SubmissionAssetsListProps) => {
  if (assets.length === 0) return null

  return (
    <ul className="space-y-2 mt-3">
      {assets.map((asset) => {
        const Icon = kindIcon[asset.kind] ?? FileText
        const isExternal = asset.kind === "link" || asset.url.startsWith("http")
        const key = `${asset.kind}-${asset.name}-${asset.url}`

        return (
          <li key={key} className="rounded-xl border border-border p-3">
            {asset.kind === "image" && asset.url && asset.url !== "#" ? (
              <a
                href={asset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                aria-label={`Открыть изображение ${asset.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.name}
                  className="w-full max-h-48 object-contain rounded-lg bg-secondary"
                />
                <p className="text-xs text-muted-foreground mt-2 truncate">{asset.name}</p>
              </a>
            ) : asset.kind === "video" && asset.url && asset.url !== "#" ? (
              <div>
                <video
                  src={asset.url}
                  controls
                  className="w-full max-h-56 rounded-lg bg-black"
                  aria-label={asset.name}
                >
                  <track kind="captions" />
                </video>
                <p className="text-xs text-muted-foreground mt-2 truncate">{asset.name}</p>
              </div>
            ) : asset.url && asset.url !== "#" ? (
              <a
                href={asset.url}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                aria-label={
                  asset.kind === "link"
                    ? `Открыть ссылку ${asset.name}`
                    : `Скачать ${asset.name}`
                }
              >
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {asset.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {asset.kind === "link" ? asset.url : (asset.file_type || asset.kind)}
                  </p>
                </div>
                {asset.kind === "link" ? (
                  <ExternalLink size={16} className="text-muted-foreground flex-shrink-0" />
                ) : (
                  <Download size={16} className="text-muted-foreground flex-shrink-0" />
                )}
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {asset.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {asset.file_type || asset.kind}
                  </p>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export const normalizeSubmissionAssets = (input: {
  assets?: SubmissionAsset[] | null
  file_names?: string[]
}): SubmissionAsset[] => {
  if (input.assets && input.assets.length > 0) return input.assets
  return (input.file_names ?? []).map((name) => ({
    kind: "file" as const,
    name,
    url: "#",
    file_type: null,
  }))
}
