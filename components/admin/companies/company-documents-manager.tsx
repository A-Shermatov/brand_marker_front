"use client"

import { useState } from "react"
import { FilePlusIcon as FilePlus2, FileTextIcon as FileText, TrashIcon as Trash2 } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { CompanyConfirmDialog } from "@/components/admin/companies/company-confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useAdminCompanyAddDocumentMutation,
  useAdminCompanyDeleteDocumentMutation,
} from "@/hooks/api/use-admin-companies-query"
import type { AdminCompanyDetail } from "@/lib/api/admin"
import { resolveFileUrl } from "@/lib/file-url"

type Certificate = AdminCompanyDetail["certificates"][number]

const emptyForm = { title: "", issuer: "", issueDate: "", expiryDate: "" }

export const CompanyDocumentsManager = ({
  company,
  canManage,
}: {
  company: AdminCompanyDetail
  canManage: boolean
}) => {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Certificate | null>(null)
  const addMutation = useAdminCompanyAddDocumentMutation()
  const deleteMutation = useAdminCompanyDeleteDocumentMutation()

  const formValid = Boolean(
    file && form.title.trim() && form.issuer.trim() && form.issueDate.trim(),
  )

  const closeUpload = () => {
    setUploadOpen(false)
    setForm(emptyForm)
    setFile(null)
  }

  const handleUpload = async () => {
    if (!file || !formValid) {
      toast.error("Выберите файл и заполните название, издателя и дату выдачи")
      return
    }
    try {
      await addMutation.mutateAsync({
        companyId: company.id,
        input: {
          file,
          title: form.title,
          issuer: form.issuer,
          issueDate: form.issueDate,
          expiryDate: form.expiryDate || null,
        },
      })
      toast.success("Документ загружен")
      closeUpload()
    } catch {
      // MutationCache toast
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync({ companyId: company.id, documentId: deleteTarget.id })
      toast.success("Документ удалён")
      setDeleteTarget(null)
    } catch {
      // MutationCache toast
    }
  }

  return (
    <div className="space-y-4">
      {company.certificates.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {company.certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="flex items-start gap-3 rounded-xl border border-border p-4"
            >
              <FileText className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <a
                href={resolveFileUrl(certificate.file_url)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 hover:opacity-75"
              >
                <span className="block truncate font-bold">{certificate.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {certificate.issuer} · {certificate.issue_date}
                  {certificate.expiry_date ? ` — ${certificate.expiry_date}` : ""}
                </span>
              </a>
              {canManage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  aria-label={`Удалить ${certificate.title}`}
                  onClick={() => setDeleteTarget(certificate)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/25 px-5 py-8 text-center text-sm text-muted-foreground">
          Документы и сертификаты не добавлены.
        </div>
      )}

      {canManage && (
        <Button type="button" variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
          <FilePlus2 aria-hidden="true" />
          Загрузить документ
        </Button>
      )}

      <CompanyConfirmDialog
        open={uploadOpen}
        onOpenChange={(open) => {
          if (!open) closeUpload()
        }}
        title="Загрузить документ компании"
        description="Документ появится в карточке компании и в чеклисте проверки."
        confirmLabel="Загрузить"
        pending={addMutation.isPending}
        confirmDisabled={!formValid}
        onConfirm={() => void handleUpload()}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="company-doc-file" className="mb-1.5 block text-sm font-semibold">
              Файл *
            </Label>
            <Input
              id="company-doc-file"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="company-doc-title" className="mb-1.5 block text-sm font-semibold">
              Название *
            </Label>
            <Input
              id="company-doc-title"
              value={form.title}
              maxLength={255}
              onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="company-doc-issuer" className="mb-1.5 block text-sm font-semibold">
              Кем выдан *
            </Label>
            <Input
              id="company-doc-issuer"
              value={form.issuer}
              maxLength={255}
              onChange={(event) => setForm((f) => ({ ...f, issuer: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="company-doc-issued" className="mb-1.5 block text-sm font-semibold">
              Дата выдачи *
            </Label>
            <Input
              id="company-doc-issued"
              type="date"
              value={form.issueDate}
              onChange={(event) => setForm((f) => ({ ...f, issueDate: event.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="company-doc-expiry" className="mb-1.5 block text-sm font-semibold">
              Действует до
            </Label>
            <Input
              id="company-doc-expiry"
              type="date"
              value={form.expiryDate}
              onChange={(event) => setForm((f) => ({ ...f, expiryDate: event.target.value }))}
            />
          </div>
        </div>
      </CompanyConfirmDialog>

      <CompanyConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Удалить документ?"
        description={deleteTarget ? `«${deleteTarget.title}» будет удалён из карточки компании.` : ""}
        confirmLabel="Удалить"
        destructive
        pending={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
