"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateAdminStaffMutation,
  useUpdateAdminStaffMutation,
} from "@/hooks/api/use-admin-staff-query"
import { getStaffRoleLabel } from "@/lib/admin-permissions"
import type { AdminRole, AdminStaffMember, AdminStaffUpdateInput } from "@/lib/api/admin"

const baseSchema = {
  first_name: z.string().trim().min(1, "Введите имя").max(100, "Не более 100 символов"),
  last_name: z.string().trim().min(1, "Введите фамилию").max(100, "Не более 100 символов"),
  phone: z.string().trim().max(50, "Не более 50 символов"),
  role_id: z.string().min(1, "Выберите роль"),
}

const createSchema = z.object({
  ...baseSchema,
  email: z.string().trim().min(1, "Введите email").email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов").max(128, "Не более 128 символов"),
})

const editSchema = z.object({
  ...baseSchema,
  email: z.string(),
  password: z
    .string()
    .max(128, "Не более 128 символов")
    .refine((value) => value === "" || value.length >= 8, "Минимум 8 символов"),
})

type StaffFormValues = z.infer<typeof createSchema>

export type StaffFormDialogState = { mode: "create" } | { mode: "edit"; member: AdminStaffMember } | null

type StaffFormDialogProps = {
  state: StaffFormDialogState
  roles: AdminRole[]
  onClose: () => void
}

const EMPTY_VALUES: StaffFormValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role_id: "",
  password: "",
}

const FieldError = ({ id, message }: { id: string; message?: string }) => {
  if (!message) return null
  return (
    <p id={id} className="text-xs font-medium text-destructive">
      {message}
    </p>
  )
}

export const StaffFormDialog = ({ state, roles, onClose }: StaffFormDialogProps) => {
  const createMutation = useCreateAdminStaffMutation()
  const updateMutation = useUpdateAdminStaffMutation()
  const isPending = createMutation.isPending || updateMutation.isPending
  const editing = state?.mode === "edit" ? state.member : null

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(editing ? editSchema : createSchema),
    defaultValues: EMPTY_VALUES,
  })

  const roleOptions = useMemo(() => {
    if (!editing?.role_id || roles.some((role) => role.id === editing.role_id)) return roles
    return [
      ...roles,
      {
        id: editing.role_id,
        name: editing.role_name ?? "",
        description: editing.role_description,
        is_system: false,
        is_active: true,
        users_count: 0,
      },
    ]
  }, [editing, roles])

  useEffect(() => {
    if (!state) return
    if (!editing) {
      reset(EMPTY_VALUES)
      return
    }
    reset({
      email: editing.email,
      first_name: editing.first_name,
      last_name: editing.last_name,
      phone: editing.phone ?? "",
      role_id: editing.role_id ? String(editing.role_id) : "",
      password: "",
    })
  }, [editing, reset, state])

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) onClose()
  }

  const handleSave = async (values: StaffFormValues) => {
    const roleId = Number(values.role_id)
    const phone = values.phone || null
    try {
      if (editing) {
        const data: AdminStaffUpdateInput = {
          first_name: values.first_name,
          last_name: values.last_name,
          phone,
        }
        if (roleId !== editing.role_id) data.role_id = roleId
        if (values.password) data.password = values.password
        await updateMutation.mutateAsync({ userId: editing.id, data })
        toast.success("Сотрудник сохранён")
      } else {
        await createMutation.mutateAsync({
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          phone,
          password: values.password,
          role_id: roleId,
        })
        toast.success("Сотрудник создан")
      }
      onClose()
    } catch {
      // error toast via mutation onError
    }
  }

  return (
    <Dialog open={Boolean(state)} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(handleSave)} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать сотрудника" : "Новый сотрудник"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Доступ к разделам определяется ролью сотрудника."
                : "Сотрудник сможет войти в панель управления с этим email и паролем."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              autoComplete="off"
              maxLength={255}
              readOnly={Boolean(editing)}
              className={editing ? "bg-muted text-muted-foreground" : undefined}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "staff-email-error" : undefined}
              {...register("email")}
            />
            <FieldError id="staff-email-error" message={errors.email?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">Имя</Label>
              <Input
                id="staff-first-name"
                maxLength={100}
                aria-invalid={Boolean(errors.first_name)}
                aria-describedby={errors.first_name ? "staff-first-name-error" : undefined}
                {...register("first_name")}
              />
              <FieldError id="staff-first-name-error" message={errors.first_name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Фамилия</Label>
              <Input
                id="staff-last-name"
                maxLength={100}
                aria-invalid={Boolean(errors.last_name)}
                aria-describedby={errors.last_name ? "staff-last-name-error" : undefined}
                {...register("last_name")}
              />
              <FieldError id="staff-last-name-error" message={errors.last_name?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-phone">Телефон</Label>
            <Input
              id="staff-phone"
              type="tel"
              maxLength={50}
              placeholder="Необязательно"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "staff-phone-error" : undefined}
              {...register("phone")}
            />
            <FieldError id="staff-phone-error" message={errors.phone?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-role">Роль</Label>
            <Controller
              control={control}
              name="role_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="staff-role"
                    className="w-full"
                    aria-invalid={Boolean(errors.role_id)}
                    aria-describedby={errors.role_id ? "staff-role-error" : undefined}
                  >
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {getStaffRoleLabel(role.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {roleOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Нет ролей, которые вы можете назначить. Создайте роль в разделе «Роли и доступы».
              </p>
            )}
            <FieldError id="staff-role-error" message={errors.role_id?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-password">{editing ? "Новый пароль" : "Пароль"}</Label>
            <Input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              maxLength={128}
              placeholder={editing ? "Оставьте пустым, чтобы не менять" : "Минимум 8 символов"}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "staff-password-error" : undefined}
              {...register("password")}
            />
            <FieldError id="staff-password-error" message={errors.password?.message} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
