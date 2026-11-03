"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { UploadSimpleIcon as ImageUp, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
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
  useAdminCompanyLogoMutation,
  useAdminCompanyUpdateMutation,
} from "@/hooks/api/use-admin-companies-query"
import type { AdminCompanyDetail } from "@/lib/api/admin"
import type { AdminCompanyUpdateInput } from "@/lib/api/admin-companies"
import { resolveFileUrl } from "@/lib/file-url"

type FormState = {
  title: string
  legal_name: string
  tax_number: string
  website: string
  description: string
  country: string
  city: string
  address: string
  founded_year: string
  employees_count: string
  annual_revenue_range: string
  languages: string
  industries: string
}

const TEXT_FIELDS = [
  "legal_name",
  "tax_number",
  "website",
  "description",
  "country",
  "city",
  "address",
  "annual_revenue_range",
] as const

const toForm = (company: AdminCompanyDetail): FormState => ({
  title: company.title,
  legal_name: company.legal_name ?? "",
  tax_number: company.tax_number ?? "",
  website: company.website ?? "",
  description: company.description ?? "",
  country: company.country ?? "",
  city: company.city ?? "",
  address: company.address ?? "",
  founded_year: company.profile?.founded_year?.toString() ?? "",
  employees_count: company.profile?.employees_count?.toString() ?? "",
  annual_revenue_range: company.profile?.annual_revenue_range ?? "",
  languages: (company.profile?.languages ?? []).join(", "),
  industries: (company.profile?.industries ?? []).join(", "),
})

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const toNumber = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN
}

const buildPayload = (form: FormState, initial: FormState): AdminCompanyUpdateInput => {
  const payload: AdminCompanyUpdateInput = {}
  if (form.title.trim() !== initial.title.trim()) payload.title = form.title.trim()
  for (const field of TEXT_FIELDS) {
    if (form[field].trim() !== initial[field].trim()) {
      payload[field] = form[field].trim() || null
    }
  }
  if (form.founded_year.trim() !== initial.founded_year.trim()) {
    payload.founded_year = toNumber(form.founded_year)
  }
  if (form.employees_count.trim() !== initial.employees_count.trim()) {
    payload.employees_count = toNumber(form.employees_count)
  }
  if (form.languages !== initial.languages) payload.languages = splitList(form.languages)
  if (form.industries !== initial.industries) payload.industries = splitList(form.industries)
  return payload
}

const Field = ({
  id,
  label,
  children,
  className,
}: {
  id: string
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={className}>
    <Label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
      {label}
    </Label>
    {children}
  </div>
)

type CompanyEditDialogProps = {
  company: AdminCompanyDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CompanyEditDialog = ({ company, open, onOpenChange }: CompanyEditDialogProps) => {
  const [initial, setInitial] = useState<FormState>(() => toForm(company))
  const [form, setForm] = useState<FormState>(() => toForm(company))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useAdminCompanyUpdateMutation()
  const logoMutation = useAdminCompanyLogoMutation()

  useEffect(() => {
    if (!open) return
    const next = toForm(company)
    setInitial(next)
    setForm(next)
    // Reset only when the dialog opens; live refetches must not wipe edits in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const setField = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    try {
      await logoMutation.mutateAsync({ companyId: company.id, file })
      toast.success("Логотип обновлён")
    } catch {
      // MutationCache toast
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) {
      toast.error("Название компании обязательно")
      return
    }
    const payload = buildPayload(form, initial)
    if (Number.isNaN(payload.founded_year) || Number.isNaN(payload.employees_count)) {
      toast.error("Год основания и число сотрудников должны быть числами")
      return
    }
    if (Object.keys(payload).length === 0) {
      onOpenChange(false)
      return
    }
    try {
      await updateMutation.mutateAsync({ companyId: company.id, data: payload })
      toast.success("Данные компании сохранены")
      onOpenChange(false)
    } catch {
      // MutationCache toast
    }
  }

  const pending = updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Редактирование компании</DialogTitle>
          <DialogDescription>
            Изменения применяются сразу, без заявки на модерацию, и попадают в журнал действий.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border border-border p-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
            {company.logo ? (
              <Image
                src={resolveFileUrl(company.logo)}
                alt=""
                fill
                unoptimized
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <ImageUp size={20} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Логотип</p>
            <p className="text-xs text-muted-foreground">PNG, JPG или WebP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogo}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={logoMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {logoMutation.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Загрузить
          </Button>
        </div>

        <form id="company-edit-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field id="company-title" label="Название *" className="sm:col-span-2">
            <Input
              id="company-title"
              value={form.title}
              onChange={setField("title")}
              maxLength={255}
              required
            />
          </Field>
          <Field id="company-legal-name" label="Юридическое наименование">
            <Input
              id="company-legal-name"
              value={form.legal_name}
              onChange={setField("legal_name")}
              maxLength={255}
            />
          </Field>
          <Field id="company-tax" label="ИНН / налоговый номер">
            <Input
              id="company-tax"
              value={form.tax_number}
              onChange={setField("tax_number")}
              maxLength={50}
            />
          </Field>
          <Field id="company-country" label="Страна">
            <Input
              id="company-country"
              value={form.country}
              onChange={setField("country")}
              maxLength={100}
            />
          </Field>
          <Field id="company-city" label="Город">
            <Input
              id="company-city"
              value={form.city}
              onChange={setField("city")}
              maxLength={100}
            />
          </Field>
          <Field id="company-address" label="Адрес" className="sm:col-span-2">
            <Input
              id="company-address"
              value={form.address}
              onChange={setField("address")}
              maxLength={500}
            />
          </Field>
          <Field id="company-website" label="Сайт" className="sm:col-span-2">
            <Input
              id="company-website"
              type="url"
              value={form.website}
              onChange={setField("website")}
              placeholder="https://"
              maxLength={500}
            />
          </Field>
          <Field id="company-description" label="Описание" className="sm:col-span-2">
            <Textarea
              id="company-description"
              value={form.description}
              onChange={setField("description")}
              rows={4}
              maxLength={10000}
            />
          </Field>
          <Field id="company-founded" label="Год основания">
            <Input
              id="company-founded"
              inputMode="numeric"
              value={form.founded_year}
              onChange={setField("founded_year")}
            />
          </Field>
          <Field id="company-employees" label="Сотрудников">
            <Input
              id="company-employees"
              inputMode="numeric"
              value={form.employees_count}
              onChange={setField("employees_count")}
            />
          </Field>
          <Field id="company-revenue" label="Выручка (диапазон)" className="sm:col-span-2">
            <Input
              id="company-revenue"
              value={form.annual_revenue_range}
              onChange={setField("annual_revenue_range")}
              maxLength={100}
            />
          </Field>
          <Field id="company-languages" label="Языки (через запятую)">
            <Input
              id="company-languages"
              value={form.languages}
              onChange={setField("languages")}
            />
          </Field>
          <Field id="company-industries" label="Отрасли (через запятую)">
            <Input
              id="company-industries"
              value={form.industries}
              onChange={setField("industries")}
            />
          </Field>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="submit" form="company-edit-form" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
