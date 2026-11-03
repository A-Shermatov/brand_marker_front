"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ArrowLeftIcon as ArrowLeft, CheckIcon as Check, EyeIcon as Eye, ChatTextIcon as MessageSquare, StarIcon as Star } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { ReputationBadge } from "@/components/bm/reputation-badge"
import { CompanyName } from "@/components/bm"
import { pickReputationTier } from "@/lib/trust-levels"
import { ServiceCard } from "@/components/marketplace/service-card"
import { Button } from "@/components/ui/button"
import { getPerformer } from "@/lib/mock/marketplace-performers"
import { getServicesByCategory } from "@/lib/mock/marketplace-services"
import { isApiEnabled } from "@/lib/api/config"
import {
  usePublicCompanyQuery,
  usePublicSupplierCatalogQuery,
  usePublicSupplierQuery,
  usePublicSupplierReviewsQuery,
} from "@/hooks/api/use-public-query"
import {
  mapCatalogItemToService,
  mapPublicSupplierToPerformer,
} from "@/lib/marketplace-hybrid"
import { performersUrl } from "@/lib/marketplace-routes"
import { createRfqHref } from "@/lib/create-rfq-href"
import { resolveFileUrl } from "@/lib/file-url"
import { useAuthStore } from "@/lib/store/auth-store"
import { useOpenDirectChatMutation } from "@/hooks/api/use-direct-chats-query"
import { cn } from "@/lib/utils"
import type { MarketplacePerformer } from "@/types/marketplace"

type PerformerDetailContentProps = {
  performerId: number
}

type StoreTab = "goods" | "about" | "reviews"

const VERIFY_ITEMS = [
  ["Свидетельство о регистрации", "компания существует и действует"],
  ["ИНН", "совпадает с данными налогового комитета"],
  ["Директор", "личность подтверждена"],
  ["Банковский счёт", "открыт на эту компанию — деньги придут именно ей"],
] as const

export const PerformerDetailContent = ({
  performerId,
}: PerformerDetailContentProps) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const guestPreview = searchParams.get("guest") === "1"
  const useApi = isApiEnabled()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const openDirectChat = useOpenDirectChatMutation("buyer")
  const [tab, setTab] = useState<StoreTab>("goods")

  const { data: apiSupplier, isLoading } = usePublicSupplierQuery(
    performerId,
    useApi,
  )
  const { data: apiCatalogPage } = usePublicSupplierCatalogQuery(
    performerId,
    useApi && Boolean(apiSupplier),
  )
  const { data: apiReviewsPage } = usePublicSupplierReviewsQuery(
    performerId,
    useApi && Boolean(apiSupplier) && tab === "reviews",
  )
  const companyId = apiSupplier?.company_id ?? null
  const { data: apiCompany } = usePublicCompanyQuery(
    companyId ?? 0,
    useApi && Boolean(companyId),
  )

  const apiCatalog = apiCatalogPage?.items ?? []
  const apiReviews = apiReviewsPage?.items ?? []

  const performer: MarketplacePerformer | null = useApi
    ? apiSupplier
      ? mapPublicSupplierToPerformer(apiSupplier)
      : null
    : (getPerformer(performerId) ?? null)

  const services = useMemo(() => {
    if (useApi) {
      return apiCatalog.map((item) =>
        mapCatalogItemToService(item, null, apiSupplier),
      )
    }
    if (!performer) return []
    return getServicesByCategory(performer.categoryId).filter(
      (s) => s.providerId === performer.id,
    )
  }, [useApi, apiCatalog, apiSupplier, performer])

  if (useApi && isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-[1120px] animate-pulse px-6 py-16">
          <div className="h-48 rounded-2xl bg-secondary" />
        </div>
      </PageShell>
    )
  }

  if (!performer) {
    return (
      <PageShell>
        <div className="mx-auto max-w-[900px] px-6 py-16 text-center">
          <p className="text-lg font-bold text-foreground">
            Исполнитель не найден
          </p>
          <Link
            href={performersUrl()}
            className="mt-2 inline-block font-semibold text-primary hover:underline"
          >
            К каталогу
          </Link>
        </div>
      </PageShell>
    )
  }

  const deals =
    apiSupplier?.completed_contracts ?? (Number(performer.clients) || 0)
  const successRate =
    apiSupplier?.success_rate != null
      ? `${Math.round(apiSupplier.success_rate)}%`
      : "—"
  const profileTier = pickReputationTier(apiSupplier?.reputation_tier, {
    verification_status: performer.verificationStatus,
    completed_contracts: apiSupplier?.completed_contracts,
    rating: performer.rating,
    success_rate: apiSupplier?.success_rate,
  })
  const yearsLabel = performer.years !== "—" ? performer.years : "—"
  const profile = apiCompany?.profile
  const gallery = Array.isArray(profile?.gallery) ? profile.gallery : []
  const facts = [
    ["Основана", profile?.founded_year != null ? String(profile.founded_year) : ""],
    ["Сотрудников", profile?.employees_count != null ? String(profile.employees_count) : ""],
    ["Склад", profile?.warehouse_area ?? ""],
    ["Работает в", profile?.markets ?? performer.city],
    ["Бренды", profile?.brands ?? ""],
  ].filter(([, v]) => Boolean(v))

  const tabs: { id: StoreTab; label: string; count?: number }[] = [
    { id: "goods", label: "Товары и услуги", count: services.length },
    { id: "about", label: "Проверка компании" },
    { id: "reviews", label: "Отзывы", count: performer.reviews },
  ]

  return (
    <PageShell>
      <div className="mx-auto max-w-[1120px] px-6 pt-6 pb-16">
        {guestPreview ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-ink p-4 text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10">
              <Eye className="size-5" aria-hidden />
            </span>
            <span className="min-w-[220px] flex-1">
              <b className="block text-[15px]">
                Предпросмотр — так гости видят вашу компанию
              </b>
              <span className="text-[13.5px] text-white/65">
                Публичная витрина на площадке
              </span>
            </span>
            <Button asChild variant="secondary" className="!bg-white !text-ink">
              <Link href="/supplier/company">Вернуться к редактированию</Link>
            </Button>
          </div>
        ) : (
          <Link
            href={performersUrl()}
            className="mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium text-mute hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Назад
          </Link>
        )}

        <section className="grid gap-6 rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-8 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div
              className={cn(
                "grid size-20 shrink-0 place-items-center rounded-2xl text-[24px] font-bold text-white",
                performer.color,
              )}
            >
              {performer.initials}
            </div>
            <div className="grid content-start gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <CompanyName
                  as="h1"
                  name={performer.name}
                  verified={performer.verified}
                  tier={profileTier}
                  plan={apiSupplier?.subscription_plan ?? performer.plan}
                  size="xl"
                />
                <ReputationBadge tier={profileTier} size={22} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {performer.verified ? (
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                    <Check className="size-4" aria-hidden />
                    {apiSupplier?.kind === "individual"
                      ? "Личность подтверждена"
                      : "Проверенная компания"}
                  </span>
                ) : performer.verificationStatus === "unverified" ? (
                  <span className="text-[13px] font-medium text-mute">Не проверен</span>
                ) : performer.verificationStatus === "rejected" ? (
                  <span className="text-[13px] font-semibold text-destructive">
                    Проверка отклонена
                  </span>
                ) : performer.verificationStatus === "needs_documents" ? (
                  <span className="text-[13px] font-semibold text-amber-700">
                    Нужны документы
                  </span>
                ) : (
                  <span className="text-[13px] font-semibold text-amber-700">
                    На проверке
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[14px]">
                  <Star className="size-4 fill-amber-400 text-amber-400" weight="fill" />
                  <b>{performer.rating.toFixed(1)}</b>
                  <span className="text-mute">({performer.reviews})</span>
                </span>
                <span className="text-[14px] text-mute">
                  {performer.city}
                  {apiSupplier?.country ? `, ${apiSupplier.country}` : ", Таджикистан"}
                </span>
              </div>
              {performer.description ? (
                <p className="mt-1 max-w-2xl text-[15.5px] text-ink/80">
                  {performer.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2 lg:w-56 lg:flex-col">
            <Button asChild size="lg" className="flex-1 lg:w-full">
              <Link
                href={createRfqHref({
                  supplierId: performer.id,
                  performer: performer.id,
                })}
              >
                Запросить цену
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 lg:w-full"
              disabled={openDirectChat.isPending}
              onClick={() => {
                const messagesHref = `/customer/messages?supplier=${performer.id}`
                if (guestPreview) {
                  toast.message("Это предпросмотр витрины — чат отсюда не создаётся")
                  return
                }
                if (!isAuthenticated) {
                  router.push(`/login?redirect=${encodeURIComponent(messagesHref)}`)
                  return
                }
                if (user?.role !== "customer" && !user?.capabilities.buyer) {
                  toast.error("Написать исполнителю можно из кабинета покупателя")
                  return
                }
                if (useApi) {
                  openDirectChat.mutate(performer.id, {
                    onSuccess: () => router.push(messagesHref),
                    onError: (error) => {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Не удалось открыть чат",
                      )
                    },
                  })
                  return
                }
                router.push(messagesHref)
              }}
            >
              <MessageSquare className="size-4" aria-hidden />
              Написать
            </Button>
          </div>

          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:col-span-2">
            {[
              ["Сделок на площадке", String(deals)],
              ["Обычно отвечает за", "—"],
              ["Отвечает на заявки", successRate],
              ["На рынке", yearsLabel],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-canvas p-4">
                <dt className="text-[13px] text-mute">{label}</dt>
                <dd className="mt-0.5 text-[20px] font-bold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-8">
          <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-10 rounded-lg px-4 text-[14px] font-semibold transition-colors",
                  tab === item.id
                    ? "bg-white text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                    : "text-mute hover:text-ink",
                )}
              >
                {item.label}
                {item.count != null ? (
                  <span className="ml-1.5 text-mute">{item.count}</span>
                ) : null}
              </button>
            ))}
          </div>

          {tab === "goods" ? (
            services.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
                <b className="text-[16px]">Пока нет товаров</b>
                <p className="mt-1 text-[14px] text-mute">
                  Компания ещё не добавила предложения.
                </p>
              </div>
            )
          ) : null}

          {tab === "about" ? (
            <div className="grid max-w-5xl gap-4">
              <div className="grid max-w-3xl gap-4 rounded-2xl border border-line bg-white p-6">
                {performer.verified ? (
                  <>
                    <p className="text-[15px]">
                      Площадка проверила документы компании:
                    </p>
                    <ul className="grid gap-3">
                      {VERIFY_ITEMS.map(([title, hint]) => (
                        <li key={title} className="flex gap-3">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                            <Check className="size-4" aria-hidden />
                          </span>
                          <span>
                            <b className="text-[15px]">{title}</b>
                            <span className="block text-[14px] text-mute">
                              {hint}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-[15px] text-amber-800">
                    Документы компании ещё на проверке. Покупайте только с
                    гарантией сделки.
                  </p>
                )}
              </div>

              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gallery.map((photo, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${photo.src}-${index}`}
                      src={resolveFileUrl(photo.src) || photo.src}
                      alt=""
                      className="aspect-[4/3] w-full rounded-xl border border-line object-cover"
                    />
                  ))}
                </div>
              ) : null}

              {facts.length > 0 ? (
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {facts.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-line bg-white p-4"
                    >
                      <dt className="text-[13px] text-mute">{label}</dt>
                      <dd className="mt-0.5 text-[15px] font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {profile?.notable_clients ? (
                <p className="text-[15px]">
                  <span className="text-mute">Клиенты:</span>{" "}
                  <b>{profile.notable_clients}</b>
                </p>
              ) : null}
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div className="max-w-3xl rounded-2xl border border-line bg-white p-6">
              {apiReviews.length > 0 ? (
                <ul className="divide-y divide-line">
                  {apiReviews.map((review) => (
                    <li key={review.id} className="grid gap-1 py-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-3.5",
                              i < review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-line-strong",
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-[14.5px]">
                        {review.comment || "Без комментария"}
                      </p>
                      <span className="text-[12.5px] text-mute">
                        {new Date(review.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] text-mute">Отзывов пока нет.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  )
}
