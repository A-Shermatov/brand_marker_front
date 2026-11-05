"use client"

import { useState } from "react"
import Link from "next/link"
import { InfoIcon as Info, PlusIcon as Plus } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { PageFrame, PageHeader } from "@/components/layout"
import { EmployeeList } from "@/components/cabinet/company/employee-list"
import { InviteEmployeeDialog } from "@/components/cabinet/company/invite-employee-dialog"
import { useCompanyTeam } from "@/hooks/use-company-team"
import { COMPANY_ROLE_LABELS, COMPANY_ROLE_RIGHTS } from "@/lib/company-team"
import { COMPANY_ROLES } from "@/types"

/** Supplier side: the company's people and what each of them may do. */
export default function SupplierTeamPage() {
  const team = useCompanyTeam("supplier")
  const [inviteOpen, setInviteOpen] = useState(false)

  if (team.isLoading) {
    return (
      <PageFrame>
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-canvas" />
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-canvas" />
      </PageFrame>
    )
  }

  if (!team.company) {
    return (
      <PageFrame>
        <PageHeader title="Сотрудники и роли" description="Команда компании и права доступа" />
        <div className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
          <b className="text-[17px]">Компания ещё не создана</b>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-mute">
            Создайте компанию, чтобы пригласить сотрудников и раздать им роли.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/supplier/company/new">
              <Plus size={16} />
              Создать компанию
            </Link>
          </Button>
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title="Сотрудники и роли"
        description={`${team.company.title}: кто работает в кабинете и что ему доступно. Руководителя компании изменить нельзя.`}
        actions={
          team.canManage ? (
            <Button size="lg" disabled={team.busy} onClick={() => setInviteOpen(true)}>
              <Plus size={16} />
              Добавить сотрудника
            </Button>
          ) : null
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <EmployeeList
          employees={team.employees}
          canManage={team.canManage}
          busy={team.busy}
          onInviteClick={() => setInviteOpen(true)}
          onChangeRole={(userId, role) => void team.changeRole(userId, role).catch(() => {})}
          onRemove={(userId) => void team.removeMember(userId).catch(() => {})}
        />

        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-[15.5px] font-semibold">Что может каждая роль</h2>
          <dl className="mt-3 grid gap-3">
            {COMPANY_ROLES.map((role) => (
              <div key={role}>
                <dt className="text-[14px] font-semibold">{COMPANY_ROLE_LABELS[role]}</dt>
                <dd className="text-[13.5px] text-mute">{COMPANY_ROLE_RIGHTS[role]}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {!team.canManage ? (
        <p className="mt-4 flex items-start gap-2 text-[13.5px] text-mute">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Изменять роли может только руководитель или администратор компании.
        </p>
      ) : null}

      <InviteEmployeeDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        busy={team.busy}
        onInvite={async (data) => {
          await team.invite(data)
        }}
      />
    </PageFrame>
  )
}
