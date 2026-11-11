"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { AdminLink } from "@/components/admin/admin-link"
import { DeviceSheet, journalHref } from "@/components/admin/logs/device-sheet"
import { DevicesPanel } from "@/components/admin/logs/devices-panel"
import { AdminMarksCard } from "@/components/admin/marks/admin-marks-card"
import { useSearchParams } from "next/navigation"
import { WarningIcon as AlertTriangle, ProhibitIcon as Ban, FileTextIcon as FileText, EnvelopeIcon as Mail, ArrowsCounterClockwiseIcon as RefreshCcw, StarIcon as Star, UserCheckIcon as UserCheck } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import {
  PageEmptyState,
  PageFrame,
  PageHeader,
  PageSurface,
  SegmentedControl,
} from "@/components/layout"
import { UserDossierTab } from "@/components/admin/clients/user-dossier-tab"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAdminUserQuery,
  useRevokeAdminUserSessionsMutation,
  useUpdateAdminUserStatusMutation,
} from "@/hooks/api/use-admin-users-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type {
  AdminUserDetail,
  AdminUserHistoryItem,
  AdminUserRole,
  AdminUserStatus,
} from "@/lib/api/admin"
import { formatMoneyDisplay } from "@/lib/format"
import { resolveFileUrl } from "@/lib/file-url"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"

type DetailTab = "dossier" | "deals" | "hist" | "devices" | "chats" | "docs"

const DETAIL_TABS: readonly DetailTab[] = ["dossier", "deals", "hist", "devices", "chats", "docs"]

const roleLabels: Record<AdminUserRole, string> = {
  buyer: "Покупатель",
  supplier: "Поставщик",
  both: "Покупатель и поставщик",
  admin: "Администратор",
  superadmin: "Суперадминистратор",
  moderator: "Модератор",
}

const statusMetadata: Record<
  AdminUserStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Активен",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  blocked: {
    label: "Заблокирован",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
  pending: {
    label: "Ожидает активации",
    className: "border-warning/20 bg-warning/10 text-warning",
  },
}

const staffRoleRank: Partial<Record<AdminUserRole, number>> = {
  moderator: 1,
  admin: 2,
  superadmin: 3,
}

const checklistLabels: Record<string, string> = {
  legal_name: "Юридическое название",
  tax_number: "ИНН / налоговый номер",
  address: "Адрес",
  website: "Сайт",
  certificates: "Сертификаты и документы",
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))

const historyTitle = (item: AdminUserHistoryItem) => {
  if (item.action === "admin.user.status.blocked") return "Заблокировал"
  if (item.action === "admin.user.status.active") return "Разблокировал"
  if (item.action.startsWith("admin.user.status.")) return "Изменил статус"
  return item.action.replace(/^admin\./, "").replace(/\./g, " · ")
}

const historyDetail = (item: AdminUserHistoryItem) => {
  const reason =
    typeof item.details?.reason === "string" && item.details.reason.trim()
      ? item.details.reason.trim()
      : null
  const previous =
    typeof item.details?.previous_status === "string"
      ? item.details.previous_status
      : null
  const next =
    typeof item.details?.status === "string" ? item.details.status : null
  const parts = [
    previous && next ? `${previous} → ${next}` : null,
    reason ? `Причина: ${reason}` : null,
    item.actor?.name || item.actor?.email || null,
  ].filter(Boolean)
  return parts.join(" · ") || "—"
}

const DetailSkeleton = () => (
  <PageFrame className="animate-pulse space-y-5">
    <div className="h-5 w-36 rounded bg-muted" />
    <div className="h-48 rounded-xl bg-muted" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-24 rounded-xl bg-muted" />
      ))}
    </div>
    <div className="h-80 rounded-xl bg-muted" />
  </PageFrame>
)

type PageProps = {
  params: Promise<{ id: string }>
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const userId = Number(id)
  const userQuery = useAdminUserQuery(userId)
  const updateStatusMutation = useUpdateAdminUserStatusMutation()
  const revokeSessionsMutation = useRevokeAdminUserSessionsMutation()
  const canUpdateUsers = useAdminPermission("admin_users.update")
  const canViewJournal = useAdminPermission("audit_logs.view")
  const currentUser = useAuthStore((state) => state.user)
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab") as DetailTab | null
  const [tab, setTab] = useState<DetailTab>(
    requestedTab && DETAIL_TABS.includes(requestedTab) ? requestedTab : "deals",
  )
  const [blockOpen, setBlockOpen] = useState(false)
  const [unblockOpen, setUnblockOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [banDuration, setBanDuration] = useState<number | "permanent">(7)

  const BAN_OPTIONS: Array<{ value: number | "permanent"; label: string }> = [
    { value: 1, label: "1 день" },
    { value: 7, label: "7 дней" },
    { value: 30, label: "30 дней" },
    { value: 90, label: "90 дней" },
    { value: 365, label: "365 дней" },
    { value: "permanent", label: "Бессрочно" },
  ]

  const user = userQuery.data

  const canManage = useMemo(() => {
    if (!user || !canUpdateUsers) return false
    if (user.id === currentUser?.userId) return false
    const currentRank =
      staffRoleRank[currentUser?.platformRole as AdminUserRole] ?? 0
    const targetRank = staffRoleRank[user.role] ?? 0
    return targetRank === 0 || targetRank < currentRank
  }, [canUpdateUsers, currentUser, user])

  if (!Number.isInteger(userId) || userId <= 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Некорректный ID пользователя</h1>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/admin/users">К списку</Link>
        </Button>
      </div>
    )
  }

  if (userQuery.isLoading) return <DetailSkeleton />

  if (userQuery.isError || !user) {
    return (
      <div className="mx-auto flex min-h-[55dvh] max-w-lg items-center justify-center">
        <div className="w-full rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-bold">Пользователь не найден</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Запись удалена, недоступна или API временно не отвечает.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/users">К списку</Link>
            </Button>
            <Button type="button" onClick={() => userQuery.refetch()}>
              <RefreshCcw aria-hidden="true" />
              Повторить
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const fullName =
    `${user.first_name} ${user.last_name}`.trim() || "Без имени"
  const initials =
    `${user.first_name.trim().charAt(0)}${user.last_name.trim().charAt(0)}`
      .toUpperCase() || user.email.charAt(0).toUpperCase()
  const primaryCompany = user.companies[0] ?? null
  const isSupplier =
    user.role === "supplier" ||
    (user.role === "both" && user.stats.sales_count >= user.stats.purchases_count)
  const dealsCount = isSupplier
    ? user.stats.sales_count
    : user.stats.purchases_count
  const statusMeta = statusMetadata[user.status]

  const kpis = [
    {
      label: isSupplier ? "Продаж" : "Покупок",
      value: String(dealsCount),
      hint: "сделок за всё время",
    },
    {
      label: isSupplier ? "Продано, TJS" : "Куплено, TJS",
      value: formatMoneyDisplay(user.stats.contracts_sum, "TJS"),
      hint: "через гарантию",
    },
    {
      label: "Споров",
      value: String(user.stats.disputes_count),
      hint: user.stats.disputes_count
        ? "есть открытые или решённые"
        : "не было",
      danger: user.stats.disputes_count > 0,
    },
    {
      label: "Рейтинг",
      value:
        user.stats.rating != null ? user.stats.rating.toFixed(1) : "—",
      hint: user.stats.reviews_count
        ? `${user.stats.reviews_count} отзывов`
        : "нет отзывов",
    },
    {
      label: "Переписок",
      value: String(user.stats.chats_count),
      hint: user.stats.flagged_chats_count
        ? `${user.stats.flagged_chats_count} с нарушениями`
        : "без нарушений",
      danger: user.stats.flagged_chats_count > 0,
    },
  ]

  const applyStatus = async (nextStatus: AdminUserStatus, nextReason?: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        status: nextStatus,
        reason: nextReason,
        durationDays:
          nextStatus === "blocked" && banDuration !== "permanent"
            ? banDuration
            : null,
        permanent: nextStatus === "blocked" && banDuration === "permanent",
      })
      toast.success(
        nextStatus === "blocked"
          ? "Пользователь заблокирован и вышел на всех устройствах"
          : "Пользователь разблокирован",
      )
      setBlockOpen(false)
      setUnblockOpen(false)
      setReason("")
      setBanDuration(7)
    } catch {
      // error toast via MutationCache
    }
  }

  const revokeSessions = async () => {
    try {
      await revokeSessionsMutation.mutateAsync(user.id)
      toast.success("Сеансы завершены: пользователь вышел на всех устройствах")
    } catch {
      // error toast via MutationCache
    }
  }

  return (
    <PageFrame>
      <PageHeader
        title={fullName}
        description={`ID ${user.id}`}
        backHref="/admin/users"
        backLabel="Пользователи"
      />

      <PageSurface className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-lg font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-[220px] flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
                {fullName}
              </h2>
              <span className="text-sm text-muted-foreground">ID {user.id}</span>
              <Badge variant="outline" className={statusMeta.className}>
                {statusMeta.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {roleLabels[user.role]}
              {" · "}
              {primaryCompany ? (
                <Link
                  href={`/admin/companies/${primaryCompany.id}`}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {primaryCompany.title}
                </Link>
              ) : (
                "без компании"
              )}
              {" · с "}
              {formatDate(user.created_at)}
            </p>
            <p className="text-sm text-muted-foreground">
              {user.email}
              {" · "}
              <span className="tabular-nums">{user.phone || "телефон не указан"}</span>
            </p>
            {user.status === "blocked" && (
              <p className="mt-1 text-sm text-destructive">
                {user.banned_until
                  ? `Заблокирован до ${formatDateTime(user.banned_until)}`
                  : "Заблокирован бессрочно"}
                {user.block_reason ? ` · ${user.block_reason}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${user.email}`}>
              <Mail aria-hidden="true" />
              Написать
            </a>
          </Button>
          {canManage && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={revokeSessionsMutation.isPending}
              onClick={() => void revokeSessions()}
            >
              <RefreshCcw aria-hidden="true" />
              {revokeSessionsMutation.isPending
                ? "Завершаем…"
                : "Завершить сеансы"}
            </Button>
          )}
          {canManage && user.status === "blocked" && (
            <Button
              type="button"
              size="sm"
              onClick={() => setUnblockOpen(true)}
            >
              <UserCheck aria-hidden="true" />
              Разблокировать
            </Button>
          )}
          {canManage && user.status !== "blocked" && (
            <Button
              type="button"
              size="sm"
              variant="destructive-outline"
              onClick={() => setBlockOpen(true)}
            >
              <Ban aria-hidden="true" />
              Завершить сеансы и заблокировать…
            </Button>
          )}
        </div>
      </PageSurface>

      {canManage && (user.role === "supplier" || user.role === "both" || user.role === "buyer") ? (
        <AdminMarksCard userId={user.id} />
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-2 text-2xl font-bold tabular-nums",
                kpi.danger && "text-destructive",
              )}
            >
              {kpi.label === "Рейтинг" && user.stats.rating != null ? (
                <span className="inline-flex items-center gap-1">
                  <Star size={18} className="text-amber-500" aria-hidden="true" />
                  {kpi.value}
                </span>
              ) : (
                kpi.value
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <SegmentedControl
          value={tab}
          options={[
            { value: "dossier" as const, label: "Досье" },
            { value: "deals" as const, label: "Сделки", count: user.contracts.length },
            { value: "hist" as const, label: "История", count: user.history.length },
            ...(canViewJournal ? [{ value: "devices" as const, label: "Устройства" }] : []),
            { value: "chats" as const, label: "Переписки", count: user.chats.length },
            { value: "docs" as const, label: "Документы" },
          ]}
          onChange={setTab}
          ariaLabel="Разделы пользователя"
          className="w-full max-w-full"
        />

        {tab === "dossier" && <UserDossierTab userId={user.id} />}
        {tab === "deals" && <DealsTab user={user} />}
        {tab === "hist" && <HistoryTab items={user.history} />}
        {tab === "devices" && canViewJournal && <DevicesTab userId={user.id} />}
        {tab === "chats" && <ChatsTab user={user} />}
        {tab === "docs" && <DocsTab user={user} />}
      </div>

      <Dialog
        open={blockOpen}
        onOpenChange={(open) => {
          if (!updateStatusMutation.isPending) {
            setBlockOpen(open)
            if (!open) setReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заблокировать пользователя?</DialogTitle>
            <DialogDescription>
              {user.email} сразу выйдет из аккаунта на всех устройствах и не сможет войти
              снова. Каталог и КП скрываются; активные сделки через эскроу продолжаются.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Срок
              </p>
              <div className="flex flex-wrap gap-2">
                {BAN_OPTIONS.map((option) => (
                  <Button
                    key={String(option.value)}
                    type="button"
                    size="sm"
                    variant={banDuration === option.value ? "default" : "outline"}
                    onClick={() => setBanDuration(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Причина блокировки"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateStatusMutation.isPending}
              onClick={() => setBlockOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={updateStatusMutation.isPending || !reason.trim()}
              onClick={() => applyStatus("blocked", reason)}
            >
              {updateStatusMutation.isPending ? "Сохранение…" : "Заблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unblockOpen}
        onOpenChange={(open) => {
          if (!updateStatusMutation.isPending) setUnblockOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Разблокировать пользователя?</DialogTitle>
            <DialogDescription>
              {user.email} снова сможет входить в систему и пользоваться
              платформой.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={updateStatusMutation.isPending}
              onClick={() => setUnblockOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              disabled={updateStatusMutation.isPending}
              onClick={() => applyStatus("active")}
            >
              {updateStatusMutation.isPending ? "Сохранение…" : "Разблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageFrame>
  )
}

function DealsTab({ user }: { user: AdminUserDetail }) {
  if (!user.contracts.length) {
    return (
      <PageSurface>
        <PageEmptyState
          title="Сделок пока нет"
          description="Контракты пользователя появятся здесь."
        />
      </PageSurface>
    )
  }

  return (
    <PageSurface>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead className="px-5">Сделка</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Вторая сторона</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead className="px-5">Этап</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="px-5 py-4">
                  <Link
                    href={`/admin/contracts/${contract.id}`}
                    className="font-bold text-foreground hover:underline"
                  >
                    {contract.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    БМ-{contract.id} · {formatDate(contract.created_at)}
                  </p>
                </TableCell>
                <TableCell>
                  {contract.role === "buyer" ? "Покупатель" : "Поставщик"}
                </TableCell>
                <TableCell>
                  {contract.counterparty_company_id ? (
                    <Link
                      href={`/admin/companies/${contract.counterparty_company_id}`}
                      className="underline underline-offset-2"
                    >
                      {contract.counterparty}
                    </Link>
                  ) : (
                    contract.counterparty
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  {formatMoneyDisplay(contract.agreed_amount, contract.currency)}
                </TableCell>
                <TableCell className="px-5">
                  {contract.has_dispute ? (
                    <Badge
                      variant="outline"
                      className="border-destructive/20 bg-destructive/10 text-destructive"
                    >
                      Спор
                    </Badge>
                  ) : (
                    <span className="text-sm">{contract.status}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="divide-y divide-border md:hidden">
        {user.contracts.map((contract) => (
          <li key={contract.id} className="space-y-1 p-4">
            <Link
              href={`/admin/contracts/${contract.id}`}
              className="font-bold hover:underline"
            >
              {contract.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              {contract.role === "buyer" ? "Покупатель" : "Поставщик"} ·{" "}
              {contract.counterparty}
            </p>
            <p className="text-sm tabular-nums">
              {formatMoneyDisplay(contract.agreed_amount, contract.currency)}
            </p>
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Всего за всё время: {user.stats.purchases_count + user.stats.sales_count}{" "}
        на {formatMoneyDisplay(user.stats.contracts_sum, "TJS")}.
      </p>
    </PageSurface>
  )
}

/** Where the person signs in from; a device shared with other accounts is marked. */
function DevicesTab({ userId }: { userId: number }) {
  const [deviceKey, setDeviceKey] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Устройства, с которых пользователь заходил на платформу. Если устройством пользуются
          и другие аккаунты, это отмечено.
        </p>
        <Button asChild variant="outline" size="sm">
          <AdminLink href={journalHref({ userId })}>Все действия пользователя</AdminLink>
        </Button>
      </div>
      <DevicesPanel userId={userId} compact onOpen={setDeviceKey} />
      <DeviceSheet deviceKey={deviceKey} onClose={() => setDeviceKey(null)} onOpenDevice={setDeviceKey} />
    </div>
  )
}

function HistoryTab({ items }: { items: AdminUserHistoryItem[] }) {
  if (!items.length) {
    return (
      <PageSurface>
        <PageEmptyState title="История пуста" description="Изменения появятся здесь." />
      </PageSurface>
    )
  }

  return (
    <PageSurface className="divide-y divide-border overflow-hidden p-0">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[150px_220px_1fr] sm:gap-4"
        >
          <span className="tabular-nums text-xs text-muted-foreground">
            {formatDateTime(item.created_at)}
          </span>
          <b
            className={cn(
              "font-semibold",
              /block|Ban|статус/i.test(historyTitle(item)) && "text-amber-800",
            )}
          >
            {historyTitle(item)}
          </b>
          <span className="text-foreground/80">{historyDetail(item)}</span>
        </div>
      ))}
      <p className="px-5 py-3 text-xs text-muted-foreground">
        Смена статуса и причины блокировки фиксируются в журнале.
      </p>
    </PageSurface>
  )
}

function ChatsTab({ user }: { user: AdminUserDetail }) {
  if (!user.chats.length) {
    return (
      <PageSurface>
        <PageEmptyState
          title="Переписок нет"
          description="Чаты по сделкам и заявкам появятся здесь."
        />
      </PageSurface>
    )
  }

  return (
    <div className="grid gap-2">
      {user.chats.map((chat) => (
        <Link
          key={chat.id}
          href={`/admin/chats?chat=${encodeURIComponent(chat.id)}`}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:border-foreground",
            chat.flagged
              ? "border-destructive/30 bg-destructive/5"
              : "border-border bg-card",
          )}
        >
          <span className="min-w-0 flex-1">
            <b className="text-[14.5px]">
              {chat.party_a} ↔ {chat.party_b}
            </b>
            <span className="block truncate text-[13px] text-muted-foreground">
              {chat.about} · {chat.last_text || chat.ref_label}
            </span>
          </span>
          {chat.flagged ? (
            <AlertTriangle className="text-destructive" size={20} aria-hidden="true" />
          ) : null}
        </Link>
      ))}
    </div>
  )
}

function DocsTab({ user }: { user: AdminUserDetail }) {
  const checklist = Object.entries(user.verification_checklist)
  const hasDocs = user.documents.length > 0 || checklist.length > 0

  if (!hasDocs) {
    return (
      <PageSurface>
        <PageEmptyState
          title="Документы не загружены"
          description={
            user.companies[0]
              ? "У основной компании пока нет файлов проверки."
              : "У пользователя нет компании."
          }
        />
      </PageSurface>
    )
  }

  return (
    <PageSurface className="space-y-5 p-5">
      {checklist.length > 0 && (
        <ul className="grid gap-2">
          {checklist.map(([key, complete]) => (
            <li
              key={key}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              <FileText size={16} className="text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">
                {checklistLabels[key] ?? key}
              </span>
              <Badge variant={complete ? "secondary" : "outline"}>
                {complete ? "Есть" : "Нет"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {user.documents.length > 0 && (
        <ul className="grid gap-2">
          {user.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              <FileText size={16} className="text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">{doc.title}</span>
              {doc.file_url ? (
                <a
                  href={resolveFileUrl(doc.file_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary"
                >
                  Открыть
                </a>
              ) : (
                <span className="text-muted-foreground">Нет файла</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </PageSurface>
  )
}
