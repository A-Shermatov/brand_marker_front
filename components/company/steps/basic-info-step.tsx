"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { ImageSquareIcon as ImagePlus, CircleNotchIcon as Loader2 } from "@phosphor-icons/react/dist/ssr"
import type { ActorType, CompanyWizardInput } from "@/types"
import { WizardField, wizardInputClass, wizardTextareaClass } from "@/components/company/wizard-field"
import { isApiEnabled } from "@/lib/api/config"
import { buyerCompaniesApi } from "@/lib/api/companies"
import { supplierCompaniesApi } from "@/lib/api/supplier/companies"
import { useCropBeforeUpload } from "@/components/ui/image-crop-dialog"

type BasicInfoStepProps = {
  data: CompanyWizardInput
  errors: Record<string, string>
  onChange: (patch: Partial<CompanyWizardInput>) => void
  showActorTypes?: boolean
  actorType?: ActorType
}

const toggleActorType = (
  current: ActorType[],
  side: ActorType,
): ActorType[] => {
  if (current.includes(side)) {
    const next = current.filter((t) => t !== side)
    return next.length > 0 ? next : current
  }
  return [...current, side]
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"))
    reader.readAsDataURL(file)
  })

export const BasicInfoStep = ({
  data,
  errors,
  onChange,
  showActorTypes = true,
  actorType = "buyer",
}: BasicInfoStepProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    // The person frames the logo first; the cropped square is what uploads.
    logoCrop.choose(file)
  }

  const uploadLogo = async (file: File) => {
    setUploadError(null)
    setUploading(true)
    try {
      if (isApiEnabled()) {
        const api = actorType === "supplier" ? supplierCompaniesApi : buyerCompaniesApi
        const result = await api.uploadLogo(file)
        onChange({ logo: result.logo })
      } else {
        onChange({ logo: await readAsDataUrl(file) })
      }
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Не удалось загрузить логотип"
      setUploadError(message)
    } finally {
      setUploading(false)
    }
  }

  const logoCrop = useCropBeforeUpload({
    aspect: 1,
    title: "Логотип компании",
    description: "Выберите часть картинки для логотипа: он квадратный и виден в каталоге, чатах и сделках.",
    confirmLabel: "Сохранить логотип",
    onCropped: uploadLogo,
  })

  return (
    <div className="space-y-5">
      {logoCrop.dialog}
      {showActorTypes && (
        <WizardField label="Роли компании" required error={errors.actor_types}>
          <div className="flex flex-wrap gap-3">
            {(["buyer", "supplier"] as const).map((side) => {
              const checked = data.actor_types.includes(side)
              const label = side === "buyer" ? "Покупатель" : "Поставщик"
              return (
                <label
                  key={side}
                  className={`flex items-center gap-2 h-11 px-4 rounded-xl border cursor-pointer transition-colors ${
                    checked
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-secondary"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({ actor_types: toggleActorType(data.actor_types, side) })
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Компания может участвовать как покупатель, поставщик или в обеих ролях
          </p>
        </WizardField>
      )}

      <WizardField label="Название компании" required error={errors.title}>
        <input
          maxLength={100}
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Например, ТехноСнаб"
          className={wizardInputClass}
        />
      </WizardField>

      <WizardField label="Юридическое название" error={errors.legal_name}>
        <input
          maxLength={100}
          type="text"
          value={data.legal_name}
          onChange={(e) => onChange({ legal_name: e.target.value })}
          placeholder="ООО «Название»"
          className={wizardInputClass}
        />
      </WizardField>

      <WizardField label="ИНН / налоговый номер" error={errors.tax_number}>
        <input
          maxLength={20}
          type="text"
          value={data.tax_number}
          onChange={(e) => onChange({ tax_number: e.target.value })}
          placeholder="7701234567"
          className={wizardInputClass}
        />
      </WizardField>

      <WizardField label="Описание" error={errors.description}>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Кратко опишите деятельность компании"
          className={wizardTextareaClass}
        />
      </WizardField>

      <WizardField label="Логотип" error={errors.logo || uploadError || undefined}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          {data.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logo}
              alt="Логотип"
              className="h-16 w-16 rounded-xl object-cover border border-border bg-secondary shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl border border-dashed border-border bg-secondary shrink-0 flex items-center justify-center text-muted-foreground">
              <ImagePlus size={18} />
            </div>
          )}
          <div className="flex-1 w-full space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-dashed border-primary/40 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ImagePlus size={15} />
                )}
                {uploading ? "Загрузка..." : "Загрузить"}
              </button>
              {data.logo && (
                <button
                  type="button"
                  onClick={() => onChange({ logo: "" })}
                  className="h-10 px-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  Удалить
                </button>
              )}
            </div>
            <input
              type="url"
              value={data.logo}
              onChange={(e) => onChange({ logo: e.target.value })}
              placeholder="или вставьте URL"
              className={wizardInputClass}
            />
          </div>
        </div>
      </WizardField>
    </div>
  )
}
