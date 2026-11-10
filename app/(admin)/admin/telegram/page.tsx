"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  PaperPlaneTiltIcon,
  TelegramLogoIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { TelegramPostPreview } from "@/components/admin/telegram-post-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { telegramApi, type TelegramSettings } from "@/lib/api/telegram"
import { formatRelativeIso } from "@/lib/format"
import { cn } from "@/lib/utils"

const KEY = ["admin-telegram"] as const

type Form = { enabled: boolean; token: string; channel: string; siteUrl: string }

const toForm = (s: TelegramSettings): Form => ({
  enabled: s.enabled,
  token: "",
  channel: s.channel_id ?? "",
  siteUrl: s.site_url === s.default_site_url ? "" : s.site_url,
})

/**
 * The bot that posts every new public request to the platform's Telegram
 * channel: connect it, switch it on or off, send a test, see what went out.
 */
export default function AdminTelegramPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: telegramApi.get })
  const [form, setForm] = useState<Form | null>(null)

  useEffect(() => {
    if (data && !form) setForm(toForm(data))
  }, [data, form])

  const save = useMutation({
    mutationFn: (f: Form) =>
      telegramApi.update({
        enabled: f.enabled,
        bot_token: f.token.trim() || undefined,
        channel_id: f.channel.trim() || undefined,
        site_url: f.siteUrl.trim() || undefined,
      }),
    onSuccess: (next) => {
      qc.setQueryData(KEY, next)
      setForm(toForm(next))
      toast.success(next.enabled ? "Бот подключён, новые заявки уйдут в канал" : "Настройки бота сохранены")
    },
    // Errors are shown by the app's query client, with the server's reason.
    meta: { errorMessage: "Не удалось сохранить настройки бота" },
  })
  const test = useMutation({
    mutationFn: telegramApi.test,
    onSuccess: () => toast.success("Тестовое сообщение отправлено в канал"),
    meta: { errorMessage: "Не удалось отправить тест" },
  })
  const resend = useMutation({
    mutationFn: telegramApi.resend,
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: KEY })
      if (result.ok) toast.success("Заявка отправлена в канал")
      else toast.error(result.status === "skipped" ? "Заявка уже закрыта или скрыта" : "Telegram снова отклонил сообщение")
    },
    meta: { errorMessage: "Не удалось отправить" },
  })

  if (isLoading || !data || !form) {
    return (
      <PageFrame className="animate-pulse">
        <div className="h-10 w-1/3 rounded-xl bg-surface-muted" />
        <div className="h-72 rounded-2xl bg-surface-muted" />
      </PageFrame>
    )
  }

  const canEdit = data.can_update
  const connected = data.has_token && Boolean(data.channel_id)
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(form)
  }

  return (
    <PageFrame>
      <PageHeader
        title="Telegram-бот"
        description="Новые заявки покупателей автоматически публикуются в вашем канале"
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <PageSurface className="grid gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-[#229ED9] text-white">
                <TelegramLogoIcon weight="fill" className="size-6" aria-hidden />
              </span>
              <div className="grid min-w-0 flex-1">
                <b className="text-[16px] text-ink">
                  {data.bot_username ? `@${data.bot_username}` : "Бот не подключён"}
                </b>
                <span className="truncate text-[13.5px] text-mute">
                  {data.channel_title
                    ? `Канал: ${data.channel_title}${data.channel_id ? ` (${data.channel_id})` : ""}`
                    : "Канал не указан"}
                </span>
              </div>
              <span
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold",
                  data.enabled ? "bg-safe-50 text-safe-700" : "bg-surface-muted text-mute",
                )}
              >
                {data.enabled ? (
                  <CheckCircleIcon weight="fill" className="size-4" aria-hidden />
                ) : null}
                {data.enabled ? "Отправка включена" : "Отправка выключена"}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-muted p-3">
                <dt className="text-[12.5px] text-mute">Отправлено заявок</dt>
                <dd className="text-[22px] font-bold text-ink tnum">{data.sent_count}</dd>
              </div>
              <div className="rounded-xl bg-surface-muted p-3">
                <dt className="text-[12.5px] text-mute">С ошибкой</dt>
                <dd className={cn("text-[22px] font-bold tnum", data.failed_count ? "text-red-700" : "text-ink")}>
                  {data.failed_count}
                </dd>
              </div>
              <div className="col-span-2 rounded-xl bg-surface-muted p-3 sm:col-span-1">
                <dt className="text-[12.5px] text-mute">Ссылки ведут на</dt>
                <dd className="truncate text-[14px] font-semibold text-ink">{data.site_url}</dd>
              </div>
            </dl>
          </PageSurface>

          <PageSurface className="p-5 sm:p-6">
            <form onSubmit={onSubmit} className="grid gap-5">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-line p-4">
                <div className="grid gap-0.5">
                  <Label htmlFor="tg-enabled" className="text-[15px] font-semibold">
                    Публиковать новые заявки в канал
                  </Label>
                  <span className="text-[13px] text-mute">
                    Только открытые для всех поставщиков. Персональные заявки и покупки из каталога в канал не попадают.
                  </span>
                </div>
                <Switch
                  id="tg-enabled"
                  checked={form.enabled}
                  disabled={!canEdit}
                  onCheckedChange={(enabled) => setForm({ ...form, enabled })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tg-token">Токен бота</Label>
                <Input
                  id="tg-token"
                  type="password"
                  autoComplete="off"
                  value={form.token}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  placeholder={data.token_hint ? `Сохранён: ${data.token_hint}` : "123456789:AA…"}
                />
                <p className="text-[12.5px] text-mute">
                  {data.has_token
                    ? "Оставьте пустым, чтобы не менять. Токен хранится в зашифрованном виде и не показывается."
                    : "Токен выдаёт @BotFather при создании бота."}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tg-channel">Канал</Label>
                <Input
                  id="tg-channel"
                  value={form.channel}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  placeholder="@brendmarket_zayavki или -1001234567890"
                />
                <p className="text-[12.5px] text-mute">
                  Публичный канал — по имени через @. Закрытый — по числовому id, он начинается с −100.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tg-site">Адрес сайта для ссылок</Label>
                <Input
                  id="tg-site"
                  value={form.siteUrl}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
                  placeholder={data.default_site_url}
                />
                <p className="text-[12.5px] text-mute">
                  Кнопка «Открыть заявку» ведёт на этот адрес. Пусто — адрес из настроек сервера.
                </p>
              </div>

              {canEdit ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={save.isPending}>
                    {save.isPending ? <CircleNotchIcon className="animate-spin" aria-hidden /> : null}
                    Сохранить
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!connected || test.isPending}
                    onClick={() => test.mutate()}
                  >
                    <PaperPlaneTiltIcon className="size-4" aria-hidden /> Отправить тест в канал
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-mute">У вашей роли нет права менять настройки.</p>
              )}
            </form>
          </PageSurface>

          <PageSurface className="p-5 sm:p-6">
            <h2 className="mb-3 text-[16px] font-semibold text-ink">Последние публикации</h2>
            {data.recent.length === 0 ? (
              <p className="text-[14px] text-mute">Пока ничего не отправлено.</p>
            ) : (
              <ul className="divide-y divide-line" aria-label="Последние публикации">
                {data.recent.map((post) => (
                  <li key={post.rfq_id} className="flex flex-wrap items-center gap-3 py-3">
                    {post.status === "sent" ? (
                      <CheckCircleIcon weight="fill" className="size-5 shrink-0 text-safe-500" aria-label="Отправлено" />
                    ) : (
                      <WarningCircleIcon weight="fill" className="size-5 shrink-0 text-red-600" aria-label="Ошибка" />
                    )}
                    <div className="grid min-w-0 flex-1">
                      <Link
                        href={`/admin/rfqs/${post.rfq_id}`}
                        className="truncate text-[14px] font-medium text-ink hover:text-brand-700"
                      >
                        {post.title ?? post.rfq_id}
                      </Link>
                      <span className={cn("truncate text-[12.5px]", post.error ? "text-red-700" : "text-mute")}>
                        {post.error ?? `Отправлено ${formatRelativeIso(post.created_at)}`}
                      </span>
                    </div>
                    {post.status === "failed" && canEdit ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={resend.isPending}
                        onClick={() => resend.mutate(post.rfq_id)}
                      >
                        <ArrowClockwiseIcon className="size-4" aria-hidden /> Отправить снова
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </PageSurface>
        </div>

        <aside className="grid gap-6">
          <PageSurface className="grid gap-3 p-5">
            <h2 className="text-[16px] font-semibold text-ink">Как подключить</h2>
            <ol className="grid list-decimal gap-2 pl-5 text-[14px] leading-relaxed text-ink-soft">
              <li>Возьмите токен вашего бота у @BotFather.</li>
              <li>
                Добавьте бота в канал <b>администратором</b> с правом публиковать сообщения.
              </li>
              <li>Впишите токен и канал, сохраните и отправьте тест.</li>
              <li>Включите публикацию — каждая новая заявка придёт в канал.</li>
            </ol>
          </PageSurface>

          <PageSurface className="grid gap-3 p-5">
            <h2 className="text-[16px] font-semibold text-ink">Так выглядит пост</h2>
            <TelegramPostPreview />
            <p className="text-[12.5px] text-mute">
              Картинка с логотипом заказчика и Brend Market, под ней текст заявки и кнопка «Открыть заявку».
            </p>
          </PageSurface>
        </aside>
      </div>
    </PageFrame>
  )
}
