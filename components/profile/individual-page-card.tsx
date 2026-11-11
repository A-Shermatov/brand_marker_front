"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowSquareOutIcon as ExternalLink,
  CheckIcon as Check,
  ImageIcon as ImageMark,
  PlusIcon as Plus,
  TrashIcon as Trash,
} from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { PageSurface } from "@/components/layout"
import { PendingReviewNotice } from "@/components/profile/pending-review-notice"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api/auth"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import { resolveFileUrl } from "@/lib/file-url"
import { parseSkills } from "@/lib/account-type"
import { useAuthStore } from "@/lib/store/auth-store"
import { cn } from "@/lib/utils"
import type { IndividualPage, PortfolioItem, RateUnit } from "@/types"

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_WORKS = 12
const CURRENCIES = ["TJS", "USD", "EUR"] as const

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-input bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
const labelClass = "block text-sm font-medium text-foreground mb-1.5"

type Draft = Omit<IndividualPage, "supplier_actor_id" | "skills" | "rate_amount"> & {
  skillsText: string
  rateText: string
}

const toDraft = (page: IndividualPage): Draft => ({
  headline: page.headline ?? "",
  about: page.about ?? "",
  skillsText: page.skills.join(", "),
  city: page.city ?? "",
  website: page.website ?? "",
  rateText: page.rate_amount != null ? String(page.rate_amount) : "",
  rate_currency: page.rate_currency || "TJS",
  rate_unit: page.rate_unit || "project",
  portfolio: page.portfolio,
  accepts_orders: page.accepts_orders,
})

/**
 * "My page" of a private person: what buyers see when they open the profile.
 * A company employee sees the same form with "takes orders" switched off — it
 * is how they start working on their own next to the company.
 */
export function IndividualPageCard({ welcome = false }: { welcome?: boolean }) {
  const queryClient = useQueryClient()
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const enabled = isApiEnabled()
  const { data: page, isLoading } = useQuery({
    queryKey: ["my-page"],
    queryFn: () => authApi.getPage(),
    enabled,
  })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<number | null>(null)

  useEffect(() => {
    if (page) setDraft(toDraft(page))
  }, [page])

  const save = useMutation({
    mutationFn: (value: Draft) => {
      const rate = Number(value.rateText.replace(",", ".").replace(/\s/g, ""))
      return authApi.updatePage({
        headline: value.headline?.trim() || null,
        about: value.about?.trim() || null,
        skills: parseSkills(value.skillsText),
        city: value.city?.trim() || null,
        website: value.website?.trim() || null,
        rate_amount: value.rateText.trim() && Number.isFinite(rate) && rate > 0 ? rate : null,
        rate_currency: value.rate_currency,
        rate_unit: value.rate_unit,
        portfolio: value.portfolio
          .filter((work) => work.title.trim())
          .map((work) => ({
            title: work.title.trim(),
            description: work.description?.trim() || null,
            image: work.image || null,
            link: work.link?.trim() || null,
          })),
        accepts_orders: value.accepts_orders,
      })
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["my-page"], next)
      updateProfile({ acceptsOrders: next.accepts_orders })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success(
        next.pending_review
          ? "Страница отправлена на проверку: её увидят после одобрения администратором"
          : "Страница сохранена",
      )
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Не удалось сохранить страницу")),
  })

  if (!enabled) return null
  if (isLoading || !draft) {
    return <div className="h-48 animate-pulse rounded-2xl bg-canvas" aria-hidden />
  }

  const patch = (next: Partial<Draft>) => setDraft((prev) => (prev ? { ...prev, ...next } : prev))
  const patchWork = (index: number, next: Partial<PortfolioItem>) =>
    patch({
      portfolio: draft.portfolio.map((work, i) => (i === index ? { ...work, ...next } : work)),
    })

  const handleFile = async (file: File | undefined) => {
    const index = uploadTarget.current
    if (!file || index == null) return
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Загрузите картинку в формате JPG, PNG, WEBP или GIF")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Картинка должна быть не больше 5 МБ")
      return
    }
    setUploading(index)
    try {
      const { image } = await authApi.uploadPageImage(file)
      patchWork(index, { image })
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось загрузить картинку"))
    } finally {
      setUploading(null)
    }
  }

  const publicHref = page?.supplier_actor_id ? `/performers/${page.supplier_actor_id}?guest=1` : null

  return (
    <form
      id="page"
      aria-labelledby="my-page-title"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate(draft)
      }}
      className="space-y-6"
    >
      {page?.pending_review ? (
        <PendingReviewNotice fields={["page"]} />
      ) : null}
      <PageSurface className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="my-page-title" className="text-[17px] font-bold text-foreground">
              Моя страничка
            </h2>
            <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
              {welcome
                ? "Добро пожаловать! Расскажите о себе — эту страницу покупатели видят перед тем, как написать вам."
                : "Так покупатели видят вас, когда вы работаете от своего имени, а не от компании."}
            </p>
          </div>
          {publicHref ? (
            <Button asChild variant="outline" size="sm">
              <Link href={publicHref} target="_blank">
                <ExternalLink aria-hidden />
                Как видят меня другие
              </Link>
            </Button>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/40">
          <input
            type="checkbox"
            checked={draft.accepts_orders}
            onChange={(e) => patch({ accepts_orders: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            <span className="block text-sm font-medium text-foreground">
              Принимаю заказы как частное лицо
            </span>
            <span className="block text-[12.5px] leading-snug text-muted-foreground">
              Вы появитесь в списке поставщиков под своим именем. Если вы работаете только как
              сотрудник компании, оставьте выключенным — покупатели будут видеть компанию.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="page-headline" className={labelClass}>
              Чем вы занимаетесь
            </label>
            <input
              id="page-headline"
              maxLength={120}
              value={draft.headline ?? ""}
              onChange={(e) => patch({ headline: e.target.value })}
              placeholder="Программист: сайты и Telegram-боты"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="page-about" className={labelClass}>
              О себе
            </label>
            <textarea
              id="page-about"
              maxLength={3000}
              rows={4}
              value={draft.about ?? ""}
              onChange={(e) => patch({ about: e.target.value })}
              placeholder="Опыт, с кем работали, как строите работу и сроки"
              className={cn(inputClass, "h-auto py-3 leading-relaxed")}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="page-skills" className={labelClass}>
              Навыки
            </label>
            <input
              id="page-skills"
              value={draft.skillsText}
              onChange={(e) => patch({ skillsText: e.target.value })}
              placeholder="Python, FastAPI, Telegram-боты"
              className={inputClass}
            />
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">
              Через запятую, до 20 навыков. По ним вас находят в поиске.
            </p>
          </div>
          <div>
            <label htmlFor="page-city" className={labelClass}>
              Город
            </label>
            <input
              id="page-city"
              maxLength={100}
              value={draft.city ?? ""}
              onChange={(e) => patch({ city: e.target.value })}
              placeholder="Душанбе"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="page-website" className={labelClass}>
              Сайт или профиль <span className="font-normal text-muted-foreground">(необязательно)</span>
            </label>
            <input
              id="page-website"
              maxLength={255}
              value={draft.website ?? ""}
              onChange={(e) => patch({ website: e.target.value })}
              placeholder="github.com/username"
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <span className={labelClass} id="page-rate-label">
              Ставка <span className="font-normal text-muted-foreground">(необязательно)</span>
            </span>
            <div className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] gap-2" aria-labelledby="page-rate-label" role="group">
              <input
                aria-label="Сумма"
                inputMode="decimal"
                value={draft.rateText}
                onChange={(e) => patch({ rateText: e.target.value.replace(/[^\d.,\s]/g, "") })}
                placeholder="180"
                className={inputClass}
              />
              <select
                aria-label="Валюта"
                value={draft.rate_currency}
                onChange={(e) => patch({ rate_currency: e.target.value })}
                className={cn(inputClass, "px-3")}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              <select
                aria-label="За что"
                value={draft.rate_unit}
                onChange={(e) => patch({ rate_unit: e.target.value as RateUnit })}
                className={cn(inputClass, "px-3")}
              >
                <option value="hour">за час</option>
                <option value="project">за проект, от</option>
              </select>
            </div>
          </div>
        </div>
      </PageSurface>

      <PageSurface className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-bold text-foreground">Портфолио</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Примеры работ: название, пара слов и картинка или ссылка. До {MAX_WORKS} работ.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ""
          }}
        />
        {draft.portfolio.map((work, index) => {
          const image = work.image ? resolveFileUrl(work.image) || work.image : null
          return (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:grid-cols-[132px_minmax(0,1fr)]"
            >
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => {
                  uploadTarget.current = index
                  fileRef.current?.click()
                }}
                className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg border border-dashed border-input bg-card text-[12.5px] text-muted-foreground transition-colors hover:border-primary disabled:opacity-60"
                aria-label={image ? `Заменить картинку работы ${index + 1}` : `Добавить картинку к работе ${index + 1}`}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid place-items-center gap-1">
                    <ImageMark className="size-5" aria-hidden />
                    {uploading === index ? "Загрузка…" : "Картинка"}
                  </span>
                )}
              </button>
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <input
                    aria-label={`Название работы ${index + 1}`}
                    maxLength={120}
                    value={work.title}
                    onChange={(e) => patchWork(index, { title: e.target.value })}
                    placeholder="Название работы"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => patch({ portfolio: draft.portfolio.filter((_, i) => i !== index) })}
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-destructive transition-colors hover:bg-destructive/10"
                    aria-label={`Удалить работу ${index + 1}`}
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <input
                  aria-label={`Описание работы ${index + 1}`}
                  maxLength={500}
                  value={work.description ?? ""}
                  onChange={(e) => patchWork(index, { description: e.target.value })}
                  placeholder="Что сделали и какой получился результат"
                  className={inputClass}
                />
                <input
                  aria-label={`Ссылка на работу ${index + 1}`}
                  maxLength={300}
                  value={work.link ?? ""}
                  onChange={(e) => patchWork(index, { link: e.target.value })}
                  placeholder="Ссылка (необязательно)"
                  className={inputClass}
                />
              </div>
            </div>
          )
        })}
        {draft.portfolio.length < MAX_WORKS ? (
          <button
            type="button"
            onClick={() =>
              patch({
                portfolio: [...draft.portfolio, { title: "", description: null, image: null, link: null }],
              })
            }
            className="flex h-11 items-center gap-2 rounded-xl border border-dashed border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <Plus size={16} />
            Добавить работу
          </button>
        ) : null}
      </PageSurface>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={save.isPending || uploading !== null}>
          {saved ? (
            <>
              <Check size={16} /> Сохранено
            </>
          ) : save.isPending ? (
            "Сохранение…"
          ) : (
            "Сохранить страничку"
          )}
        </Button>
      </div>
    </form>
  )
}
