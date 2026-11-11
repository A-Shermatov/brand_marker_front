import { apiFetch } from "./client"

/** A person's link to the platform's Telegram bot. */
export type TelegramAccount = {
  /** The admin has turned the bot on; false hides the whole card. */
  available: boolean
  bot_username: string | null
  linked: boolean
  telegram_username: string | null
  telegram_name: string | null
  linked_at: string | null
}

export type TelegramLinkStart = {
  /** Opens the bot with a one-time code; pressing Start there links the account. */
  url: string
  expires_at: string
}

export const telegramAccountApi = {
  get: () => apiFetch<TelegramAccount>("/telegram/account"),
  startLink: () => apiFetch<TelegramLinkStart>("/telegram/account/link", { method: "POST" }),
  unlink: () => apiFetch<TelegramAccount>("/telegram/account", { method: "DELETE" }),
}
