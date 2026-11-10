import { FILES_BASE_URL } from "@/lib/api/config"

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

export const resolveFileUrl = (url: string | null | undefined): string => {
  if (!url) return ""
  const value = url.trim()
  if (!value || value === "#") return ""
  if (value.startsWith("blob:") || value.startsWith("data:")) return value
  if (/^https?:\/\//i.test(value)) return value
  if (value === FILES_BASE_URL || value.startsWith(`${FILES_BASE_URL}/`)) {
    return value
  }
  // API may already return a site-relative path when FILES_BASE_URL is relative
  if (value.startsWith("/") && FILES_BASE_URL.startsWith("/")) {
    return value
  }

  const path = value.replace(/^\/+/, "")
  return `${FILES_BASE_URL}/${path}`
}

export const isImageFile = (
  url: string,
  fileType?: string | null,
  fileName?: string | null,
): boolean => {
  if (fileType?.startsWith("image/")) return true
  if (fileName && IMAGE_EXT.test(fileName)) return true
  return IMAGE_EXT.test((url.split("?")[0] ?? ""))
}

/**
 * A URL that came from another user, safe to put in href/src: http(s), a path on
 * this site, or a local blob preview. Anything else (javascript:, data:, file:) → "".
 */
export const safeUserUrl = (url: string | null | undefined): string => {
  const value = (url ?? "").trim()
  if (!value || value === "#") return ""
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(value)?.[1]?.toLowerCase()
  if (!scheme) return value.startsWith("//") ? "" : value
  return scheme === "http" || scheme === "https" || scheme === "blob" ? value : ""
}
