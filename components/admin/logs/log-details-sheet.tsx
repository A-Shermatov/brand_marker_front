"use client"

import { CircleNotchIcon as Loader2, ArrowsCounterClockwiseIcon as RefreshCcw } from "@phosphor-icons/react/dist/ssr"
import { AdminLink } from "@/components/admin/admin-link"
import { DeviceIcon } from "@/components/admin/logs/device-chip"
import { journalHref } from "@/components/admin/logs/device-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { LogEventDetailsBody, LogResourceLink } from "@/components/admin/logs/log-event-details"
import { useAdminLogQuery } from "@/hooks/api/use-admin-logs-query"
import {
  describeDevice,
  getCountryLabel,
  getDeviceKindLabel,
  getLogEventCategoryLabel,
  getLogEventLabel,
  getLogFieldLabel,
  getLogUserRoleLabel,
  LOG_KIND_LABELS,
  LOG_SECTION_LABELS,
  LOG_STATUS_META,
} from "@/lib/admin-log-labels"
import type {
  AdminLogDetail,
  AdminLogDeviceFull,
  AdminLogEventDetail,
  AdminLogPageDetail,
  AdminLogRelated,
  AdminLogTechnical,
  AdminLogUser,
} from "@/lib/api/admin"
import { formatCount } from "@/lib/format"
import { describePage, formatStay } from "@/lib/page-labels"

type LogDetailsSheetProps = {
  logId: number | null
  onClose: () => void
  /** Opens the device's own card (the sheet closes first). */
  onOpenDevice?: (deviceKey: string) => void
  /** Opens another row of the journal in this sheet. */
  onOpenLog?: (logId: number) => void
}

export const formatLogDateTime = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 wrap-break-word text-foreground">{children}</dd>
  </div>
)

const LogUserCell = ({ user, guestEmail }: { user: AdminLogUser | null; guestEmail?: string | null }) =>
  user ? (
    <>
      <AdminLink
        href={`/admin/users/${user.id}`}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        {user.name}
      </AdminLink>
      <p className="text-muted-foreground">{user.email}</p>
      <p className="text-muted-foreground">{getLogUserRoleLabel(user.role)}</p>
    </>
  ) : (
    <>
      <p className="font-semibold">{guestEmail === undefined ? "Система" : "Гость"}</p>
      {guestEmail && <p className="text-muted-foreground">Указан email: {guestEmail}</p>}
    </>
  )

const AddressRow = ({
  ip,
  country,
  onClose,
}: {
  ip: string | null
  country?: string | null
  onClose: () => void
}) => (
  <DetailRow label="IP-адрес">
    {ip ? (
      <>
        <AdminLink
          href={journalHref({ ip })}
          className="font-medium tabular-nums text-primary underline-offset-4 hover:underline"
          onClick={onClose}
        >
          {ip}
        </AdminLink>
        {getCountryLabel(country) && <span className="text-muted-foreground"> · {getCountryLabel(country)}</span>}
      </>
    ) : (
      "—"
    )}
  </DetailRow>
)

/** The device a row came from: what it is, and a way to its own card. */
const DeviceSection = ({
  device,
  onOpenDevice,
}: {
  device: AdminLogDeviceFull | null | undefined
  onOpenDevice?: (deviceKey: string) => void
}) => {
  if (!device) return null
  const deviceKey = device.key
  const facts = [
    device.screen && `экран ${device.screen}`,
    device.language && `язык ${device.language}`,
    device.timezone,
  ].filter(Boolean)
  return (
    <section aria-labelledby="log-device-title">
      <h3 id="log-device-title" className="mb-2 text-sm font-bold text-foreground">
        Устройство
      </h3>
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <DeviceIcon type={device.type} className="mt-0.5 size-5 text-muted-foreground" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-foreground">{describeDevice(device)}</p>
            <p className="text-muted-foreground">
              {[getDeviceKindLabel(device.type), device.model].filter(Boolean).join(" · ")}
            </p>
            {facts.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{facts.join(" · ")}</p>}
            {(device.users_count ?? 0) > 1 && device.identified && (
              <Badge variant="outline" className="mt-2 border-warning/30 bg-warning/10 text-warning">
                На устройстве {formatCount(device.users_count ?? 0, "аккаунт", "аккаунта", "аккаунтов")}
              </Badge>
            )}
            {!device.identified && (
              <p className="mt-1 text-xs text-muted-foreground">
                Без идентификатора браузера: определено по адресу и заголовкам
              </p>
            )}
          </div>
        </div>
        {deviceKey && onOpenDevice && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => onOpenDevice(deviceKey)}
          >
            Открыть карточку устройства
          </Button>
        )}
      </div>
    </section>
  )
}

const queryText = (query: Record<string, unknown>) =>
  Object.entries(query)
    .map(([key, value]) => `${key}=${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join("&")

/** The raw side of a row: what an engineer asks for when something has to be traced. */
const TechnicalSection = ({ technical }: { technical: AdminLogTechnical | undefined }) => {
  if (!technical) return null
  const query = queryText(technical.query ?? {})
  const rows: [string, React.ReactNode][] = [
    ["Запрос", [technical.method, technical.path].filter(Boolean).join(" ") || null],
    ["Параметры", query || null],
    ["Код ответа", technical.status_code],
    ["Время ответа", technical.duration_ms === null ? null : `${technical.duration_ms} мс`],
    ["Номер запроса", technical.request_id],
    ["Посещение", technical.visit],
    ["User-Agent", technical.user_agent],
  ]
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== "")
  if (shown.length === 0) return null
  return (
    <details className="rounded-xl border border-border">
      <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-muted-foreground">
        Технические данные
      </summary>
      <dl className="divide-y divide-border border-t border-border px-4">
        {shown.map(([label, value]) => (
          <DetailRow key={label} label={label}>
            <span className="text-xs break-all">{value}</span>
          </DetailRow>
        ))}
      </dl>
    </details>
  )
}

const relatedLabel = (item: AdminLogRelated) => {
  if (item.source === "http") return "Обращение к платформе"
  if (item.source === "page") return "Открытая страница"
  return getLogEventLabel(item.action)
}

/** Other rows written while the same request was served. */
const RelatedSection = ({
  related,
  onOpenLog,
}: {
  related: AdminLogRelated[] | undefined
  onOpenLog?: (logId: number) => void
}) => {
  if (!related?.length) return null
  return (
    <section aria-labelledby="log-related-title">
      <h3 id="log-related-title" className="mb-2 text-sm font-bold text-foreground">
        Записано тем же запросом
      </h3>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {related.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <span className="min-w-0 truncate text-foreground">{relatedLabel(item)}</span>
            {onOpenLog && (
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenLog(item.id)}>
                Открыть
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

type SharedProps = Pick<LogDetailsSheetProps, "onClose" | "onOpenDevice" | "onOpenLog">

const EventLogDetails = ({ log, onClose, onOpenDevice, onOpenLog }: { log: AdminLogEventDetail } & SharedProps) => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border p-4">
      <p className="text-base font-bold text-foreground">{getLogEventLabel(log.action)}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {getLogEventCategoryLabel(log.category)} · <code className="text-xs">{log.action}</code>
      </p>
      {log.details.new_device === true && (
        <Badge variant="outline" className="mt-2 border-warning/30 bg-warning/10 text-warning">
          Вход с нового устройства
        </Badge>
      )}
    </div>

    <dl className="divide-y divide-border">
      <DetailRow label="Когда">{formatLogDateTime(log.created_at)}</DetailRow>
      <DetailRow label="Кто">
        <LogUserCell user={log.user} />
        {log.actor_id && <p className="text-muted-foreground">Профиль № {log.actor_id}</p>}
      </DetailRow>
      <DetailRow label="Объект">
        <LogResourceLink resourceType={log.resource_type} resourceId={log.resource_id} />
      </DetailRow>
      {log.company_id && (
        <DetailRow label="Компания">
          <LogResourceLink resourceType="company" resourceId={String(log.company_id)} />
        </DetailRow>
      )}
      <AddressRow ip={log.ip_address} country={log.country} onClose={onClose} />
    </dl>

    <DeviceSection device={log.device} onOpenDevice={onOpenDevice} />
    <LogEventDetailsBody details={log.details} />
    <RelatedSection related={log.related} onOpenLog={onOpenLog} />
    <TechnicalSection
      technical={log.technical ?? { ...EMPTY_TECHNICAL, user_agent: log.user_agent }}
    />
  </div>
)

const EMPTY_TECHNICAL: AdminLogTechnical = {
  method: null,
  path: null,
  query: {},
  status_code: null,
  duration_ms: null,
  request_id: null,
  visit: null,
  user_agent: null,
}

const PageLogDetails = ({ log, onClose, onOpenDevice, onOpenLog }: { log: AdminLogPageDetail } & SharedProps) => {
  const page = describePage(log.path)
  const query = queryText(log.query ?? {})
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-medium text-muted-foreground">{page.area}</p>
        <p className="text-base font-bold text-foreground">
          {[page.name, page.detail].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-xs break-all text-muted-foreground">
          {log.path}
          {query && `?${query}`}
        </p>
      </div>

      <dl className="divide-y divide-border">
        <DetailRow label="Когда">{formatLogDateTime(log.created_at)}</DetailRow>
        <DetailRow label="Кто">
          <LogUserCell user={log.user} guestEmail={null} />
        </DetailRow>
        <DetailRow label="Пробыл на странице">
          {log.seconds === null ? (
            <span className="text-muted-foreground">ещё не ушёл или закрыл вкладку</span>
          ) : (
            <>
              {formatStay(log.seconds)}
              {log.active_seconds !== null && log.active_seconds < log.seconds && (
                <span className="text-muted-foreground">
                  {" "}
                  · из них на экране {formatStay(log.active_seconds)}
                </span>
              )}
            </>
          )}
        </DetailRow>
        {log.title && <DetailRow label="Заголовок">{log.title}</DetailRow>}
        {log.referrer && <DetailRow label="Откуда пришёл">{log.referrer}</DetailRow>}
        <AddressRow ip={log.ip_address} country={log.country} onClose={onClose} />
      </dl>

      <DeviceSection device={log.device} onOpenDevice={onOpenDevice} />
      <RelatedSection related={log.related} onOpenLog={onOpenLog} />
      <TechnicalSection technical={log.technical} />
    </div>
  )
}

const HttpLogDetails = ({ log, onClose, onOpenDevice, onOpenLog }: { log: AdminLogDetail } & SharedProps) => (
  <div className="space-y-6">
    <div className="rounded-xl border border-border p-4">
      <Badge variant="outline" className={LOG_STATUS_META[log.status].className}>
        {LOG_STATUS_META[log.status].label}
      </Badge>
      <p className="mt-2 text-sm text-muted-foreground">{LOG_STATUS_META[log.status].hint}</p>
      {log.repeats > 0 && (
        <p className="mt-2 text-sm text-foreground">
          Повторилось ещё {formatCount(log.repeats, "раз", "раза", "раз")}
          {log.repeated_until && `, последний — ${formatLogDateTime(log.repeated_until)}`}. Одинаковые
          обращения подряд записываются одной строкой.
        </p>
      )}
    </div>

    <dl className="divide-y divide-border">
      <DetailRow label="Когда">{formatLogDateTime(log.created_at)}</DetailRow>
      <DetailRow label="Кто">
        <LogUserCell user={log.user} guestEmail={log.guest_email} />
      </DetailRow>
      <DetailRow label="Действие">{LOG_KIND_LABELS[log.kind]}</DetailRow>
      <DetailRow label="Раздел">{LOG_SECTION_LABELS[log.section]}</DetailRow>
      <DetailRow label="Объект">{log.object_id ? `№ ${log.object_id}` : "—"}</DetailRow>
      <AddressRow ip={log.ip_address} country={log.country} onClose={onClose} />
    </dl>

    <DeviceSection device={log.device} onOpenDevice={onOpenDevice} />

    <section aria-labelledby="log-fields-title">
      <h3 id="log-fields-title" className="text-sm font-bold text-foreground">
        Переданные данные
      </h3>
      {log.fields.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Данные не передавались</p>
      ) : (
        <dl className="mt-2 divide-y divide-border rounded-xl border border-border px-4">
          {log.fields.map((field) => (
            <DetailRow key={field.key} label={getLogFieldLabel(field.key)}>
              {field.hidden ? (
                <span className="text-muted-foreground italic">скрыто</span>
              ) : (
                field.value || "—"
              )}
            </DetailRow>
          ))}
        </dl>
      )}
    </section>

    <RelatedSection related={log.related} onOpenLog={onOpenLog} />
    <TechnicalSection technical={log.technical} />
  </div>
)

export const LogDetailsSheet = ({ logId, onClose, onOpenDevice, onOpenLog }: LogDetailsSheetProps) => {
  const logQuery = useAdminLogQuery(logId)
  const log = logQuery.data
  const shared = { onClose, onOpenDevice, onOpenLog }

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Sheet open={Boolean(logId)} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Подробности записи</SheetTitle>
          <SheetDescription>Кто, когда, что и с какого устройства сделал на платформе</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {logQuery.isLoading && (
            <div className="flex min-h-60 items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin" aria-label="Загрузка записи" />
            </div>
          )}

          {logQuery.isError && (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Не удалось загрузить запись</p>
              <Button type="button" variant="outline" size="sm" onClick={() => logQuery.refetch()}>
                <RefreshCcw aria-hidden="true" />
                Повторить
              </Button>
            </div>
          )}

          {log?.source === "event" && <EventLogDetails log={log} {...shared} />}
          {log?.source === "page" && <PageLogDetails log={log} {...shared} />}
          {log?.source === "http" && <HttpLogDetails log={log} {...shared} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
