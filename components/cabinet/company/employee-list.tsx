"use client"

import { useState } from "react"
import { TrashIcon as Trash2, UsersIcon as Users } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ASSIGNABLE_COMPANY_ROLES,
  COMPANY_ROLE_LABELS,
  SIDE_ROLE_OPTIONS,
  TEAM_SIDE_LABELS,
  companyRoleLabel,
  initialsFromName,
  sideRoleLabel,
  type CompanyTeamEmployee,
  type TeamSideKey,
} from "@/lib/company-team"
import type { CompanyRole, SideRole } from "@/types"

type EmployeeListProps = {
  employees: CompanyTeamEmployee[]
  canManage: boolean
  busy?: boolean
  onInviteClick?: () => void
  onChangeRole: (userId: number, role: CompanyRole) => void
  onRemove: (userId: number) => void
  /** The company buys and sells: show access to each side. */
  sides?: TeamSideKey[]
  onChangeSideRole?: (userId: number, side: TeamSideKey, role: SideRole | null) => void
}

export const EmployeeList = ({
  employees,
  canManage,
  busy = false,
  onInviteClick,
  onChangeRole,
  onRemove,
  sides = [],
  onChangeSideRole,
}: EmployeeListProps) => {
  const twoSided = sides.length > 1
  const [removeTarget, setRemoveTarget] = useState<CompanyTeamEmployee | null>(
    null,
  )

  const confirmRemove = () => {
    if (!removeTarget) return
    onRemove(removeTarget.userId)
    setRemoveTarget(null)
  }

  if (employees.length === 0) {
    return (
      <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-line-strong bg-canvas/40 px-5 py-10 text-center">
        <Users className="size-7 text-mute" aria-hidden />
        <div>
          <b className="text-[15px]">В команде пока никого</b>
          <p className="mt-1 text-[13.5px] text-mute">
            Добавьте сотрудника по email — он должен быть зарегистрирован на
            площадке.
          </p>
        </div>
        {canManage && onInviteClick ? (
          <Button
            type="button"
            size="sm"
            className="mt-1"
            onClick={onInviteClick}
            disabled={busy}
          >
            Добавить сотрудника
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {employees.map((employee) => {
          const isDirector = employee.role === "director"
          const canEdit = canManage && !employee.me && !isDirector
          return (
            <li
              key={employee.membershipId}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted text-[13px] font-bold text-ink">
                  {initialsFromName(employee.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-snug">
                    {employee.name}
                    {employee.me ? (
                      <span className="ml-1 text-[12.5px] font-normal text-mute">
                        (вы)
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 break-all text-[13px] leading-snug text-mute">
                    {employee.email}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-1.5 sm:w-[220px] sm:shrink-0 sm:items-end">
                {canEdit ? (
                  <>
                    <label
                      className="sr-only"
                      htmlFor={`er-${employee.userId}`}
                    >
                      Роль
                    </label>
                    <select
                      id={`er-${employee.userId}`}
                      value={employee.role}
                      disabled={busy}
                      onChange={(e) =>
                        onChangeRole(
                          employee.userId,
                          e.target.value as CompanyRole,
                        )
                      }
                      className="h-9 w-full rounded-lg border border-line bg-card px-3 text-[14px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 disabled:opacity-60 sm:w-[200px]"
                    >
                      {ASSIGNABLE_COMPANY_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {COMPANY_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <p className="text-[14px] font-semibold sm:text-right">
                    {companyRoleLabel(employee.role)}
                  </p>
                )}
                <div className="flex w-full items-center gap-1 sm:w-auto sm:justify-end">
                  <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-mute sm:flex-none sm:text-right">
                    {employee.rights}
                  </p>
                  {canEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={busy}
                      aria-label={`Удалить ${employee.name}`}
                      onClick={() => setRemoveTarget(employee)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
                {twoSided ? (
                  <SideAccess
                    employee={employee}
                    sides={sides}
                    editable={canEdit && Boolean(onChangeSideRole)}
                    busy={busy}
                    onChange={(side, role) => onChangeSideRole?.(employee.userId, side, role)}
                  />
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle>Удалить сотрудника?</DialogTitle>
          </DialogHeader>
          <p className="text-[14.5px] text-mute">
            {removeTarget
              ? `${removeTarget.name} (${removeTarget.email}) потеряет доступ к кабинету компании.`
              : null}
          </p>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRemoveTarget(null)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={confirmRemove}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Access to purchases and sales for one person, when the company does both. */
const SideAccess = ({
  employee,
  sides,
  editable,
  busy,
  onChange,
}: {
  employee: CompanyTeamEmployee
  sides: TeamSideKey[]
  editable: boolean
  busy: boolean
  onChange: (side: TeamSideKey, role: SideRole | null) => void
}) => {
  if (employee.role === "director") {
    return (
      <p className="text-[12.5px] text-mute sm:text-right">Закупки и продажи: полный доступ</p>
    )
  }
  const current = (side: TeamSideKey) =>
    side === "buyer" ? employee.buyerRole ?? null : employee.supplierRole ?? null
  if (!editable) {
    const overridden = sides.filter((side) => current(side))
    if (overridden.length === 0) return null
    return (
      <p className="text-[12.5px] text-mute sm:text-right">
        {overridden
          .map((side) => `${TEAM_SIDE_LABELS[side]}: ${sideRoleLabel(current(side), employee.role).toLowerCase()}`)
          .join("; ")}
      </p>
    )
  }
  return (
    <div className="grid w-full gap-1.5 border-t border-line pt-2 sm:w-[200px]">
      {sides.map((side) => {
        const id = `side-${side}-${employee.userId}`
        const value = current(side) ?? ""
        return (
          <label key={side} htmlFor={id} className="flex items-center justify-between gap-2 text-[12.5px] text-mute">
            {TEAM_SIDE_LABELS[side]}
            <select
              id={id}
              value={value}
              disabled={busy}
              onChange={(e) => onChange(side, (e.target.value || null) as SideRole | null)}
              className={`h-8 min-w-0 flex-1 rounded-md border border-line bg-card px-2 text-[13px] outline-none focus:border-brand-600 disabled:opacity-60 ${
                value === "none" ? "text-red-700" : "text-ink"
              }`}
            >
              <option value="">{`Как ${companyRoleLabel(employee.role).toLowerCase()}`}</option>
              {SIDE_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )
      })}
    </div>
  )
}
