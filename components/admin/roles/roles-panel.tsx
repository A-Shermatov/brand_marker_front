"use client"

import { useEffect, useMemo, useState, Fragment} from "react"
import { KeyIcon as KeyRound, CircleNotchIcon as Loader2, LockIcon as Lock, PencilSimpleIcon as Pencil, PlusIcon as Plus, ArrowsCounterClockwiseIcon as RefreshCcw, TrashIcon as Trash2, ArrowUUpLeftIcon as Undo2 } from "@phosphor-icons/react/dist/ssr"
import {
  RoleFormDialog,
  type RoleFormDialogState,
} from "@/components/admin/roles/role-form-dialog"
import {
  permissionIdsFromSelection,
  RoleMatrixTable,
  selectionFromRows,
  toggleMatrixCell,
  type RoleMatrixSelection,
} from "@/components/admin/roles/role-matrix-table"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useAdminRoleMatrixQuery,
  useAdminRolesQuery,
  useDeleteAdminRoleMutation,
  useUpdateAdminRoleMatrixMutation,
} from "@/hooks/api/use-admin-roles-query"
import {
  canManageStaffRole,
  getStaffRoleLabel,
  hasPermission,
} from "@/lib/admin-permissions"
import type { AdminPermissionBucket, AdminRole } from "@/lib/api/admin"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const RolesSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка ролей">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="h-96 rounded-xl bg-muted" />
      <div className="h-96 rounded-xl bg-muted" />
    </div>
  </PageFrame>
)

const RoleListItem = ({
  role,
  selected,
  onSelect,
}: {
  role: AdminRole
  selected: boolean
  onSelect: (roleId: number) => void
}) => (
  <li>
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "w-full rounded-lg px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected && "bg-secondary",
        !selected && "hover:bg-secondary/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-bold text-foreground">{getStaffRoleLabel(role.name)}</p>
        {role.is_system && <Badge variant="outline">Системная</Badge>}
      </div>
      {role.description && (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{role.description}</p>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">Сотрудников: {role.users_count}</p>
    </button>
  </li>
)

const RoleMatrixPanel = ({
  role,
  onEdit,
  onDelete,
}: {
  role: AdminRole
  onEdit: (role: AdminRole) => void
  onDelete: (role: AdminRole) => void
}) => {
  const user = useAuthStore((state) => state.user)
  const matrixQuery = useAdminRoleMatrixQuery(role.id)
  const saveMutation = useUpdateAdminRoleMatrixMutation()
  const [selection, setSelection] = useState<RoleMatrixSelection>({})

  const rows = useMemo(() => matrixQuery.data?.rows ?? [], [matrixQuery.data])
  const initialSelection = useMemo(() => selectionFromRows(rows), [rows])

  useEffect(() => {
    setSelection(initialSelection)
  }, [initialSelection])

  const isOwnRole = user?.staffRoleId === role.id
  const canManage = canManageStaffRole(user, role.name) && !isOwnRole
  const isDirty = JSON.stringify(selection) !== JSON.stringify(initialSelection)

  const canGrant = (code: string | null) => Boolean(code) && hasPermission(user, code as string)

  const handleToggle = (resource: string, bucket: AdminPermissionBucket, checked: boolean) => {
    setSelection((current) => toggleMatrixCell(current, resource, bucket, checked))
  }

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        roleId: role.id,
        permissionIds: permissionIdsFromSelection(rows, selection),
      })
    } catch {
      // error toast via mutation onError
    }
  }

  const readOnlyReason = isOwnRole
    ? "Это ваша роль — её права может изменить только сотрудник с более высокой ролью."
    : !canManage
      ? "Права этой роли может изменить только суперадминистратор."
      : null

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-bold text-foreground">
              {getStaffRoleLabel(role.name)}
            </h2>
            {role.is_system && <Badge variant="outline">Системная</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {role.description || "Без описания"}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onEdit(role)}>
              <Pencil aria-hidden="true" />
              Изменить
            </Button>
            {!role.is_system && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={role.users_count > 0}
                title={role.users_count > 0 ? "Роль назначена сотрудникам" : undefined}
                onClick={() => onDelete(role)}
              >
                <Trash2 aria-hidden="true" />
                Удалить
              </Button>
            )}
          </div>
        )}
      </div>

      {readOnlyReason && (
        <p className="flex items-center gap-2 border-b border-border bg-muted/40 px-5 py-3 text-sm text-muted-foreground">
          <Lock size={15} aria-hidden="true" />
          {readOnlyReason}
        </p>
      )}

      {matrixQuery.isLoading && (
        <div className="flex min-h-80 items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin" aria-label="Загрузка прав" />
        </div>
      )}

      {matrixQuery.isError && (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">Не удалось загрузить права роли</p>
          <Button type="button" variant="outline" size="sm" onClick={() => matrixQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      )}

      {matrixQuery.data && (
        <>
          <div className="overflow-x-auto">
            <RoleMatrixTable
              rows={rows}
              selection={selection}
              readOnly={!canManage || saveMutation.isPending}
              canGrant={canGrant}
              onToggle={handleToggle}
            />
          </div>
          {canManage && (
            <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                «Изменение» и «Удаление» автоматически включают «Просмотр». Изменения
                применяются к сотрудникам сразу после сохранения.
              </p>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || saveMutation.isPending}
                  onClick={() => setSelection(initialSelection)}
                >
                  <Undo2 aria-hidden="true" />
                  Сбросить
                </Button>
                <Button
                  type="button"
                  disabled={!isDirty || saveMutation.isPending}
                  onClick={handleSave}
                >
                  {saveMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function AdminRolesPanel({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const rolesQuery = useAdminRolesQuery()
  const deleteMutation = useDeleteAdminRoleMutation()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [dialogState, setDialogState] = useState<RoleFormDialogState>(null)
  const [deleting, setDeleting] = useState<AdminRole | null>(null)

  const roles = useMemo(() => rolesQuery.data?.items ?? [], [rolesQuery.data])
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null

  const handleDeleteConfirm = async () => {
    if (!deleting) return
    try {
      await deleteMutation.mutateAsync(deleting.id)
      toast.success("Роль удалена")
      setDeleting(null)
      setSelectedRoleId(null)
    } catch {
      // error toast via mutation onError
    }
  }

  if (rolesQuery.isLoading) return <RolesSkeleton />

  if (rolesQuery.isError || !rolesQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <KeyRound className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить роли</h1>
          <Button type="button" className="mt-5" onClick={() => rolesQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Frame>
      {!embedded && (
        <PageHeader
          title="Роли и доступы"
          description="Какие разделы панели управления видит и может изменять каждая роль сотрудников"
          actions={
            <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
              <Plus aria-hidden="true" />
              Создать роль
            </Button>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <PageSurface className="self-start">
          <ul className="space-y-1 p-2" aria-label="Роли сотрудников">
            {roles.map((role) => (
              <RoleListItem
                key={role.id}
                role={role}
                selected={role.id === selectedRole?.id}
                onSelect={setSelectedRoleId}
              />
            ))}
          </ul>
        </PageSurface>

        <PageSurface>
          {selectedRole ? (
            <RoleMatrixPanel
              key={selectedRole.id}
              role={selectedRole}
              onEdit={(role) => setDialogState({ mode: "edit", role })}
              onDelete={setDeleting}
            />
          ) : (
            <PageEmptyState
              title="Ролей пока нет"
              description="Создайте первую роль, чтобы настроить доступ сотрудников."
            />
          )}
        </PageSurface>
      </div>

      <RoleFormDialog
        state={dialogState}
        onClose={() => setDialogState(null)}
        onCreated={(role) => setSelectedRoleId(role.id)}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить роль?</AlertDialogTitle>
            <AlertDialogDescription>
              Роль «{deleting ? getStaffRoleLabel(deleting.name) : ""}» будет удалена. Это
              действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  )
}
