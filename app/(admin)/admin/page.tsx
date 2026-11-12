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
import { emptyAdminNavCounts, useAdminNavCounts } from "@/hooks/api/use-nav-counts-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import { canAccessAdminPath } from "@/lib/admin-permissions"
import type { AdminNavCounts } from "@/lib/api/nav-counts"
import { formatCurrency, formatCurrencyExact, pluralRu } from "@/lib/format"
import { useAuthStore } from "@/lib/store/auth-store"

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

/**
 * What waits for a decision: the queues of the menu, with the same numbers the
 * menu shows next to them.
 */
const buildQueues = (counts: AdminNavCounts): QueueTile[] => [
  {
    id: "companies",
    label: "Проверка клиентов",
    hint: "компании, люди и изменения профилей",
    count: counts.companies,
    href: "/admin/verification?tab=queue",
    Icon: QUEUE_ICONS.companies,
  },
  {
    id: "catalog",
    label: "Товары и услуги",
    hint: "ждут одобрения перед выходом в каталог",
    count: counts.catalog,
    href: "/admin/catalog?status=pending_review",
    Icon: QUEUE_ICONS.catalog,
  },
  {
    id: "reports",
    label: "Жалобы",
    hint: "на товары, заявки и предложения",
    count: counts.reports,
    href: "/admin/moderation",
    Icon: QUEUE_ICONS.reports,
  },
  {
    id: "disputes",
    label: "Споры",
    hint: "деньги на гарантии до вашего решения",
    count: counts.disputes,
    href: "/admin/disputes",
    Icon: QUEUE_ICONS.disputes,
  },
  {
    id: "support",
    label: "Поддержка",
    hint: "обращения без ответа",
    count: counts.support,
    href: "/admin/support",
    Icon: QUEUE_ICONS.support,
  },
  {
    id: "chats",
    label: "Переписки",
    hint: "с признаками оплаты мимо площадки",
    count: counts.chats,
    href: "/admin/chats?filter=flag",
    Icon: QUEUE_ICONS.chats,
  },
  {
    id: "payouts",
    label: "Выплаты",
    hint: "ждут подтверждения",
    count: counts.finance,
    href: "/admin/finance?view=payouts",
    Icon: QUEUE_ICONS.payouts,
  },
]

/** What happened, in a word, before the name of whom or what it happened to. */
const ACTIVITY_LABELS: Record<string, string> = {
  registration: "Новый аккаунт",
  contract: "Новая сделка",
  payment: "Оплата",
  dispute: "Открыт спор",
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
  const user = useAuthStore((state) => state.user)
  const navCounts = useAdminNavCounts()
  const seesMoney = useAdminPermission("admin_finance.view")
  const seesJournal = useAdminPermission("audit_logs.view")

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-line bg-card p-8 text-center">
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

  // Only the queues this member of staff can open: a tile never leads to a closed door.
  const queues = buildQueues(navCounts.data ?? emptyAdminNavCounts()).filter((queue) =>
    canAccessAdminPath(user, queue.href),
  )
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
            onClick={() => {
              void refetch()
              void navCounts.refetch()
            }}
            disabled={isFetching}
            aria-label="Обновить данные обзора"
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

        <section
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Ключевые показатели"
        >
          {seesMoney && (
            <>
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
            </>
          )}
          <MetricTile
            label="Компаний"
            value={String(metrics.total_companies)}
            hint={`${metrics.pending_verifications} на проверке`}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
            <span className="text-[13px] font-semibold text-mute">
              Безопасность за сутки
            </span>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {(
                [
                  ["Неудачных входов", String(metrics.failed_logins_24h ?? 0)],
                  ["Аккаунтов без защиты входа", String(metrics.users_without_2fa ?? 0)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[12.5px] text-mute">{label}</dt>
                  <dd className="mono text-[22px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-mute">
              Защита входа — это код из приложения при каждом входе: аккаунт не откроют, даже узнав
              пароль. Включите её у себя в{" "}
              <Link href="/admin/account" className="font-medium text-brand-700 hover:underline">
                «Моём аккаунте»
              </Link>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-mute">
                Последние действия
              </span>
              {seesJournal && (
                <Link
                  href="/admin/logs"
                  className="text-[13px] text-brand-700 hover:underline"
                >
                  Журнал →
                </Link>
              )}
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
                      <b className="font-medium">{ACTIVITY_LABELS[item.type] ?? "Событие"}:</b>{" "}
                      {item.title}
                      <span className="text-mute"> · {item.description}</span>
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
