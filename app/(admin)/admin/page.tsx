"use client"

import Link from "next/link"
import { WarningIcon as AlertTriangle, ArrowsCounterClockwiseIcon as RefreshCcw } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { useAdminDashboardQuery } from "@/hooks/api/use-admin-dashboard-query"
import { PageFrame, PageHeader } from "@/components/layout"
import { MetricTile } from "@/components/process"
import {
  QUEUE_ICONS,
  QueueTiles,
  type QueueTile,
} from "@/components/admin/dashboard/queue-tiles"
import {
  AttentionList,
  type AttentionItem,
} from "@/components/admin/dashboard/attention-list"
import { formatCurrency, formatCurrencyExact, pluralRu } from "@/lib/format"
import type { AdminDashboardMetrics } from "@/lib/api/admin"

const formatDateRu = (date: Date) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)

const formatActivityTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

const buildQueues = (m: AdminDashboardMetrics): QueueTile[] => [
  {
    id: "companies",
    label: "Компании",
    hint: "документы на проверке",
    count: m.pending_verifications ?? 0,
    href: "/admin/verification",
    Icon: QUEUE_ICONS.companies,
  },
  {
    id: "catalog",
    label: "Товары",
    hint: "карточки на модерации",
    count: m.pending_catalog ?? 0,
    href: "/admin/moderation?tab=catalog&view=draft",
    Icon: QUEUE_ICONS.catalog,
  },
  {
    id: "reports",
    label: "Жалобы",
    hint: "на товары от покупателей",
    count: m.open_reports ?? 0,
    href: "/admin/moderation?tab=reports",
    Icon: QUEUE_ICONS.reports,
  },
  {
    id: "changes",
    label: "Изменения данных",
    hint: "название, директор, адрес",
    count: m.pending_company_changes ?? 0,
    href: "/admin/verification?tab=changes",
    Icon: QUEUE_ICONS.changes,
  },
  {
    id: "chats",
    label: "Переписки",
    hint: "с признаками обхода площадки",
    count: m.flagged_chats ?? 0,
    href: "/admin/chats?filter=flag",
    Icon: QUEUE_ICONS.chats,
  },
  {
    id: "disputes",
    label: "Споры",
    hint: "ждут решения",
    count: m.open_disputes ?? 0,
    href: "/admin/disputes",
    Icon: QUEUE_ICONS.disputes,
  },
  {
    id: "payouts",
    label: "Выплаты",
    hint: "нужны две подписи",
    count: m.pending_payouts ?? 0,
    href: "/admin/finance?view=payouts",
    Icon: QUEUE_ICONS.payouts,
  },
]

const buildAttention = (queues: QueueTile[]): AttentionItem[] => {
  const hints: Record<string, string> = {
    companies: "Без проверки поставщик не может получать выплаты",
    catalog: "Карточки ждут одобрения перед публикацией в каталоге",
    reports: "Проверьте жалобы покупателей на товары",
    changes: "Смена реквизитов требует повторной проверки",
    chats: "Возможные попытки оплаты мимо площадки",
    disputes: "Деньги остаются на гарантии до решения",
    payouts: "Нужны подписи двух администраторов",
  }

  return queues
    .filter((q) => q.count > 0)
    .map((q) => ({
      id: q.id,
      title:
        q.id === "companies"
          ? `${q.count} ${pluralRu(q.count, "компания ждёт", "компании ждут", "компаний ждут")} проверки`
          : q.id === "disputes"
            ? `${q.count} ${pluralRu(q.count, "открытый спор", "открытых спора", "открытых споров")}`
            : q.id === "payouts"
              ? `${q.count} ${pluralRu(q.count, "выплата ждёт", "выплаты ждут", "выплат ждут")} подтверждения`
              : `${q.label}: ${q.count}`,
      hint: hints[q.id] ?? q.hint,
      href: q.href,
      Icon: q.Icon,
    }))
}

const DashboardSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка дашборда">
    <div className="h-10 w-64 rounded-xl bg-canvas" />
    <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-canvas" />
      ))}
    </div>
    <div className="mt-6 h-40 rounded-xl bg-canvas" />
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-canvas" />
      ))}
    </div>
  </PageFrame>
)

export default function AdminDashboardPage() {
  const { data, isLoading, isError, isFetching, refetch } =
    useAdminDashboardQuery()

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-line bg-white p-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-red-50 text-red-700">
            <AlertTriangle size={22} aria-hidden />
          </div>
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить данные</h1>
          <p className="mt-2 text-sm text-mute">
            Проверьте подключение к API и повторите запрос.
          </p>
          <Button type="button" className="mt-5" onClick={() => refetch()}>
            <RefreshCcw size={16} aria-hidden />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const metrics = {
    ...data.metrics,
    pending_catalog: data.metrics.pending_catalog ?? 0,
    open_reports: data.metrics.open_reports ?? 0,
    pending_payouts: data.metrics.pending_payouts ?? 0,
    flagged_chats: data.metrics.flagged_chats ?? 0,
    pending_company_changes: data.metrics.pending_company_changes ?? 0,
  }

  const queues = buildQueues(metrics)
  const attention = buildAttention(queues)
  const commission = metrics.monthly_commission ?? 0
  const commissionHint = metrics.commission_percent
    ? `${metrics.commission_percent}% с поставщиков`
    : "с поставщиков"
  const today = formatDateRu(new Date())
  const activity = [...data.recent_activity]
    .sort(
      (a, b) =>
        new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime(),
    )
    .slice(0, 4)

  return (
    <PageFrame className="max-w-none">
      <PageHeader
        title="Обзор площадки"
        description={today}
        actions={
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Обновить данные дашборда"
          >
            <RefreshCcw
              size={15}
              className={isFetching ? "animate-spin" : undefined}
              aria-hidden
            />
            Обновить
          </Button>
        }
      />

      <div className="grid gap-6">
        <QueueTiles tiles={queues} />

        <AttentionList items={attention} />

        <section
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Ключевые показатели"
        >
          <MetricTile
            label="Оборот за месяц"
            value={formatCurrency(metrics.monthly_revenue)}
            valueTitle={formatCurrencyExact(metrics.monthly_revenue)}
            hint="по завершённым и текущим сделкам"
          />
          <MetricTile
            label="На гарантии"
            value={formatCurrency(metrics.escrow_balance)}
            valueTitle={formatCurrencyExact(metrics.escrow_balance)}
            hint={`${metrics.active_contracts} ${pluralRu(metrics.active_contracts, "сделка", "сделки", "сделок")}`}
          />
          <MetricTile
            label="Комиссия за месяц"
            value={formatCurrency(commission)}
            valueTitle={formatCurrencyExact(commission)}
            hint={commissionHint}
          />
          <MetricTile
            label="Компаний"
            value={String(metrics.total_companies)}
            hint={`${metrics.pending_verifications} на проверке`}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
            <span className="text-[13px] font-semibold text-mute">
              Безопасность за сутки
            </span>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {(
                [
                  ["Неудачных входов", String(metrics.failed_logins_24h ?? 0)],
                  ["Заблокировано IP", "—"],
                  ["Без 2FA", String(metrics.users_without_2fa ?? 0)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[12.5px] text-mute">{label}</dt>
                  <dd className="mono text-[22px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-mute">
              Рекомендуем включить 2FA в настройках аккаунта. Opt-in для всех
              ролей; после включения код запрашивается при каждом входе.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-mute">
                Последние действия
              </span>
              <Link
                href="/admin/logs"
                className="text-[13px] text-brand-700 hover:underline"
              >
                Журнал →
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="mt-3 text-[14px] text-mute">Событий пока нет.</p>
            ) : (
              <ul className="mt-3 grid gap-2.5 text-[13.5px]">
                {activity.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-[110px_1fr] gap-3"
                  >
                    <span className="mono text-[12px] text-mute">
                      {formatActivityTime(item.happened_at)}
                    </span>
                    <span>
                      <b className="font-medium">{item.title}:</b>{" "}
                      {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </PageFrame>
  )
}
