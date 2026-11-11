"use client"

import {
  CircleNotchIcon as Loader2,
  ArrowsCounterClockwiseIcon as RefreshCcw,
  ListMagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr"
import { AdminLink } from "@/components/admin/admin-link"
import { DeviceIcon } from "@/components/admin/logs/device-chip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAdminDeviceQuery } from "@/hooks/api/use-admin-logs-query"
import {
  describeDevice,
  DEVICE_FLAG_LABELS,
  getClientReportRows,
  getCountryLabel,
  getDeviceKindLabel,
  getLogUserRoleLabel,
} from "@/lib/admin-log-labels"
import type { AdminDeviceDetail } from "@/lib/api/admin"

type DeviceSheetProps = {
  deviceKey: string | null
  onClose: () => void
  /** Opens another device (a similar one) in the same sheet. */
  onOpenDevice?: (deviceKey: string) => void
}

const formatWhen = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "—"

/** The journal filtered to one device, address or person. */
export const journalHref = (filter: { device?: string; ip?: string; userId?: number }) => {
  const params = new URLSearchParams({ view: "http", period: "all" })
  if (filter.device) params.set("device", filter.device)
  if (filter.ip) params.set("ip", filter.ip)
  if (filter.userId) params.set("user_id", String(filter.userId))
  return `/admin/logs?${params.toString()}`
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[150px_1fr] gap-3 py-2.5 text-sm">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="min-w-0 wrap-break-word text-foreground">{children}</dd>
  </div>
)

const SectionTitle = ({ id, children, hint }: { id: string; children: React.ReactNode; hint?: string }) => (
  <div className="mb-2">
    <h3 id={id} className="text-sm font-bold text-foreground">
      {children}
    </h3>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
)

const DeviceFlags = ({ device }: { device: AdminDeviceDetail }) => {
  const shared = device.identified && device.users_count > 1
  if (!shared && !device.is_bot && !device.automated && device.identified) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {shared && (
        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
          {DEVICE_FLAG_LABELS.shared}: {device.users_count}
        </Badge>
      )}
      {device.is_bot && (
        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
          Программа, а не человек
        </Badge>
      )}
      {device.automated && (
        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
          {DEVICE_FLAG_LABELS.automated}
        </Badge>
      )}
      {!device.identified && <Badge variant="outline">{DEVICE_FLAG_LABELS.unidentified}</Badge>}
    </div>
  )
}

const DeviceBody = ({
  device,
  onClose,
  onOpenDevice,
}: {
  device: AdminDeviceDetail
  onClose: () => void
  onOpenDevice?: (deviceKey: string) => void
}) => {
  const report = getClientReportRows(device.client)
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
            <DeviceIcon type={device.type} className="size-5 text-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">{describeDevice(device)}</p>
            <p className="text-sm text-muted-foreground">
              {[getDeviceKindLabel(device.type), device.model].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <DeviceFlags device={device} />
        {!device.identified && (
          <p className="mt-3 text-xs text-muted-foreground">
            Клиент не прислал идентификатор браузера, поэтому устройство определено по адресу и
            заголовкам запроса. Так выглядят скрипты, боты и обращения других серверов.
          </p>
        )}
        <Button asChild variant="outline" size="sm" className="mt-4">
          <AdminLink href={journalHref({ device: device.key })} onClick={onClose}>
            <ListMagnifyingGlassIcon aria-hidden="true" />
            Все действия с этого устройства
          </AdminLink>
        </Button>
      </div>

      <dl className="divide-y divide-border">
        <Row label="Первое появление">{formatWhen(device.first_seen_at)}</Row>
        <Row label="Последняя активность">{formatWhen(device.last_seen_at)}</Row>
        <Row label="Обращений">{device.requests_count.toLocaleString("ru-RU")}</Row>
        <Row label="Последний IP">
          {device.last_ip ? (
            <span className="tabular-nums">
              {device.last_ip}
              {getCountryLabel(device.country) && ` · ${getCountryLabel(device.country)}`}
            </span>
          ) : (
            "—"
          )}
        </Row>
        <Row label="Язык">{device.language ?? "—"}</Row>
        <Row label="Часовой пояс">{device.timezone ?? "—"}</Row>
        <Row label="Экран">{device.screen ?? "—"}</Row>
        <Row label="Идентификатор">
          <code className="text-xs break-all">{device.key}</code>
        </Row>
      </dl>

      <section aria-labelledby="device-users-title">
        <SectionTitle id="device-users-title">Аккаунты на этом устройстве</SectionTitle>
        {device.users.length === 0 ? (
          <p className="text-sm text-muted-foreground">С этого устройства никто не входил</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {device.users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <AdminLink
                    href={`/admin/users/${user.id}`}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                    onClick={onClose}
                  >
                    {user.name}
                  </AdminLink>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email} · {getLogUserRoleLabel(user.role)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  был {formatWhen(user.last_seen_at)} · {user.requests_count.toLocaleString("ru-RU")} обращ.
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="device-ips-title">
        <SectionTitle id="device-ips-title">IP-адреса</SectionTitle>
        {device.ips.length === 0 ? (
          <p className="text-sm text-muted-foreground">Адреса не записаны</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {device.ips.map((ip) => (
              <li key={ip.ip_address} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <AdminLink
                  href={journalHref({ ip: ip.ip_address })}
                  className="font-medium tabular-nums text-primary underline-offset-4 hover:underline"
                  onClick={onClose}
                >
                  {ip.ip_address}
                </AdminLink>
                <span className="text-xs text-muted-foreground">
                  {[getCountryLabel(ip.country), `был ${formatWhen(ip.last_seen_at)}`].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {device.similar.length > 0 && (
        <section aria-labelledby="device-similar-title">
          <SectionTitle
            id="device-similar-title"
            hint="Тот же экран, видеокарта и настройки, но другой идентификатор: так бывает после очистки браузера, в режиме инкогнито или в другом браузере. Два одинаковых ноутбука тоже совпадут."
          >
            Похожие устройства
          </SectionTitle>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {device.similar.map((other) => (
              <li key={other.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{describeDevice(other)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {other.users.length
                      ? other.users.map((user) => user.name).join(", ")
                      : "без входа в аккаунт"}{" "}
                    · был {formatWhen(other.last_seen_at)}
                  </p>
                </div>
                {onOpenDevice && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenDevice(other.key)}>
                    Открыть
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="device-report-title">
        <SectionTitle
          id="device-report-title"
          hint={
            device.reported_at
              ? `Обновлено ${formatWhen(device.reported_at)}`
              : undefined
          }
        >
          Что сообщил браузер
        </SectionTitle>
        {report.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Браузер ещё ничего не сообщал: известно только то, что видно из запросов.
          </p>
        ) : (
          <dl className="divide-y divide-border rounded-xl border border-border px-4">
            {report.map((row) => (
              <Row key={row.label} label={row.label}>
                {row.value}
              </Row>
            ))}
          </dl>
        )}
      </section>

      {device.user_agent && (
        <details className="rounded-xl border border-border">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-muted-foreground">
            Строка User-Agent
          </summary>
          <p className="border-t border-border bg-muted/30 p-4 text-xs leading-relaxed break-all">
            {device.user_agent}
          </p>
        </details>
      )}
    </div>
  )
}

export const DeviceSheet = ({ deviceKey, onClose, onOpenDevice }: DeviceSheetProps) => {
  const deviceQuery = useAdminDeviceQuery(deviceKey)

  return (
    <Sheet open={Boolean(deviceKey)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Устройство</SheetTitle>
          <SheetDescription>Что это за устройство, кто им пользовался и откуда</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6">
          {deviceQuery.isLoading && (
            <div className="flex min-h-60 items-center justify-center text-muted-foreground">
              <Loader2 className="animate-spin" aria-label="Загрузка устройства" />
            </div>
          )}
          {deviceQuery.isError && (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Не удалось загрузить устройство</p>
              <Button type="button" variant="outline" size="sm" onClick={() => deviceQuery.refetch()}>
                <RefreshCcw aria-hidden="true" />
                Повторить
              </Button>
            </div>
          )}
          {deviceQuery.data && (
            <DeviceBody device={deviceQuery.data} onClose={onClose} onOpenDevice={onOpenDevice} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
