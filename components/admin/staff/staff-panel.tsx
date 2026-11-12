"use client"

import { useEffect, useMemo, useState, Fragment} from "react"
import { ProhibitIcon as Ban, CopyIcon, PencilSimpleIcon as Pencil, PlusIcon as Plus, ArrowsCounterClockwiseIcon as RefreshCcw, MagnifyingGlassIcon as Search, UserCheckIcon as UserCheck, UserGearIcon as UserCog } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import {
  StaffFormDialog,
  type StaffFormDialogState,
} from "@/components/admin/staff/staff-form-dialog"
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
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminRolesQuery } from "@/hooks/api/use-admin-roles-query"
import {
  useAdminStaffQuery,
  useUpdateAdminStaffMutation,
} from "@/hooks/api/use-admin-staff-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import {
  canManageStaffMember,
  canManageStaffRole,
  getStaffRoleLabel,
} from "@/lib/admin-permissions"
import type { AdminStaffMember, AdminStaffStatus } from "@/lib/api/admin"
import { accessNote, type StaffCredentials } from "@/lib/staff-access"
import { useAuthStore } from "@/lib/store/auth-store"

const SEARCH_DEBOUNCE_MS = 300

const statusMetadata: Record<AdminStaffStatus, { label: string; className: string }> = {
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

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const getFullName = (member: AdminStaffMember) =>
  `${member.first_name} ${member.last_name}`.trim() || member.email

const StaffSkeleton = () => (
  <PageFrame className="animate-pulse" aria-label="Загрузка сотрудников">
    <div className="h-16 w-80 max-w-full rounded-xl bg-muted" />
    <div className="h-96 rounded-xl bg-muted" />
  </PageFrame>
)

export function AdminStaffPanel({ embedded = true }: { embedded?: boolean } = {}) {
  const Frame = embedded ? Fragment : PageFrame
  const user = useAuthStore((state) => state.user)
  const canCreate = useAdminPermission("admin_staff.create")
  const canUpdate = useAdminPermission("admin_staff.update")
  const [searchInput, setSearchInput] = useState("")
  const [query, setQuery] = useState("")
  const [dialogState, setDialogState] = useState<StaffFormDialogState>(null)
  const [statusTarget, setStatusTarget] = useState<AdminStaffMember | null>(null)
  // Shown once, right after somebody is added: the password is not kept anywhere to show again.
  const [created, setCreated] = useState<StaffCredentials | null>(null)

  const staffQuery = useAdminStaffQuery(query)
  const rolesQuery = useAdminRolesQuery(canCreate || canUpdate)
  const statusMutation = useUpdateAdminStaffMutation()

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const assignableRoles = useMemo(
    () => (rolesQuery.data?.items ?? []).filter((role) => role.is_active && canManageStaffRole(user, role.name)),
    [rolesQuery.data, user],
  )

  const nextStatus = statusTarget?.status === "blocked" ? "active" : "blocked"

  const handleStatusConfirm = async () => {
    if (!statusTarget) return
    try {
      await statusMutation.mutateAsync({
        userId: statusTarget.id,
        data: { status: nextStatus },
      })
      toast.success(nextStatus === "blocked" ? "Сотрудник заблокирован" : "Сотрудник разблокирован")
      setStatusTarget(null)
    } catch {
      // error toast via mutation onError
    }
  }

  if (staffQuery.isLoading) return <StaffSkeleton />

  if (staffQuery.isError || !staffQuery.data) {
    return (
      <div className="flex min-h-[55dvh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-destructive/20 bg-card p-8 text-center">
          <UserCog className="mx-auto text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold">Не удалось загрузить сотрудников</h1>
          <Button type="button" className="mt-5" onClick={() => staffQuery.refetch()}>
            <RefreshCcw aria-hidden="true" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const { items, total } = staffQuery.data

  return (
    <Frame>
      <PageHeader
        title="Сотрудники"
        description="Учётные записи панели управления и их роли"
        actions={
          canCreate && (
            <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
              <Plus aria-hidden="true" />
              Добавить сотрудника
            </Button>
          )
        }
      />

      <PageSurface>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Поиск по имени или email"
              aria-label="Поиск сотрудников"
              maxLength={255}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">Всего: {total}</p>
        </div>

        {items.length === 0 ? (
          <PageEmptyState
            icon={<UserCog aria-hidden="true" />}
            title={query ? "Никого не нашли" : "Сотрудников пока нет"}
            description={
              query
                ? "Попробуйте изменить запрос."
                : "Добавьте сотрудника и назначьте ему роль с нужными доступами."
            }
            action={
              !query && canCreate ? (
                <Button type="button" onClick={() => setDialogState({ mode: "create" })}>
                  <Plus aria-hidden="true" />
                  Добавить сотрудника
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35">
                  <TableHead className="px-5">Сотрудник</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="w-24 px-5 text-right">
                    <span className="sr-only">Действия</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((member) => {
                  const canManage = canUpdate && canManageStaffMember(user, member)
                  const isBlocked = member.status === "blocked"
                  const roleName = member.role_name ?? member.platform_role

                  return (
                    <TableRow key={member.id}>
                      <TableCell className="px-5 py-3">
                        <p className="font-semibold text-foreground">
                          {getFullName(member)}
                          {member.id === user?.userId && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">(вы)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{getStaffRoleLabel(roleName)}</p>
                        {member.role_description && (
                          <p className="line-clamp-1 max-w-64 text-xs text-muted-foreground">
                            {member.role_description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusMetadata[member.status].className}>
                          {statusMetadata[member.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(member.created_at)}
                      </TableCell>
                      <TableCell className="px-5 text-right">
                        {canManage && (
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setDialogState({ mode: "edit", member })}
                              aria-label={`Редактировать: ${getFullName(member)}`}
                              title="Редактировать"
                            >
                              <Pencil aria-hidden="true" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setStatusTarget(member)}
                              aria-label={`${isBlocked ? "Разблокировать" : "Заблокировать"}: ${getFullName(member)}`}
                              title={isBlocked ? "Разблокировать" : "Заблокировать"}
                              className={isBlocked ? undefined : "text-destructive hover:text-destructive"}
                            >
                              {isBlocked ? <UserCheck aria-hidden="true" /> : <Ban aria-hidden="true" />}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </PageSurface>

      <StaffFormDialog
        state={dialogState}
        roles={assignableRoles}
        onClose={() => setDialogState(null)}
        onCreated={setCreated}
      />

      <AlertDialog open={Boolean(created)} onOpenChange={(open) => !open && setCreated(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сотрудник добавлен</AlertDialogTitle>
            <AlertDialogDescription>
              Передайте эти данные {created?.name}. Пароль показан один раз: после закрытия окна
              его можно будет только заменить новым.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {created && (
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <dt className="text-muted-foreground">Роль</dt>
              <dd className="font-medium">{created.role}</dd>
              <dt className="text-muted-foreground">Вход</dt>
              <dd className="break-all">{`${window.location.origin}/admin/login`}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{created.email}</dd>
              <dt className="text-muted-foreground">Пароль</dt>
              <dd className="font-mono break-all" data-testid="new-staff-password">
                {created.password}
              </dd>
            </dl>
          )}
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!created) return
                void navigator.clipboard
                  ?.writeText(accessNote(created, window.location.origin))
                  .then(() => toast.success("Скопировано: можно вставить в сообщение"))
                  .catch(() => toast.error("Не удалось скопировать. Выделите текст вручную"))
              }}
            >
              <CopyIcon aria-hidden="true" />
              Скопировать сообщение для сотрудника
            </Button>
            <AlertDialogAction onClick={() => setCreated(null)}>Готово</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => {
          if (!open && !statusMutation.isPending) setStatusTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nextStatus === "blocked" ? "Заблокировать сотрудника?" : "Разблокировать сотрудника?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextStatus === "blocked"
                ? `${statusTarget ? getFullName(statusTarget) : ""} потеряет доступ к панели управления.`
                : `${statusTarget ? getFullName(statusTarget) : ""} снова сможет войти в панель управления.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={statusMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                handleStatusConfirm()
              }}
              disabled={statusMutation.isPending}
              className={
                nextStatus === "blocked"
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : undefined
              }
            >
              {nextStatus === "blocked" ? "Заблокировать" : "Разблокировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Frame>
  )
}
