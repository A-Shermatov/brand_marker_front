"use client"

import { useState } from "react"
import Link from "next/link"
import { CrownIcon as Crown, CircleNotchIcon as Loader2, TrashIcon as Trash2, UserPlusIcon as UserPlus, UserCircleIcon as UserRound } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { CompanyConfirmDialog } from "@/components/admin/companies/company-confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useAdminCompanyAddMemberMutation,
  useAdminCompanyChangeOwnerMutation,
  useAdminCompanyRemoveMemberMutation,
  useAdminCompanyUpdateMemberMutation,
} from "@/hooks/api/use-admin-companies-query"
import { useAdminPermission } from "@/hooks/use-admin-permission"
import type { AdminCompanyDetail } from "@/lib/api/admin"
import {
  ADMIN_COMPANY_MEMBER_ROLE_LABELS,
  type AdminCompanyMemberRole,
} from "@/lib/api/admin-companies"

type Member = AdminCompanyDetail["members"][number]

const ASSIGNABLE_ROLES: AdminCompanyMemberRole[] = ["admin", "moderator", "accountant"]

const roleLabel = (role: string) => ADMIN_COMPANY_MEMBER_ROLE_LABELS[role] ?? role

const isOwner = (company: AdminCompanyDetail, member: Member) =>
  member.is_owner ?? member.user_id === company.owner.id

type OwnerTarget = { userId?: number; email?: string; label: string }

export const CompanyMembersManager = ({
  company,
  canManage,
}: {
  company: AdminCompanyDetail
  canManage: boolean
}) => {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<AdminCompanyMemberRole>("admin")
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null)
  const [ownerTarget, setOwnerTarget] = useState<OwnerTarget | null>(null)
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerReason, setOwnerReason] = useState("")

  const addMutation = useAdminCompanyAddMemberMutation()
  const updateMutation = useAdminCompanyUpdateMemberMutation()
  const removeMutation = useAdminCompanyRemoveMemberMutation()
  const ownerMutation = useAdminCompanyChangeOwnerMutation()
  const canViewUsers = useAdminPermission("admin_users.view")

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    try {
      await addMutation.mutateAsync({ companyId: company.id, email, role })
      toast.success("Участник добавлен")
      setEmail("")
    } catch {
      // MutationCache toast
    }
  }

  const handleRoleChange = async (member: Member, nextRole: AdminCompanyMemberRole) => {
    try {
      await updateMutation.mutateAsync({
        companyId: company.id,
        userId: member.user_id,
        role: nextRole,
      })
      toast.success("Роль обновлена")
    } catch {
      // MutationCache toast
    }
  }

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      await removeMutation.mutateAsync({ companyId: company.id, userId: removeTarget.user_id })
      toast.success("Участник удалён из компании")
      setRemoveTarget(null)
    } catch {
      // MutationCache toast
    }
  }

  const closeOwnerDialog = () => {
    setOwnerTarget(null)
    setOwnerReason("")
  }

  const handleOwnerChange = async () => {
    if (!ownerTarget) return
    try {
      await ownerMutation.mutateAsync({
        companyId: company.id,
        userId: ownerTarget.userId,
        email: ownerTarget.email,
        reason: ownerReason,
      })
      toast.success("Владелец компании изменён")
      setOwnerEmail("")
      closeOwnerDialog()
    } catch {
      // MutationCache toast
    }
  }

  return (
    <div className="space-y-5">
      {company.members.length ? (
        <div className="divide-y divide-border">
          {company.members.map((member) => {
            const owner = isOwner(company, member)
            return (
              <div
                key={member.id}
                className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                  {owner ? (
                    <Crown size={17} aria-hidden="true" />
                  ) : (
                    <UserRound size={17} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{member.name || member.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                    {canViewUsers ? (
                      <>
                        {" · "}
                        <Link
                          href={`/admin/users/${member.user_id}?tab=dossier`}
                          className="font-semibold text-primary hover:underline"
                        >
                          Досье
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                {owner ? (
                  <Badge>Владелец · {roleLabel(member.role)}</Badge>
                ) : canManage ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(next) =>
                        void handleRoleChange(member, next as AdminCompanyMemberRole)
                      }
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className="w-40" aria-label={`Роль ${member.email}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {member.role === "director" && (
                          <SelectItem value="director" disabled>
                            {roleLabel("director")}
                          </SelectItem>
                        )}
                        {ASSIGNABLE_ROLES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {roleLabel(option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setOwnerTarget({
                          userId: member.user_id,
                          label: member.name || member.email,
                        })
                      }
                    >
                      <Crown aria-hidden="true" />
                      Сделать владельцем
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Удалить ${member.email}`}
                      onClick={() => setRemoveTarget(member)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline">{roleLabel(member.role)}</Badge>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
          Участники не найдены.
        </div>
      )}

      {canManage && (
        <div className="grid gap-4 border-t border-border pt-5 lg:grid-cols-2">
          <form onSubmit={handleAdd} className="space-y-2">
            <Label htmlFor="company-member-email" className="text-sm font-semibold">
              Добавить участника
            </Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="company-member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email зарегистрированного пользователя"
                className="min-w-48 flex-1"
              />
              <Select
                value={role}
                onValueChange={(next) => setRole(next as AdminCompanyMemberRole)}
              >
                <SelectTrigger className="w-40" aria-label="Роль нового участника">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {roleLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={addMutation.isPending || !email.trim()}>
                {addMutation.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus aria-hidden="true" />
                )}
                Добавить
              </Button>
            </div>
          </form>
          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!ownerEmail.trim()) return
              setOwnerTarget({ email: ownerEmail.trim(), label: ownerEmail.trim() })
            }}
          >
            <Label htmlFor="company-owner-email" className="text-sm font-semibold">
              Передать владение
            </Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="company-owner-email"
                type="email"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                placeholder="Email нового владельца"
                className="min-w-48 flex-1"
              />
              <Button type="submit" variant="outline" disabled={!ownerEmail.trim()}>
                <Crown aria-hidden="true" />
                Сменить владельца
              </Button>
            </div>
          </form>
        </div>
      )}

      <CompanyConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
        title="Удалить участника?"
        description={
          removeTarget
            ? `${removeTarget.name || removeTarget.email} потеряет доступ к компании «${company.title}».`
            : ""
        }
        confirmLabel="Удалить"
        destructive
        pending={removeMutation.isPending}
        onConfirm={() => void handleRemove()}
      />

      <CompanyConfirmDialog
        open={Boolean(ownerTarget)}
        onOpenChange={(open) => {
          if (!open) closeOwnerDialog()
        }}
        title="Сменить владельца компании?"
        description={
          ownerTarget
            ? `Владельцем «${company.title}» станет ${ownerTarget.label}. ` +
              `Текущий владелец (${company.owner.name || company.owner.email}) останется ` +
              "в команде с ролью администратора."
            : ""
        }
        confirmLabel="Сменить владельца"
        destructive
        pending={ownerMutation.isPending}
        onConfirm={() => void handleOwnerChange()}
      >
        <div className="space-y-2">
          <Label htmlFor="company-owner-reason" className="text-sm font-semibold">
            Причина
          </Label>
          <Textarea
            id="company-owner-reason"
            value={ownerReason}
            onChange={(event) => setOwnerReason(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Попадёт в журнал действий и уведомление владельцам"
          />
        </div>
      </CompanyConfirmDialog>
    </div>
  )
}
