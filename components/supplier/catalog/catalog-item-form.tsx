"use client"

import { useMemo, useState } from "react"
import { CheckIcon as Check, EyeIcon as Eye } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { PageFrame } from "@/components/layout"
import { BackLink, PageHead } from "@/components/bm/page-head"
import { SurfaceCard } from "@/components/bm/surface-card"
import { useCategoryOptions } from "@/hooks/use-category-options"
import { serviceUrl } from "@/lib/marketplace-routes"
import {
  scoreCatalogDraft,
  sectionComplete,
  type CatalogScoreSection,
} from "@/lib/catalog-quality-score"
import type { CatalogItemInput, CatalogItemWithRelations, CatalogItemType } from "@/types"
import {
  AttributeFields,
  type AttributeFieldRow,
} from "@/components/supplier/catalog/attribute-fields"
import {
  DocumentMediaFields,
  PhotoGalleryFields,
  VideoMediaFields,
  type MediaFieldRow,
} from "@/components/supplier/catalog/media-fields"
import {
  PricingFields,
  type PricingFieldValues,
} from "@/components/supplier/catalog/pricing-fields"
import { CatalogDraftPreview } from "@/components/supplier/catalog/catalog-draft-preview"
import { CatalogScorePanel } from "@/components/supplier/catalog/catalog-score-panel"

type CatalogItemFormProps = {
  initial?: CatalogItemWithRelations
  onSubmit: (input: CatalogItemInput, status: "draft" | "pending_review") => void
}

const SECTIONS: Array<{ id: CatalogScoreSection; title: string; index: number }> = [
  { id: "s1", title: "Основное", index: 1 },
  { id: "s2", title: "Фото и видео", index: 2 },
  { id: "s3", title: "Характеристики", index: 3 },
  { id: "s4", title: "Цена и заказ", index: 4 },
  { id: "s5", title: "Описание", index: 5 },
  { id: "s6", title: "Документы", index: 6 },
]

const ERROR_SECTION: Record<string, CatalogScoreSection> = {
  title: "s1",
  categoryId: "s1",
  photos: "s2",
  fixed_price: "s4",
  hourly_rate: "s4",
  monthly_rate: "s4",
  tiers: "s4",
  description: "s5",
}

const defaultPricing: PricingFieldValues = {
  pricing_type: "fixed",
  currency: "TJS",
  fixed_price: "",
  hourly_rate: "",
  monthly_rate: "",
  tiers: [{ min_qty: 1, price: 0 }],
}

const pricingFromItem = (item?: CatalogItemWithRelations): PricingFieldValues => {
  if (!item?.pricing) return defaultPricing
  const p = item.pricing
  return {
    pricing_type: p.pricing_type,
    currency: p.currency,
    fixed_price: p.fixed_price != null ? String(p.fixed_price) : "",
    hourly_rate: p.hourly_rate != null ? String(p.hourly_rate) : "",
    monthly_rate: p.monthly_rate != null ? String(p.monthly_rate) : "",
    tiers: p.tiers.length > 0 ? p.tiers : [{ min_qty: 1, price: 0 }],
  }
}

const pluralPoints = (n: number): string => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "пункт"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "пункта"
  return "пунктов"
}

const SectionHead = ({
  index,
  title,
  subtitle,
  ok,
}: {
  index: number
  title: string
  subtitle: string
  ok: boolean
}) => (
  <div className="mb-5 flex items-start gap-3">
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold",
        ok ? "bg-brand-600 text-white" : "bg-canvas text-ink",
      )}
    >
      {ok ? <Check className="size-4" aria-hidden /> : index}
    </span>
    <div>
      <h2 className="text-[19px] font-bold tracking-[-0.01em]">{title}</h2>
      <p className="mt-0.5 text-[14px] text-mute">{subtitle}</p>
    </div>
  </div>
)

export const CatalogItemForm = ({ initial, onSubmit }: CatalogItemFormProps) => {
  const { catalogCategories } = useCategoryOptions()

  const [type, setType] = useState<CatalogItemType>(initial?.type ?? "product")
  const [title, setTitle] = useState(initial?.title ?? "")
  const [categoryId, setCategoryId] = useState(
    initial?.category_id ? String(initial.category_id) : "",
  )
  const [description, setDescription] = useState(initial?.description ?? "")
  const [attributes, setAttributes] = useState<AttributeFieldRow[]>(
    initial?.attributes.map((a) => ({
      name: a.name,
      value: a.value,
      value_type: a.value_type,
    })) ?? [],
  )
  const [media, setMedia] = useState<MediaFieldRow[]>(
    initial?.media.map((m) => ({
      file_name: m.file_name,
      file_url: m.file_url,
      media_type: m.media_type,
    })) ?? [],
  )
  const [pricing, setPricing] = useState<PricingFieldValues>(pricingFromItem(initial))
  const [invoice, setInvoice] = useState(initial?.invoice !== false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const score = useMemo(
    () =>
      scoreCatalogDraft({
        title,
        categoryId: categoryId ? Number(categoryId) : null,
        description,
        attributesCount: attributes.filter((a) => a.name.trim() && a.value.trim()).length,
        photoCount: media.filter((m) => m.media_type === "image" && m.file_url).length,
        hasVideo: media.some((m) => m.media_type === "video" && m.file_url.trim()),
        documentCount: media.filter((m) => m.media_type === "document" && m.file_url).length,
        pricingType: pricing.pricing_type,
        fixedPrice: pricing.fixed_price,
        hourlyRate: pricing.hourly_rate,
        monthlyRate: pricing.monthly_rate,
        tiers: pricing.tiers,
        status: initial?.status,
      }),
    [title, categoryId, description, attributes, media, pricing, initial?.status],
  )

  const jumpTo = (section: CatalogScoreSection) => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const collectErrors = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (title.trim().length < 5) e.title = "Название не короче 5 символов"
    if (!categoryId) e.categoryId = "Выберите категорию"
    if (description.trim().length < 10) e.description = "Описание от 10 символов"

    if (pricing.pricing_type === "fixed") {
      const price = Number(pricing.fixed_price)
      if (!pricing.fixed_price || Number.isNaN(price) || price <= 0) {
        e.fixed_price = "Укажите цену"
      }
    }
    if (pricing.pricing_type === "hourly") {
      const rate = Number(pricing.hourly_rate)
      if (!pricing.hourly_rate || Number.isNaN(rate) || rate <= 0) {
        e.hourly_rate = "Укажите ставку"
      }
    }
    if (pricing.pricing_type === "monthly") {
      const rate = Number(pricing.monthly_rate)
      if (!pricing.monthly_rate || Number.isNaN(rate) || rate <= 0) {
        e.monthly_rate = "Укажите ставку"
      }
    }
    if (pricing.pricing_type === "tiered") {
      if (
        pricing.tiers.length === 0 ||
        pricing.tiers.some((t) => t.min_qty < 1 || t.price <= 0)
      ) {
        e.tiers = "Добавьте хотя бы одну ступень с ценой"
      }
    }
    return e
  }

  const buildInput = (status: "draft" | "pending_review"): CatalogItemInput => ({
    type,
    category_id: Number(categoryId),
    title: title.trim(),
    description: description.trim(),
    status,
    invoice,
    attributes: attributes
      .filter((a) => a.name.trim())
      .map((a, index) => ({
        name: a.name.trim(),
        value: a.value.trim(),
        value_type: a.value_type,
        sort_order: index,
      })),
    media: media
      .filter((m) => m.file_url.trim())
      .map((m, index) => ({
        file_name: m.file_name.trim() || m.file_url.trim(),
        file_url: m.file_url.trim(),
        media_type: m.media_type,
        sort_order: index,
      })),
    pricing: {
      pricing_type: pricing.pricing_type,
      currency: pricing.currency,
      fixed_price:
        pricing.pricing_type === "fixed" ? Number(pricing.fixed_price) : null,
      hourly_rate:
        pricing.pricing_type === "hourly" ? Number(pricing.hourly_rate) : null,
      monthly_rate:
        pricing.pricing_type === "monthly" ? Number(pricing.monthly_rate) : null,
      tiers: pricing.pricing_type === "tiered" ? pricing.tiers : [],
    },
  })

  const handleSubmit = (status: "draft" | "pending_review") => {
    const nextErrors = collectErrors()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0]
      jumpTo(firstKey ? (ERROR_SECTION[firstKey] ?? "s1") : "s1")
      return
    }
    onSubmit(buildInput(status), status)
  }

  const handlePreview = () => {
    if (initial?.id) {
      window.open(serviceUrl(initial.id), "_blank", "noopener,noreferrer")
      return
    }
    const target = window.matchMedia("(min-width: 1280px)").matches
      ? document.getElementById("ppreview-desk")
      : document.getElementById("ppreview")
    target?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const inputClass = (field: string) =>
    cn(
      "h-11 w-full rounded-lg border bg-card px-4 text-[14.5px] outline-none transition-all focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15",
      errors[field] ? "border-red-400" : "border-line",
    )

  const errorEntries = Object.entries(errors).filter(([, msg]) => Boolean(msg))

  const actions = (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleSubmit("draft")}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-card px-4 text-[14px] font-semibold hover:bg-canvas"
      >
        Сохранить черновик
      </button>
      <button
        type="button"
        onClick={handlePreview}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-card px-4 text-[14px] font-semibold hover:bg-canvas"
      >
        <Eye className="size-4" aria-hidden />
        Предпросмотр
      </button>
      <button
        type="button"
        onClick={() => handleSubmit("pending_review")}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-[14px] font-semibold text-white hover:bg-brand-700 dark:hover:bg-brand-500"
      >
        Отправить на проверку
      </button>
    </div>
  )

  return (
    <PageFrame className="max-w-[1400px]">
      <BackLink href="/supplier/catalog">Товары и услуги</BackLink>
      <PageHead
        title={initial ? "Редактирование товара" : "Новый товар"}
        description="Чем подробнее карточка, тем больше заявок. Обязательные поля отмечены *."
        actions={actions}
      />

      {initial?.status === "changes_requested" && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          <p className="font-semibold">Позиция отклонена модератором</p>
          {initial.rejection_reason ? (
            <p className="mt-1.5">Причина: {initial.rejection_reason}</p>
          ) : null}
          <p className="mt-1.5 text-red-700/80">
            Исправьте карточку и снова отправьте на модерацию.
          </p>
        </div>
      )}

      {errorEntries.length > 0 ? (
        <div className="mb-5 grid gap-2 rounded-2xl border border-red-200 bg-red-50 p-4">
          <b className="text-[15px] text-red-700">
            Чтобы отправить на проверку, исправьте {errorEntries.length}{" "}
            {pluralPoints(errorEntries.length)}:
          </b>
          <ul className="grid gap-1 text-[14px]">
            {errorEntries.map(([key, msg]) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => jumpTo(ERROR_SECTION[key] ?? "s1")}
                  className="text-left text-red-700 underline underline-offset-2"
                >
                  {msg}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div id="ppreview" className="mb-4 grid gap-4 scroll-mt-24 xl:hidden">
        <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-4">
          <span className="text-[14.5px] font-semibold">Качество карточки</span>
          <b className="tnum text-[18px]">{score.total}/100</b>
        </div>
        <CatalogDraftPreview title={title} media={media} pricing={pricing} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[180px_minmax(0,1fr)_300px]">
        <nav
          className="sticky top-[92px] hidden 2xl:block"
          aria-label="Разделы карточки"
        >
          <ul className="grid gap-0.5">
            {SECTIONS.map((sec) => {
              const ok = sectionComplete(score, sec.id)
              return (
                <li key={sec.id}>
                  <button
                    type="button"
                    onClick={() => jumpTo(sec.id)}
                    className="flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[14px] font-semibold text-ink/75 hover:bg-card hover:text-ink"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full text-[11px]",
                        ok
                          ? "bg-brand-600 text-white"
                          : "border border-line bg-card",
                      )}
                    >
                      {ok ? <Check className="size-3" aria-hidden /> : sec.index}
                    </span>
                    {sec.title}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="grid min-w-0 gap-5">
          <SurfaceCard id="s1" className="scroll-mt-24">
            <SectionHead
              index={1}
              title="Основное"
              subtitle="Как покупатели найдут ваш товар"
              ok={sectionComplete(score, "s1")}
            />
            <div className="grid gap-5">
              <div className="grid max-w-sm grid-cols-2 rounded-xl bg-surface-muted p-1">
                {(["product", "service"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={cn(
                      "h-10 rounded-lg text-[15px] font-semibold transition-colors",
                      type === value
                        ? "bg-card shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                        : "text-mute",
                    )}
                  >
                    {value === "product" ? "Товар" : "Услуга"}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="pd-title" className="mb-1.5 block text-[13.5px] font-semibold">
                  Название *
                </label>
                <input
                  id="pd-title"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ноутбук Lenovo IdeaPad 5 15″, Core i5, 16 ГБ, SSD 512 ГБ"
                  className={inputClass("title")}
                />
                <div className="mt-1.5 flex justify-between gap-3 text-[12.5px] text-mute">
                  <span>
                    Формула:{" "}
                    <b className="text-ink/80">
                      что это + бренд/модель + главные характеристики
                    </b>
                  </span>
                  <span className="tnum shrink-0">{title.length}/120</span>
                </div>
                {errors.title ? (
                  <p className="mt-1 text-[13px] text-red-600">{errors.title}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="pd-cat" className="mb-1.5 block text-[13.5px] font-semibold">
                  Категория *
                </label>
                <select
                  id="pd-cat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClass("categoryId")}
                >
                  <option value="">Выберите категорию</option>
                  {catalogCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? (
                  <p className="mt-1 text-[13px] text-red-600">{errors.categoryId}</p>
                ) : null}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard id="s2" className="scroll-mt-24">
            <SectionHead
              index={2}
              title="Фото и видео"
              subtitle="Первое фото — главное, его видно в каталоге"
              ok={sectionComplete(score, "s2")}
            />
            <div className="grid gap-6">
              <PhotoGalleryFields media={media} onChange={setMedia} error={errors.photos} />
              <VideoMediaFields media={media} onChange={setMedia} />
            </div>
          </SurfaceCard>

          <SurfaceCard id="s3" className="scroll-mt-24">
            <SectionHead
              index={3}
              title="Характеристики"
              subtitle="Покупатели сравнивают товары именно по ним"
              ok={sectionComplete(score, "s3")}
            />
            <AttributeFields
              attributes={attributes}
              onChange={setAttributes}
              errors={errors}
            />
          </SurfaceCard>

          <SurfaceCard id="s4" className="scroll-mt-24">
            <SectionHead
              index={4}
              title="Цена и заказ"
              subtitle="Оптовые цены — главное, что смотрит покупатель"
              ok={sectionComplete(score, "s4")}
            />
            <div className="grid gap-5">
              <PricingFields values={pricing} onChange={setPricing} errors={errors} />
              <div className="border-t border-line pt-4">
                <span className="mb-2 block text-[14px] font-semibold">Способы оплаты</span>
                <label className="flex items-center gap-2 text-[15px]">
                  <input
                    type="checkbox"
                    checked={invoice}
                    onChange={(e) => setInvoice(e.target.checked)}
                    className="size-5 accent-[#0E8A5E]"
                  />
                  По счёту (безнал)
                </label>
                <p className="mt-1.5 text-[13px] text-mute">Всё — через гарантию сделки</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard id="s5" className="scroll-mt-24">
            <SectionHead
              index={5}
              title="Описание"
              subtitle="Расскажите, чем товар хорош и для кого он"
              ok={sectionComplete(score, "s5")}
            />
            <textarea
              id="pd-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Из чего сделано, чем лучше аналогов, что в комплекте, как упаковано, какая гарантия…"
              className={cn(
                "w-full resize-y rounded-lg border bg-card px-4 py-3 text-[14.5px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15",
                errors.description ? "border-red-400" : "border-line",
              )}
            />
            <div className="mt-1.5 flex justify-between text-[12.5px] text-mute">
              <span>Рекомендуем от 150 символов</span>
              <span className="tnum">{description.trim().length}</span>
            </div>
            {errors.description ? (
              <p className="mt-1 text-[13px] text-red-600">{errors.description}</p>
            ) : null}
          </SurfaceCard>

          <SurfaceCard id="s6" className="scroll-mt-24">
            <SectionHead
              index={6}
              title="Сертификаты и документы"
              subtitle="Сертификаты соответствия, паспорта качества, гарантийные условия"
              ok={sectionComplete(score, "s6")}
            />
            <DocumentMediaFields media={media} onChange={setMedia} />
          </SurfaceCard>

          <div className="flex flex-wrap justify-end gap-2 pb-8">{actions}</div>
        </div>

        <aside className="sticky top-[92px] hidden gap-4 xl:grid">
          <CatalogScorePanel score={score} onJump={jumpTo} />
          <div id="ppreview-desk" className="grid gap-2 scroll-mt-24">
            <span className="text-[13px] font-semibold text-mute">
              Так карточка выглядит в каталоге
            </span>
            <CatalogDraftPreview title={title} media={media} pricing={pricing} />
          </div>
        </aside>
      </div>
    </PageFrame>
  )
}
