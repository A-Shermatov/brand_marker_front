"use client"

import { PlusIcon as Plus, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { COMPANY_ROLES } from "@/types/user"
import type { CompanyWizardTeamMember, CompanyWizardInput } from "@/types"
import { WizardField, wizardInputClass } from "@/components/company/wizard-field"

const ROLE_LABELS: Record<(typeof COMPANY_ROLES)[number], string> = {
  director: "Директор",
  admin: "Администратор",
  moderator: "Менеджер",
  accountant: "Бухгалтер",
  viewer: "Наблюдатель",
}

const emptyMember = (): CompanyWizardTeamMember => ({
  email: "",
  role: "moderator",
})

type TeamStepProps = {
  data: CompanyWizardInput
  errors: Record<string, string>
  onChange: (patch: Partial<CompanyWizardInput>) => void
}

export const TeamStep = ({ data, errors, onChange }: TeamStepProps) => {
  const handleAdd = () => {
    onChange({ team: [...data.team, emptyMember()] })
  }

  const handleRemove = (index: number) => {
    onChange({ team: data.team.filter((_, i) => i !== index) })
  }

  const handleUpdate = (
    index: number,
    patch: Partial<CompanyWizardTeamMember>,
  ) => {
    onChange({
      team: data.team.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Пригласите коллег по email — это можно сделать и позже. Каждый появится в
        команде, когда примет приглашение.
      </p>

      {data.team.length === 0 && (
        <div className="rounded-xl border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
          Участники не добавлены — вы будете единственным владельцем
        </div>
      )}

      {data.team.map((member, index) => (
        <div
          key={index}
          className="rounded-xl border border-border p-4 space-y-4 bg-secondary/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Участник {index + 1}</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              aria-label="Удалить участника"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WizardField
              label="Email"
              error={errors[`team.${index}.email`]}
            >
              <input
                maxLength={50}
                type="email"
                value={member.email}
                onChange={(e) => handleUpdate(index, { email: e.target.value })}
                placeholder="colleague@company.com"
                className={wizardInputClass}
              />
            </WizardField>

            <WizardField
              label="Роль"
              error={errors[`team.${index}.role`]}
            >
              <select
                value={member.role}
                onChange={(e) =>
                  handleUpdate(index, {
                    role: e.target.value as CompanyWizardTeamMember["role"],
                  })
                }
                className={wizardInputClass}
              >
                {COMPANY_ROLES.filter((role) => role !== "director").map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </WizardField>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleAdd}
        className="flex items-center gap-2 h-11 px-4 rounded-xl border border-dashed border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
      >
        <Plus size={16} />
        Добавить участника
      </button>
    </div>
  )
}
