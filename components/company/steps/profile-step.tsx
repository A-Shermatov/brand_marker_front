"use client"

import { cn } from "@/lib/utils"
import {
  MAX_NUMERIC_INPUT_LENGTH,
  sanitizeDigitInput,
} from "@/lib/bounded-number-input"
import { useCategoryOptions } from "@/hooks/use-category-options"
import type { CompanyWizardInput } from "@/types"
import { WizardField, wizardInputClass } from "@/components/company/wizard-field"

const CURRENT_YEAR = new Date().getFullYear()

const LANGUAGE_OPTIONS = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "tj", label: "Тоҷикӣ" },
  { value: "uz", label: "O'zbek" },
]

const REVENUE_OPTIONS = [
  "до 10M TJS",
  "10M–50M TJS",
  "50M–100M TJS",
  "100M–500M TJS",
  "500M+ TJS",
]

type ProfileStepProps = {
  data: CompanyWizardInput
  errors: Record<string, string>
  onChange: (patch: Partial<CompanyWizardInput>) => void
}

export const ProfileStep = ({ data, errors, onChange }: ProfileStepProps) => {
  const { catalogCategories } = useCategoryOptions()

  const handleToggleLanguage = (lang: string) => {
    const languages = data.languages.includes(lang)
      ? data.languages.filter((l) => l !== lang)
      : [...data.languages, lang]
    onChange({ languages })
  }

  const handleToggleCategory = (id: number) => {
    const category_ids = data.category_ids.includes(id)
      ? data.category_ids.filter((c) => c !== id)
      : [...data.category_ids, id]
    onChange({ category_ids })
  }

  const handleIndustryChange = (value: string) => {
    const industries = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    onChange({ industries })
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <WizardField label="Год основания" error={errors.founded_year}>
          <input
            maxLength={4}
            type="text"
            inputMode="numeric"
            value={data.founded_year}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value, {
                max: CURRENT_YEAR,
                maxLength: 4,
              })
              if (next === null) return
              onChange({ founded_year: next })
            }}
            placeholder="2015"
            className={wizardInputClass}
          />
        </WizardField>

        <WizardField label="Число сотрудников" error={errors.employees_count}>
          <input
            maxLength={MAX_NUMERIC_INPUT_LENGTH}
            type="text"
            inputMode="numeric"
            value={data.employees_count}
            onChange={(e) => {
              const next = sanitizeDigitInput(e.currentTarget.value)
              if (next === null) return
              onChange({ employees_count: next })
            }}
            placeholder="50"
            className={wizardInputClass}
          />
        </WizardField>
      </div>

      <WizardField label="Годовой оборот" error={errors.annual_revenue_range}>
        <select
          value={data.annual_revenue_range}
          onChange={(e) => onChange({ annual_revenue_range: e.target.value })}
          className={wizardInputClass}
        >
          <option value="">Не указано</option>
          {REVENUE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </WizardField>

      <WizardField label="Языки">
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <button
              key={lang.value}
              type="button"
              onClick={() => handleToggleLanguage(lang.value)}
              className={cn(
                "h-9 px-3 rounded-lg text-sm font-medium border transition-colors",
                data.languages.includes(lang.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-input hover:border-primary/50",
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </WizardField>

      <WizardField label="Отрасли (через запятую)" error={errors.industries}>
        <input
          maxLength={100}
          type="text"
          value={data.industries.join(", ")}
          onChange={(e) => handleIndustryChange(e.target.value)}
          placeholder="IT, Телеком, Логистика"
          className={wizardInputClass}
        />
      </WizardField>

      <WizardField label="Категории деятельности">
        <div className="flex flex-wrap gap-2">
          {catalogCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleToggleCategory(cat.id)}
              className={cn(
                "h-9 px-3 rounded-lg text-sm font-medium border transition-colors",
                data.category_ids.includes(cat.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-input hover:border-primary/50",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </WizardField>
    </div>
  )
}
