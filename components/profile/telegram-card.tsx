"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BellRingingIcon,
  ChatTextIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClipboardTextIcon,
  TelegramLogoIcon,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { telegramAccountApi } from "@/lib/api/telegram-account"
import { useHydrated } from "@/hooks/use-hydrated"

export const telegramAccountKey = ["telegram", "account"] as const

export const useTelegramAccount = () => {
  const hydrated = useHydrated()
  return useQuery({
    queryKey: telegramAccountKey,
    queryFn: () => telegramAccountApi.get(),
    enabled: hydrated && isApiEnabled(),
  })
}

const BENEFITS = [
  {
    icon: ClipboardTextIcon,
    title: "Заявка одним сообщением",
    text: "Напишите боту, что вам нужно, выберите категорию и срок — заявка опубликована.",
  },
  {
    icon: ChatTextIcon,
    title: "Ответ на заявку в два касания",
    text: "Листайте заявки покупателей в чате с ботом и отправляйте цену и срок, не открывая сайт.",
  },
  {
    icon: BellRingingIcon,
    title: "Уведомления сразу",
    text: "Новое предложение, выбор поставщика, оплата — всё приходит в Telegram.",
  },
] as const

/**
 * The person's link to the platform's Telegram bot. Linking is one tap: the
 * button opens the bot with a one-time code and pressing Start there finishes
 * it. While the tab is open the card checks whether that has happened.
 */
export function TelegramCard() {
  const queryClient = useQueryClient()
  const { data: account, isLoading } = useTelegramAccount()
  const [waiting, setWaiting] = useState(false)

  // After the bot was opened: look every few seconds until the link appears.
  useEffect(() => {
    if (!waiting) return
    if (account?.linked) {
      setWaiting(false)
      toast.success("Telegram подключён")
      return
    }
    const timer = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: telegramAccountKey })
    }, 3000)
    const stop = window.setTimeout(() => setWaiting(false), 3 * 60 * 1000)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(stop)
    }
  }, [waiting, account?.linked, queryClient])

  const link = useMutation({
    mutationFn: () => telegramAccountApi.startLink(),
    onSuccess: (start) => {
      setWaiting(true)
      window.open(start.url, "_blank", "noopener,noreferrer")
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось открыть бота")),
  })

  const unlink = useMutation({
    mutationFn: () => telegramAccountApi.unlink(),
    onSuccess: (next) => {
      queryClient.setQueryData(telegramAccountKey, next)
      toast.success("Telegram отключён")
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Не удалось отключить Telegram")),
  })

  if (isLoading) {
    return <section className="h-56 rounded-2xl border border-line bg-card bm-shimmer" aria-busy />
  }

  const bot = account?.bot_username ? `@${account.bot_username}` : "бот Brand Market"

  return (
    <section
      aria-label="Telegram"
      className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(14_22_48/0.04)]"
    >
      <header className="flex flex-wrap items-center gap-4 border-b border-line bg-[#E8F4FD] px-5 py-4 dark:bg-[#12283A] sm:px-6">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#229ED9] text-white shadow-[0_6px_14px_-6px_rgb(34_158_217/0.8)]"
          aria-hidden
        >
          <TelegramLogoIcon weight="fill" className="size-7" />
        </span>
        <div className="min-w-[200px] flex-1">
          <h2 className="text-[17px] font-semibold text-ink">Brand Market в Telegram</h2>
          <p className="mt-0.5 text-[13.5px] text-ink-soft">
            {account?.linked
              ? `Подключён${account.telegram_username ? `: @${account.telegram_username}` : account.telegram_name ? `: ${account.telegram_name}` : ""}. Откройте чат с ботом ${bot}.`
              : account?.available
                ? `Заявки, ответы и уведомления — прямо в чате с ботом ${bot}.`
                : "Бот пока не подключён к площадке. Как только администратор включит его, здесь появится кнопка."}
          </p>
        </div>
        {account?.linked ? (
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-safe-50 px-2.5 text-[12.5px] font-semibold text-safe-700">
            <CheckCircleIcon weight="fill" className="size-4" aria-hidden />
            Подключён
          </span>
        ) : null}
      </header>

      <div className="grid gap-5 px-5 py-5 sm:px-6">
        <ul className="grid gap-3 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border border-line bg-canvas/70 p-3.5">
              <Icon weight="duotone" className="size-6 text-brand-600" aria-hidden />
              <p className="mt-2 text-[14px] font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-mute">{text}</p>
            </li>
          ))}
        </ul>

        {account?.available ? (
          <div className="flex flex-wrap items-center gap-3">
            {account.linked ? (
              <>
                <Button asChild>
                  <a href={`https://t.me/${account.bot_username}`} target="_blank" rel="noopener noreferrer">
                    <TelegramLogoIcon weight="fill" className="size-4" aria-hidden />
                    Открыть бота
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-mute"
                  disabled={unlink.isPending}
                  onClick={() => unlink.mutate()}
                >
                  Отключить
                </Button>
              </>
            ) : (
              <>
                <Button type="button" disabled={link.isPending} onClick={() => link.mutate()}>
                  {link.isPending ? (
                    <CircleNotchIcon className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <TelegramLogoIcon weight="fill" className="size-4" aria-hidden />
                  )}
                  Подключить Telegram
                </Button>
                <p className="min-w-[220px] flex-1 text-[13px] leading-snug text-mute" role="status">
                  {waiting
                    ? "Бот открыт в Telegram: нажмите там «Запустить» (Start). Эта страница обновится сама."
                    : "Откроется бот. Нажмите в нём «Запустить» — и аккаунт подключён. Пароль вводить не нужно."}
                </p>
              </>
            )}
          </div>
        ) : null}
      </div>
    </section>
  )
}
