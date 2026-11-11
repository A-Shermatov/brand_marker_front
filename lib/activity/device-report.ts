/**
 * What this browser can tell about the machine it runs on.
 *
 * The platform keeps it next to the device in its journal: an administrator who
 * looks into an account sees "Windows 11, Chrome, 1920×1080, Dushanbe time" and
 * can tell a person's usual laptop from somebody else's. Nothing here needs a
 * permission prompt: no location, no camera, no contacts.
 */

export type DeviceReport = {
  platform?: string
  platform_version?: string
  architecture?: string
  bitness?: string
  model?: string
  mobile?: boolean
  brands?: string[]
  language?: string
  languages?: string[]
  timezone?: string
  timezone_offset?: number
  screen_width?: number
  screen_height?: number
  viewport_width?: number
  viewport_height?: number
  pixel_ratio?: number
  color_depth?: number
  cpu_cores?: number
  memory_gb?: number
  touch_points?: number
  gpu?: string
  gpu_vendor?: string
  connection?: string
  cookies?: boolean
  standalone?: boolean
  webdriver?: boolean
  dark?: boolean
  referrer?: string
}

type Brand = { brand: string; version: string }
type HighEntropy = {
  platform?: string
  platformVersion?: string
  architecture?: string
  bitness?: string
  model?: string
  mobile?: boolean
  brands?: Brand[]
  fullVersionList?: Brand[]
}
type UserAgentData = HighEntropy & {
  getHighEntropyValues?: (hints: string[]) => Promise<HighEntropy>
}
type ExtendedNavigator = Navigator & {
  userAgentData?: UserAgentData
  deviceMemory?: number
  connection?: { effectiveType?: string }
  standalone?: boolean
}

const REPORT_KEY = "bm-device-report"
/** A browser that never changes still reports once in a while: memory and screens do change. */
const REPORT_EVERY_MS = 7 * 24 * 60 * 60 * 1000

const attempt = <T>(read: () => T): T | undefined => {
  try {
    return read()
  } catch {
    return undefined
  }
}

/** «Chromium 142», without the placeholder brand browsers add on purpose. */
export const brandNames = (brands: Brand[] | undefined): string[] =>
  (brands ?? [])
    .filter((item) => item?.brand && !/not.?a.?brand/i.test(item.brand))
    .map((item) => `${item.brand} ${String(item.version ?? "").split(".")[0]}`.trim())
    .slice(0, 8)

/** Where the visitor came from: the site and page only, never its query (it may hold somebody's token). */
export const outsideReferrer = (referrer: string, ownOrigin: string): string | undefined => {
  if (!referrer) return undefined
  try {
    const url = new URL(referrer)
    if (url.origin === ownOrigin) return undefined
    return `${url.origin}${url.pathname}`.slice(0, 300)
  } catch {
    return undefined
  }
}

/** The graphics card as the browser names it: the most telling trait of a machine. */
const graphics = (): { gpu?: string; gpu_vendor?: string } => {
  const canvas = document.createElement("canvas")
  const gl = (canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl")) as
    | WebGLRenderingContext
    | null
  if (!gl) return {}
  const info = gl.getExtension("WEBGL_debug_renderer_info")
  const gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)
  const vendor = info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)
  gl.getExtension("WEBGL_lose_context")?.loseContext()
  return {
    gpu: typeof gpu === "string" ? gpu : undefined,
    gpu_vendor: typeof vendor === "string" ? vendor : undefined,
  }
}

/** The part of the report that costs nothing to read: enough to see that something changed. */
export const quickReport = (): DeviceReport => {
  const nav = navigator as ExtendedNavigator
  const data = nav.userAgentData
  return {
    platform: data?.platform || nav.platform || undefined,
    mobile: data?.mobile,
    brands: brandNames(data?.brands),
    language: nav.language,
    languages: [...(nav.languages ?? [])].slice(0, 10),
    timezone: attempt(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    timezone_offset: -new Date().getTimezoneOffset(),
    screen_width: window.screen?.width,
    screen_height: window.screen?.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    pixel_ratio: window.devicePixelRatio,
    color_depth: window.screen?.colorDepth,
    cpu_cores: nav.hardwareConcurrency,
    memory_gb: nav.deviceMemory,
    touch_points: nav.maxTouchPoints,
    connection: nav.connection?.effectiveType,
    cookies: nav.cookieEnabled,
    standalone:
      attempt(() => window.matchMedia("(display-mode: standalone)").matches) || nav.standalone === true,
    webdriver: nav.webdriver === true,
    dark: attempt(() => window.matchMedia("(prefers-color-scheme: dark)").matches),
    referrer: outsideReferrer(document.referrer, window.location.origin),
  }
}

/** Everything, including what takes a moment to ask (the exact system version, the graphics card). */
export const fullReport = async (): Promise<DeviceReport> => {
  const report = quickReport()
  const data = (navigator as ExtendedNavigator).userAgentData
  const details = data?.getHighEntropyValues
    ? await data
        .getHighEntropyValues(["platformVersion", "architecture", "bitness", "model", "fullVersionList"])
        .catch(() => undefined)
    : undefined
  if (details) {
    report.platform_version = details.platformVersion || undefined
    report.architecture = details.architecture || undefined
    report.bitness = details.bitness || undefined
    report.model = details.model || undefined
    const full = brandNames(details.fullVersionList)
    if (full.length) report.brands = full
  }
  return { ...report, ...(attempt(graphics) ?? {}) }
}

/** A short stamp of the traits that matter; a new one means the browser has something new to say. */
export const reportStamp = (report: DeviceReport, userAgent: string): string => {
  const text = [
    userAgent,
    report.platform,
    (report.brands ?? []).join(","),
    report.language,
    report.timezone,
    report.screen_width,
    report.screen_height,
    report.pixel_ratio,
    report.cpu_cores,
    report.memory_gb,
    report.touch_points,
  ].join("|")
  let hash = 5381
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
  return (hash >>> 0).toString(36)
}

type Sent = { stamp: string; at: number }

/** True when the browser has not reported yet, has changed since, or did so long ago. */
export const reportIsDue = (saved: Sent | null, stamp: string, now: number): boolean =>
  !saved || saved.stamp !== stamp || now - saved.at > REPORT_EVERY_MS

const readSent = (): Sent | null => {
  try {
    const raw = window.localStorage.getItem(REPORT_KEY)
    const parsed = raw ? (JSON.parse(raw) as Sent) : null
    return parsed && typeof parsed.stamp === "string" && typeof parsed.at === "number" ? parsed : null
  } catch {
    return null
  }
}

/** The report to send now, or null when the platform already has a current one. */
export const dueReport = async (): Promise<{ report: DeviceReport; done: () => void } | null> => {
  const stamp = reportStamp(quickReport(), navigator.userAgent)
  if (!reportIsDue(readSent(), stamp, Date.now())) return null
  const report = await fullReport()
  return {
    report,
    done: () => {
      try {
        window.localStorage.setItem(REPORT_KEY, JSON.stringify({ stamp, at: Date.now() }))
      } catch {
        // Storage is closed: the report simply goes again next time.
      }
    },
  }
}
