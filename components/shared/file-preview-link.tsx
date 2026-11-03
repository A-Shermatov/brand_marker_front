"use client"

import { DownloadSimpleIcon as Download, FileTextIcon as FileText } from "@phosphor-icons/react/dist/ssr"
import { isImageFile, resolveFileUrl } from "@/lib/file-url"

type FilePreviewLinkProps = {
  url: string
  fileName: string
  fileType?: string | null
  className?: string
}

export const FilePreviewLink = ({
  url,
  fileName,
  fileType,
  className = "",
}: FilePreviewLinkProps) => {
  const href = resolveFileUrl(url)
  if (!href) {
    return (
      <span className={`flex items-center gap-3 text-sm text-muted-foreground ${className}`}>
        <FileText size={16} />
        {fileName}
      </span>
    )
  }

  const showImage = isImageFile(href, fileType, fileName)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${showImage ? "Открыть" : "Скачать"} ${fileName}`}
      className={`flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/30 hover:bg-secondary/30 transition-colors ${className}`}
    >
      {showImage ? (
        <span className="w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0 border border-border">
          <img src={href} alt="" className="w-full h-full object-cover" />
        </span>
      ) : (
        <span className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <FileText size={16} className="text-primary" />
        </span>
      )}
      <span className="text-sm font-medium text-foreground flex-1 truncate">{fileName}</span>
      <Download size={16} className="text-muted-foreground shrink-0" />
    </a>
  )
}
