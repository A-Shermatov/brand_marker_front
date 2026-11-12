"use client"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AdminPermissionBucket, AdminRoleMatrixRow } from "@/lib/api/admin"

export type RoleMatrixSelection = Record<string, Record<AdminPermissionBucket, boolean>>

const BUCKETS: Array<{ key: AdminPermissionBucket; label: string; hint: string }> = [
  { key: "read", label: "Просмотр", hint: "Видеть раздел и карточки" },
  { key: "write", label: "Изменение", hint: "Все действия раздела, кроме удаления" },
  { key: "delete", label: "Удаление", hint: "Удаление записей" },
]

export const selectionFromRows = (rows: AdminRoleMatrixRow[]): RoleMatrixSelection =>
  Object.fromEntries(
    rows.map((row) => [
      row.resource,
      { read: row.read.enabled, write: row.write.enabled, delete: row.delete.enabled },
    ]),
  )

export const permissionIdsFromSelection = (
  rows: AdminRoleMatrixRow[],
  selection: RoleMatrixSelection,
): number[] =>
  rows.flatMap((row) =>
    BUCKETS.flatMap(({ key }) => {
      const permissionId = row[key].permission_id
      return selection[row.resource]?.[key] && permissionId ? [permissionId] : []
    }),
  )

export const toggleMatrixCell = (
  selection: RoleMatrixSelection,
  resource: string,
  bucket: AdminPermissionBucket,
  checked: boolean,
): RoleMatrixSelection => {
  const current = selection[resource] ?? { read: false, write: false, delete: false }
  const next = { ...current, [bucket]: checked }
  if (checked && bucket !== "read") next.read = true
  if (!checked && bucket === "read") {
    next.write = false
    next.delete = false
  }
  return { ...selection, [resource]: next }
}

type RoleMatrixTableProps = {
  rows: AdminRoleMatrixRow[]
  selection: RoleMatrixSelection
  readOnly: boolean
  canGrant: (code: string | null) => boolean
  onToggle: (resource: string, bucket: AdminPermissionBucket, checked: boolean) => void
}

export const RoleMatrixTable = ({
  rows,
  selection,
  readOnly,
  canGrant,
  onToggle,
}: RoleMatrixTableProps) => (
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/35 hover:bg-muted/35">
        <TableHead className="px-5">Раздел</TableHead>
        {BUCKETS.map((bucket) => (
          <TableHead key={bucket.key} className="w-32 text-center" title={bucket.hint}>
            {bucket.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.resource}>
          <TableCell className="px-5 py-3">
            <p className="font-semibold text-foreground">{row.alias_ru}</p>
          </TableCell>
          {BUCKETS.map((bucket) => {
            const cell = row[bucket.key]
            const available = cell.permission_id !== null
            const checked = Boolean(selection[row.resource]?.[bucket.key])
            const disabled = readOnly || !available || (!checked && !canGrant(cell.code))

            if (!available) {
              return (
                <TableCell key={bucket.key} className="text-center text-muted-foreground/50">
                  <span aria-label={`${bucket.label}: недоступно для раздела`}>—</span>
                </TableCell>
              )
            }

            // What the saved role lacks inside a box that is ticked (and has not been touched since).
            const missing = checked && cell.enabled ? (cell.missing ?? []) : []
            return (
              <TableCell key={bucket.key} className="text-center">
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) => onToggle(row.resource, bucket.key, value === true)}
                  aria-label={`${row.alias_ru}: ${bucket.label}`}
                />
                {missing.length > 0 && (
                  <p className="mx-auto mt-1 max-w-28 text-[11px] leading-tight whitespace-normal text-muted-foreground">
                    кроме: {missing.join(", ")}
                  </p>
                )}
              </TableCell>
            )
          })}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
