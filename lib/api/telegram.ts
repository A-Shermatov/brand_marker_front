import { apiFetch } from "./client"

export type TelegramPost = {
  rfq_id: string
  title: string | null
  status: "sent" | "failed"
  error: string | null
  message_id: number | null
  created_at: string
}

/** The channel bot as the admin sees it. The token itself never comes back. */
export type TelegramSettings = {
  enabled: boolean
  has_token: boolean
  token_hint: string | null
  bot_username: string | null
  channel_id: string | null
  channel_title: string | null
  site_url: string
  default_site_url: string
  updated_at: string | null
  sent_count: number
  failed_count: number
  recent: TelegramPost[]
  can_update: boolean
}

export type TelegramSettingsInput = {
  enabled: boolean
  /** Empty keeps the saved token. */
  bot_token?: string
  channel_id?: string
  site_url?: string
}

const PREFIX = "/admin/telegram"

export const telegramApi = {
  get: () => apiFetch<TelegramSettings>(PREFIX),
  update: (data: TelegramSettingsInput) =>
    apiFetch<TelegramSettings>(PREFIX, { method: "PUT", body: JSON.stringify(data) }),
  test: () => apiFetch<{ ok: boolean }>(`${PREFIX}/test`, { method: "POST" }),
  /** The next post: the picture as a data URL (none without a font) and the caption. */
  preview: () =>
    apiFetch<{ caption: string; image: string | null; sample: boolean }>(`${PREFIX}/preview`),
  resend: (rfqId: string) =>
    apiFetch<{ ok: boolean; status: string | null }>(`${PREFIX}/posts/${rfqId}/resend`, {
      method: "POST",
    }),
}
