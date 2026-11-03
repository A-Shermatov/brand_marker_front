"use client"

import { ArrowRightIcon as ArrowRight } from "@phosphor-icons/react/dist/ssr"
import { AdminLink } from "@/components/admin/admin-link"
import {
  getLogFieldLabel,
  getLogRelatedLinks,
  getLogResourceHref,
  getLogResourceTypeLabel,
} from "@/lib/admin-log-labels"

const VALUE_LIMIT = 300
const DIFF_KEYS = new Set(["before", "after", "changes"])

type Details = Record<string, unknown>

type ChangeRow = { key: string; before: unknown; after: unknown }

const isRecord = (value: unknown): value is Details =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const formatLogValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—"
  if (typeof value === "boolean") return value ? "Да" : "Нет"
  const text = typeof value === "object" ? JSON.stringify(value) : String(value)
  return text.length > VALUE_LIMIT ? `${text.slice(0, VALUE_LIMIT)}…` : text
}

const changeFromValue = (key: string, value: unknown): ChangeRow => {
  if (Array.isArray(value) && value.length === 2) {
    return { key, before: value[0], after: value[1] }
  }
  if (isRecord(value) && ("before" in value || "after" in value || "old" in value || "new" in value)) {
    return {
      key,
      before: "before" in value ? value.before : value.old,
      after: "after" in value ? value.after : value.new,
    }
  }
  return { key, before: undefined, after: value }
}

/** Normalizes `{before, after}` and `{changes}` detail shapes into a flat diff. */
export const getLogChanges = (details: Details): ChangeRow[] => {
  const rows: ChangeRow[] = []
  const before = isRecord(details.before) ? details.before : null
  const after = isRecord(details.after) ? details.after : null
  if (before || after) {
    const keys = Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]))
    keys.forEach((key) => rows.push({ key, before: before?.[key], after: after?.[key] }))
  }
  if (isRecord(details.changes)) {
    Object.entries(details.changes).forEach(([key, value]) => rows.push(changeFromValue(key, value)))
  } else if (Array.isArray(details.changes)) {
    details.changes.forEach((value, index) => {
      if (isRecord(value) && typeof value.field === "string") {
        rows.push({ key: value.field, before: value.before ?? value.old, after: value.after ?? value.new })
      } else {
        rows.push({ key: String(index + 1), before: undefined, after: value })
      }
    })
  }
  return rows
}

export const LogResourceLink = ({
  resourceType,
  resourceId,
}: {
  resourceType: string
  resourceId: string | null
}) => {
  const label = `${getLogResourceTypeLabel(resourceType)}${
    resourceId && resourceId !== "-" ? ` № ${resourceId}` : ""
  }`
  const href = getLogResourceHref(resourceType, resourceId)
  if (!href) return <span>{label}</span>
  return (
    <AdminLink
      href={href}
      className="font-medium text-primary underline-offset-4 hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      {label}
    </AdminLink>
  )
}

export const LogChangesTable = ({ changes }: { changes: ChangeRow[] }) => (
  <div className="overflow-hidden rounded-xl border border-border">
    <table className="w-full text-sm">
      <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
        <tr>
          <th className="px-3 py-2 font-medium">Поле</th>
          <th className="px-3 py-2 font-medium">Было</th>
          <th className="px-3 py-2 font-medium">Стало</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {changes.map((change) => (
          <tr key={change.key} className="align-top">
            <td className="px-3 py-2 text-muted-foreground">{getLogFieldLabel(change.key)}</td>
            <td className="px-3 py-2 wrap-break-word text-destructive/80 line-through decoration-destructive/40">
              {formatLogValue(change.before)}
            </td>
            <td className="px-3 py-2 wrap-break-word font-medium text-foreground">
              {formatLogValue(change.after)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

/** Compact one-line summary of a diff, e.g. «Статус: draft → active». */
export const LogChangesSummary = ({ details }: { details: Details }) => {
  const changes = getLogChanges(details)
  if (changes.length === 0) return null
  return (
    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {changes.slice(0, 3).map((change) => (
        <li key={change.key} className="flex flex-wrap items-center gap-1">
          <span>{getLogFieldLabel(change.key)}:</span>
          <span className="max-w-40 truncate">{formatLogValue(change.before)}</span>
          <ArrowRight className="size-3" aria-label="стало" />
          <span className="max-w-40 truncate text-foreground">{formatLogValue(change.after)}</span>
        </li>
      ))}
      {changes.length > 3 && <li>и ещё {changes.length - 3}</li>}
    </ul>
  )
}

export const LogEventDetailsBody = ({ details }: { details: Details }) => {
  const changes = getLogChanges(details)
  const related = getLogRelatedLinks(details)
  const relatedKeys = new Set(related.map((link) => link.key))
  const fields = Object.entries(details).filter(
    ([key]) => !DIFF_KEYS.has(key) && !relatedKeys.has(key),
  )
  const hasDetails = Object.keys(details).length > 0

  return (
    <div className="space-y-5">
      {changes.length > 0 && (
        <section aria-labelledby="log-changes-title">
          <h3 id="log-changes-title" className="mb-2 text-sm font-bold text-foreground">
            Изменения
          </h3>
          <LogChangesTable changes={changes} />
        </section>
      )}

      {(fields.length > 0 || related.length > 0) && (
        <section aria-labelledby="log-details-title">
          <h3 id="log-details-title" className="mb-2 text-sm font-bold text-foreground">
            Подробности
          </h3>
          <dl className="divide-y divide-border rounded-xl border border-border px-4">
            {related.map((link) => (
              <div key={link.key} className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
                <dt className="text-muted-foreground">{link.label}</dt>
                <dd className="min-w-0">
                  <AdminLink
                    href={link.href}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    № {link.value}
                  </AdminLink>
                </dd>
              </div>
            ))}
            {fields.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[140px_1fr] gap-3 py-2.5 text-sm">
                <dt className="text-muted-foreground">{getLogFieldLabel(key)}</dt>
                <dd className="min-w-0 wrap-break-word text-foreground">{formatLogValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {hasDetails ? (
        <details className="rounded-xl border border-border">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-muted-foreground">
            Исходные данные (JSON)
          </summary>
          <pre className="max-h-80 overflow-auto border-t border-border bg-muted/30 p-4 text-xs leading-relaxed">
            {JSON.stringify(details, null, 2)}
          </pre>
        </details>
      ) : (
        <p className="text-sm text-muted-foreground">Дополнительных данных нет</p>
      )}
    </div>
  )
}
