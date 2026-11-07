"use client"

import { useState } from "react"
import { ClockIcon as Clock, CircleNotchIcon as Loader2, ShieldCheckIcon as ShieldCheck } from "@phosphor-icons/react/dist/ssr"
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
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/client"
import type { CompanyChangeRequestPayload } from "@/lib/api/companies"
import { initialsFromName } from "@/lib/company-team"

export type CompanyRequisites = {
  name: string
  verified: boolean
  inn: string
  form: string
  city: string
  bank: string
  account: string
  legalName?: string
  address?: string
  country?: string
}

type CompanyRequisitesCardProps = {
  company: CompanyRequisites
  companyId?: number | null
  pendingRequest?: boolean
  onSubmitChangeRequest?: (payload: CompanyChangeRequestPayload) => Promise<void>
}

export const CompanyRequisitesCard = ({
  company,
  companyId,
  pendingRequest = false,
  onSubmitChangeRequest,
}: CompanyRequisitesCardProps) => {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState(company.name)
  const [legalName, setLegalName] = useState(company.legalName || company.name)
  const [taxNumber, setTaxNumber] = useState(company.inn)
  const [city, setCity] = useState(company.city)
  const [address, setAddress] = useState(company.address || "")
  const [reason, setReason] = useState("")

  const rows: [string, string][] = [
    ["ИНН", company.inn],
    ["Форма", company.form],
    ["Город", company.city],
    ["Банк", company.bank],
    ["Р/с", company.account],
  ]

  const openDialog = () => {
    setTitle(company.name)
    setLegalName(company.legalName || company.name)
    setTaxNumber(company.inn)
    setCity(company.city)
    setAddress(company.address || "")
    setReason("")
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!onSubmitChangeRequest || !companyId) {
      toast.success("Заявка на изменение данных отправлена администратору")
      setOpen(false)
      return
    }
    setBusy(true)
    try {
      await onSubmitChangeRequest({
        title: title.trim() || undefined,
        legal_name: legalName.trim() || undefined,
        tax_number: taxNumber.trim() || undefined,
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        reason: reason.trim() || undefined,
      })
      toast.success("Заявка отправлена на проверку")
      setOpen(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось отправить заявку"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-muted text-[13px] font-bold text-ink">
          {initialsFromName(company.name)}
        </span>
        <div className="min-w-0">
          <b className="block truncate text-[15px]">{company.name}</b>
          <div className="mt-0.5">
            {company.verified ? (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                <ShieldCheck className="size-4" aria-hidden />
                Проверенная компания
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-amber-700">
                <Clock className="size-4" aria-hidden />
                На проверке
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="mt-4 grid gap-2 text-[13.5px]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[80px_1fr] gap-2">
            <dt className="text-mute">{label}</dt>
            <dd className="tnum">{value || "—"}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-[13px] text-mute">
        Название, директор и реквизиты меняются только через проверку
        администратора площадки.
      </p>

      {pendingRequest ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-800">
          Заявка на изменение уже на проверке у администратора.
        </p>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={openDialog}
        >
          Запросить изменение
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Запрос изменения данных</DialogTitle>
            <DialogDescription>
              Изменения названия, ИНН и адреса отправятся администратору на проверку.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Название</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Юридическое название</span>
              <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">ИНН</span>
              <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Город</span>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Адрес</span>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Комментарий</span>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Почему нужны изменения"
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={busy} onClick={() => void handleSubmit()}>
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
