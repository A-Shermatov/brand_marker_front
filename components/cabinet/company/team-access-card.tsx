"use client"

import { useState } from "react"
import { PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { DashboardPanel } from "@/components/cabinet/dashboard/dashboard-panel"
import { EmployeeList } from "@/components/cabinet/company/employee-list"
import { InviteEmployeeDialog } from "@/components/cabinet/company/invite-employee-dialog"
import { useCompanyTeam, type TeamSide } from "@/hooks/use-company-team"
import { companyRoleLabel } from "@/lib/company-team"

type TeamAccessCardProps = {
  side: TeamSide
  /** Full team page: /customer/company or /supplier/team */
  teamHref: string
  /** How many people to show on the home page. */
  limit?: number
  className?: string
}

/**
 * "Team and access" on the cabinet home. A director or admin invites people,
 * changes roles and removes access right here; everyone else sees who is in
 * the team and what their own role allows.
 */
export const TeamAccessCard = ({ side, teamHref, limit = 4, className }: TeamAccessCardProps) => {
  const team = useCompanyTeam(side)
  const [inviteOpen, setInviteOpen] = useState(false)

  if (!team.useApi || team.isLoading || !team.company) return null

  const shown = team.employees.slice(0, limit)
  const more = team.employees.length - shown.length
  const roleText = team.myRole ? companyRoleLabel(team.myRole).toLowerCase() : null

  return (
    <DashboardPanel
      title="Команда и доступ"
      href={teamHref}
      linkLabel={more > 0 ? `Все сотрудники (${team.employees.length})` : "Все сотрудники"}
      className={className}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[60ch] text-[13.5px] text-mute">
          {team.canManage
            ? `Вы ${roleText}: приглашайте сотрудников, меняйте их роли и закрывайте доступ.`
            : roleText
              ? `Ваша роль: ${roleText}. Менять роли может руководитель или администратор компании.`
              : "Менять роли может руководитель или администратор компании."}
        </p>
        {team.canManage ? (
          <Button size="sm" disabled={team.busy} onClick={() => setInviteOpen(true)}>
            <Plus aria-hidden />
            Пригласить сотрудника
          </Button>
        ) : null}
      </div>
      <EmployeeList
        employees={shown}
        canManage={team.canManage}
        busy={team.busy}
        onInviteClick={() => setInviteOpen(true)}
        onChangeRole={(userId, role) => void team.changeRole(userId, role).catch(() => {})}
        onRemove={(userId) => void team.removeMember(userId).catch(() => {})}
      />
      {team.canManage ? (
        <InviteEmployeeDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          busy={team.busy}
          onInvite={async (data) => {
            await team.invite(data)
          }}
        />
      ) : null}
    </DashboardPanel>
  )
}
