"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateAdminRoleMutation,
  useUpdateAdminRoleMutation,
} from "@/hooks/api/use-admin-roles-query"
import type { AdminRole } from "@/lib/api/admin"

const roleFormSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(100, "Не более 100 символов"),
  description: z.string().trim().max(500, "Не более 500 символов"),
})

type RoleFormValues = z.infer<typeof roleFormSchema>

export type RoleFormDialogState = { mode: "create" } | { mode: "edit"; role: AdminRole } | null

type RoleFormDialogProps = {
  state: RoleFormDialogState
  onClose: () => void
  onCreated: (role: AdminRole) => void
}

export const RoleFormDialog = ({ state, onClose, onCreated }: RoleFormDialogProps) => {
  const createMutation = useCreateAdminRoleMutation()
  const updateMutation = useUpdateAdminRoleMutation()
  const isPending = createMutation.isPending || updateMutation.isPending
  const editing = state?.mode === "edit" ? state.role : null

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (!state) return
    reset({
      name: editing?.name ?? "",
      description: editing?.description ?? "",
    })
  }, [editing, reset, state])

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) onClose()
  }

  const handleSave = async (values: RoleFormValues) => {
    const description = values.description || null
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          roleId: editing.id,
          data: editing.is_system ? { description } : { name: values.name, description },
        })
        toast.success("Роль сохранена")
      } else {
        const role = await createMutation.mutateAsync({ name: values.name, description })
        toast.success("Роль создана")
        onCreated(role)
      }
      onClose()
    } catch {
      // error toast via mutation onError
    }
  }

  return (
    <Dialog open={Boolean(state)} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(handleSave)} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать роль" : "Новая роль"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Права доступа настраиваются в матрице справа."
                : "После создания отметьте в матрице разделы, доступные роли."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="role-name">Название</Label>
            <Input
              id="role-name"
              maxLength={100}
              placeholder="Например, Модератор споров"
              readOnly={editing?.is_system}
              className={editing?.is_system ? "bg-muted text-muted-foreground" : undefined}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "role-name-error" : undefined}
              autoFocus={!editing?.is_system}
              {...register("name")}
            />
            {editing?.is_system && (
              <p className="text-xs text-muted-foreground">Системную роль нельзя переименовать</p>
            )}
            {errors.name && (
              <p id="role-name-error" className="text-xs font-medium text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-description">Описание</Label>
            <Textarea
              id="role-description"
              rows={3}
              maxLength={500}
              placeholder="Кому и для чего нужна эта роль"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? "role-description-error" : undefined}
              {...register("description")}
            />
            {errors.description && (
              <p id="role-description-error" className="text-xs font-medium text-destructive">
                {errors.description.message}
              </p>
            )}
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
