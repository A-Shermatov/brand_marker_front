"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon as ArrowLeft, ArrowRightIcon as ArrowRight, BuildingsIcon as Building2, CheckIcon as Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import type { ActorType, CompanyWizardInput } from "@/types"
import { emptyCompanyWizardInput } from "@/types/company"
import {
  WIZARD_STEPS,
  type WizardStep,
  validateCompanyWizardStep,
} from "@/lib/schemas/company-wizard"
import { BasicInfoStep } from "@/components/company/steps/basic-info-step"
import { LocationStep } from "@/components/company/steps/location-step"
import { ProfileStep } from "@/components/company/steps/profile-step"
import { CertificatesStep } from "@/components/company/steps/certificates-step"
import { TeamStep } from "@/components/company/steps/team-step"
import { ReviewStep } from "@/components/company/steps/review-step"
import { Button } from "@/components/ui/button"
import { PageEmptyState, PageFrame, PageHeader } from "@/components/layout"

const STEP_LABELS: Record<WizardStep, string> = {
  basic: "Основное",
  location: "Адрес",
  profile: "Профиль",
  certificates: "Сертификаты",
  team: "Команда",
  review: "Проверка",
}

type CompanyWizardProps = {
  actorType: ActorType
  basePath: string
  mode?: "create" | "edit"
  initial?: CompanyWizardInput
  limitBlocked?: boolean
  limitMessage?: string
  subscriptionHref?: string
  onSubmit: (data: CompanyWizardInput) => void
}

export const CompanyWizard = ({
  actorType,
  basePath,
  mode = "create",
  initial,
  limitBlocked,
  limitMessage,
  subscriptionHref,
  onSubmit,
}: CompanyWizardProps) => {
  const [stepIndex, setStepIndex] = useState(0)
  const [data, setData] = useState<CompanyWizardInput>(() => {
    if (initial) return initial
    const base = emptyCompanyWizardInput()
    return { ...base, actor_types: [actorType] }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const currentStep = WIZARD_STEPS[stepIndex]
  const isLast = currentStep === "review"
  const actorLabel = actorType === "buyer" ? "Заказчик" : "Исполнитель"

  const handleChange = (patch: Partial<CompanyWizardInput>) => {
    setData((prev) => ({ ...prev, ...patch }))
    setErrors({})
  }

  const handleNext = () => {
    const stepErrors = validateCompanyWizardStep(currentStep, data)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    if (isLast) {
      onSubmit(data)
      return
    }
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1))
  }

  const handleBack = () => {
    setErrors({})
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  if (limitBlocked) {
    return (
      <PageFrame>
        <PageHeader
          title="Новая компания"
          description={limitMessage}
          backHref={basePath}
          backLabel="К списку компаний"
        />
        <PageEmptyState
          icon={<Building2 size={24} />}
          title="Лимит компаний исчерпан"
          description={limitMessage}
        />
        {subscriptionHref ? (
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href={subscriptionHref}>Оформить подписку</Link>
            </Button>
          </div>
        ) : null}
      </PageFrame>
    )
  }

  return (
    <PageFrame>
      <PageHeader
        title={mode === "edit" ? "Редактирование компании" : "Новая компания"}
        description={`${actorLabel} · шаг ${stepIndex + 1} из ${WIZARD_STEPS.length}`}
        backHref={basePath}
        backLabel="Назад к компаниям"
      />

      <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
        {WIZARD_STEPS.map((step, i) => (
          <button
            key={step}
            type="button"
            onClick={() => i < stepIndex && setStepIndex(i)}
            disabled={i > stepIndex}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
              i === stepIndex
                ? "bg-primary text-primary-foreground"
                : i < stepIndex
                  ? "bg-primary/10 text-primary cursor-pointer"
                  : "bg-secondary text-muted-foreground",
            )}
          >
            {i < stepIndex ? <Check size={12} /> : <span>{i + 1}</span>}
            {STEP_LABELS[step]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 mb-6">
        {currentStep === "basic" && (
          <BasicInfoStep
            data={data}
            errors={errors}
            onChange={handleChange}
            actorType={actorType}
          />
        )}
        {currentStep === "location" && (
          <LocationStep data={data} errors={errors} onChange={handleChange} />
        )}
        {currentStep === "profile" && (
          <ProfileStep data={data} errors={errors} onChange={handleChange} />
        )}
        {currentStep === "certificates" && (
          <CertificatesStep data={data} errors={errors} onChange={handleChange} />
        )}
        {currentStep === "team" && (
          <TeamStep data={data} errors={errors} onChange={handleChange} />
        )}
        {currentStep === "review" && (
          <ReviewStep data={data} actorTypeLabel={actorLabel} />
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handleBack}
          disabled={stepIndex === 0}
        >
          <ArrowLeft size={16} />
          Назад
        </Button>

        <Button type="button" size="lg" onClick={handleNext}>
          {isLast ? (mode === "edit" ? "Сохранить" : "Создать компанию") : "Далее"}
          {!isLast ? <ArrowRight size={16} /> : null}
        </Button>
      </div>
    </PageFrame>
  )
}
