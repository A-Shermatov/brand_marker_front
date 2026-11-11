"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeftIcon as ArrowLeft,
  CalendarCheckIcon as CalendarCheck,
  ChatCircleTextIcon as ChatCircle,
  CheckIcon as Check,
  ClockIcon as Clock,
  EyeIcon as Eye,
  HandshakeIcon as Handshake,
  MapPinIcon as MapPin,
  ChatTextIcon as MessageSquare,
  SealCheckIcon as SealCheck,
  UserIcon as UserMark,
  ArrowSquareOutIcon as ExternalLink,
  StarIcon as Star,
} from "@phosphor-icons/react/dist/ssr"
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
import { SideReputationList } from "@/components/company/side-reputation"
import { CardChip, CardList, ListCard, StatusPill } from "@/components/layout/card-list"
import { RatingStars } from "@/components/reviews/review-card-list"
import { reviewAuthorLabel } from "@/lib/review-party"
import { formatRate } from "@/lib/account-type"

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
            Поставщик не найден
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
  // A private person (freelancer, craftsman) and not a company.
  const isPerson = apiSupplier?.kind === "individual"
  const skills = apiSupplier?.skills ?? []
  const portfolio = apiSupplier?.portfolio ?? []
  const rate = formatRate(apiSupplier?.rate_amount, apiSupplier?.rate_currency, apiSupplier?.rate_unit)
  const cover = apiSupplier?.cover ? resolveFileUrl(apiSupplier.cover) || apiSupplier.cover : null
  const profile = apiCompany?.profile
  const gallery = Array.isArray(profile?.gallery) ? profile.gallery : []
  const facts = [
    ["Основана", profile?.founded_year != null ? String(profile.founded_year) : ""],
    ["Сотрудников", profile?.employees_count != null ? String(profile.employees_count) : ""],
    ["Склад", profile?.warehouse_area ?? ""],
    ["Работает в", profile?.markets ?? performer.city],
    ["Бренды", profile?.brands ?? ""],
  ].filter(([, v]) => Boolean(v))

  const handleWrite = () => {
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
      toast.error("Написать поставщику можно из кабинета покупателя")
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
  }

  const tabs: { id: StoreTab; label: string; count?: number }[] = [
    { id: "goods", label: "Товары и услуги", count: services.length },
    { id: "about", label: isPerson ? "Проверка личности" : "Проверка компании" },
    { id: "reviews", label: "Отзывы", count: performer.reviews },
  ]

  return (
    <PageShell>
      <div className="mx-auto max-w-[1120px] px-6 pt-6 pb-16">
        {guestPreview ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-contrast p-4 text-white">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10">
              <Eye className="size-5" aria-hidden />
            </span>
            <span className="min-w-[220px] flex-1">
              <b className="block text-[15px]">
                {isPerson
                  ? "Предпросмотр — так покупатели видят вашу страницу"
                  : "Предпросмотр — так гости видят вашу компанию"}
              </b>
              <span className="text-[13.5px] text-white/65">
                Публичная витрина на площадке
              </span>
            </span>
            <Button asChild variant="secondary" className="!bg-card !text-ink">
              <Link href={isPerson ? "/supplier/profile" : "/supplier/company"}>
                Вернуться к редактированию
              </Link>
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

        <section className="overflow-hidden rounded-3xl border border-line bg-card shadow-[0_18px_40px_-28px_rgb(0_50_140/0.45)]">
          {/* Cover: the brand field, so every company page opens the same way. */}
          <div className="relative h-28 overflow-hidden bg-brand-field md:h-36" aria-hidden>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="absolute inset-0 size-full object-cover" data-testid="company-cover" />
            ) : (
              <span className="absolute inset-0 bg-[radial-gradient(60%_120%_at_10%_100%,rgb(255_255_255/0.14),transparent_60%)]" />
            )}
          </div>
          <div className="px-5 pb-6 md:px-8">
            <div className="relative z-10 -mt-12 flex flex-wrap items-end justify-between gap-4 md:-mt-14">
              {apiSupplier?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveFileUrl(apiSupplier.logo) || apiSupplier.logo}
                  alt=""
                  className="size-24 rounded-2xl border-4 border-card bg-card object-cover shadow-[0_8px_20px_-10px_rgb(0_30_90/0.5)] md:size-28"
                />
              ) : (
                <div
                  className={cn(
                    "grid size-24 place-items-center rounded-2xl border-4 border-card text-[28px] font-bold text-white shadow-[0_8px_20px_-10px_rgb(0_30_90/0.5)] md:size-28",
                    performer.color,
                  )}
                >
                  {performer.initials}
                </div>
              )}
              <div className="flex w-full gap-2 sm:w-auto">
                <Button asChild size="lg" className="flex-1 sm:flex-none">
                  <Link href={createRfqHref({ supplierId: performer.id, performer: performer.id })}>
                    Запросить цену
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1 sm:flex-none"
                  disabled={openDirectChat.isPending}
                  onClick={handleWrite}
                >
                  <MessageSquare className="size-4" aria-hidden />
                  Написать
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CompanyName
                  as="h1"
                  name={performer.name}
                  verified={performer.verified}
                  tier={profileTier}
                  size="xl"
                />
                <ReputationBadge tier={profileTier} size={22} />
              </div>
              {isPerson && apiSupplier?.headline ? (
                <p className="text-[17px] font-semibold text-ink" data-testid="person-headline">
                  {apiSupplier.headline}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                {isPerson ? (
                  <StatusPill tone="muted" icon={UserMark} className="text-ink">
                    Частное лицо
                  </StatusPill>
                ) : null}
                {performer.verified ? (
                  <StatusPill tone="safe" icon={SealCheck}>
                    {apiSupplier?.kind === "individual" ? "Личность подтверждена" : "Проверенная компания"}
                  </StatusPill>
                ) : performer.verificationStatus === "rejected" ? (
                  <StatusPill tone="danger">Проверка отклонена</StatusPill>
                ) : performer.verificationStatus === "unverified" ? (
                  <StatusPill tone="muted">Не проверен</StatusPill>
                ) : performer.verificationStatus === "needs_documents" ? (
                  <StatusPill tone="warn">Нужны документы</StatusPill>
                ) : (
                  <StatusPill tone="warn">На проверке</StatusPill>
                )}
                <StatusPill tone="muted" className="text-ink">
                  <Star className="size-4 text-amber-500" weight="fill" aria-hidden />
                  <b className="tnum">{performer.rating.toFixed(1)}</b>
                  <span className="text-mute">· отзывов: {performer.reviews}</span>
                </StatusPill>
                <StatusPill tone="muted" icon={MapPin}>
                  {[performer.city !== "—" ? performer.city : null, apiSupplier?.country ?? "Таджикистан"]
                    .filter(Boolean)
                    .join(", ")}
                </StatusPill>
                {rate ? (
                  <StatusPill tone="muted" className="text-ink">
                    <b className="tnum">{rate}</b>
                  </StatusPill>
                ) : null}
              </div>
              {performer.description ? (
                <p className="max-w-3xl text-[15.5px] leading-relaxed text-ink-soft">{performer.description}</p>
              ) : null}
              {apiSupplier?.industries?.length ? (
                <div className="flex flex-wrap gap-2" aria-label="Направления">
                  {apiSupplier.industries.map((industry) => (
                    <CardChip key={industry}>{industry}</CardChip>
                  ))}
                </div>
              ) : null}
              {skills.length ? (
                <div className="flex flex-wrap gap-2" aria-label="Навыки">
                  {skills.map((skill) => (
                    <CardChip key={skill}>{skill}</CardChip>
                  ))}
                </div>
              ) : null}
              {isPerson && apiSupplier?.website ? (
                <a
                  href={apiSupplier.website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex w-fit items-center gap-1.5 text-[14.5px] font-medium text-brand-700 hover:underline"
                >
                  <ExternalLink className="size-4" aria-hidden />
                  {apiSupplier.website.replace(/^https?:\/\//, "")}
                </a>
              ) : null}
              <SideReputationList reputation={apiCompany?.reputation} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {(
                [
                  [Handshake, "Сделок на площадке", String(deals)],
                  [Clock, "Обычно отвечает за", "—"],
                  [ChatCircle, "Отвечает на заявки", successRate],
                  [CalendarCheck, "На рынке", yearsLabel],
                ] as const
              ).map(([Icon, label, value]) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/60 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" weight="duotone" aria-hidden />
                  </span>
                  <span className="grid min-w-0">
                    <dt className="truncate text-[12.5px] text-mute">{label}</dt>
                    <dd className="text-[19px] font-bold text-ink tnum">{value}</dd>
                  </span>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {portfolio.length > 0 ? (
          <section className="mt-8" aria-labelledby="portfolio-title">
            <h2 id="portfolio-title" className="mb-4 text-[20px] font-bold tracking-[-0.01em] text-ink">
              Портфолио
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((work, index) => (
                <li
                  key={`${work.title}-${index}`}
                  className="overflow-hidden rounded-2xl border border-line bg-card"
                >
                  {work.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveFileUrl(work.image) || work.image}
                      alt=""
                      className="aspect-[16/10] w-full border-b border-line object-cover"
                    />
                  ) : null}
                  <div className="grid gap-1.5 p-4">
                    <b className="text-[15.5px] leading-snug text-ink">{work.title}</b>
                    {work.description ? (
                      <p className="text-[14px] leading-relaxed text-ink-soft">{work.description}</p>
                    ) : null}
                    {work.link ? (
                      <a
                        href={work.link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex w-fit items-center gap-1.5 text-[14px] font-medium text-brand-700 hover:underline"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                        Посмотреть работу
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-8">
          <div className="mb-5 inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-line bg-card p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-9 rounded-lg px-4 text-[14px] font-semibold transition-colors",
                  tab === item.id
                    ? "bg-brand-600 text-white"
                    : "text-mute hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {item.label}
                {item.count != null ? (
                  <span className={cn("ml-1.5", tab === item.id ? "text-white/80" : "text-faint")}>{item.count}</span>
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
              <div className="rounded-2xl border border-dashed border-line-strong bg-card px-6 py-14 text-center">
                <b className="text-[16px]">{isPerson ? "В каталоге пока пусто" : "Пока нет товаров"}</b>
                <p className="mt-1 text-[14px] text-mute">
                  {isPerson
                    ? "Напишите или запросите цену — специалист ответит на вашу задачу."
                    : "Компания ещё не добавила предложения."}
                </p>
              </div>
            )
          ) : null}

          {tab === "about" ? (
            <div className="grid max-w-5xl gap-4">
              <div className="grid max-w-3xl gap-4 rounded-2xl border border-line bg-card p-6">
                {isPerson ? (
                  <p className={cn("text-[15px]", performer.verified ? "text-ink" : "text-amber-800")}>
                    {performer.verified
                      ? "Площадка проверила документ, удостоверяющий личность: человек тот, за кого себя выдаёт."
                      : "Личность ещё не подтверждена документом. Работайте только с гарантией сделки: деньги удерживает банк до приёмки."}
                  </p>
                ) : performer.verified ? (
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
                      className="rounded-xl border border-line bg-card p-4"
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
            apiReviews.length > 0 ? (
              <CardList label={isPerson ? "Отзывы о специалисте" : "Отзывы о компании"} className="max-w-3xl">
                {apiReviews.map((review) => (
                  <ListCard key={review.id} tone={review.rating >= 4 ? "safe" : review.rating <= 2 ? "danger" : "warn"}>
                    <div className="grid gap-2 p-4 pl-5">
                      <span className="flex items-center justify-between gap-3">
                        <RatingStars rating={review.rating} />
                        <span className="text-[12.5px] text-mute">
                          {new Date(review.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </span>
                      <p className={cn("text-[15px] leading-relaxed", review.comment ? "text-ink-soft" : "text-mute")}>
                        {review.comment || "Без комментария"}
                      </p>
                      <p className="text-[13px] text-mute">{reviewAuthorLabel(review)}</p>
                    </div>
                  </ListCard>
                ))}
              </CardList>
            ) : (
              <p className="max-w-3xl rounded-2xl border border-dashed border-line-strong bg-card px-6 py-10 text-center text-[14px] text-mute">
                Отзывов пока нет.
              </p>
            )
          ) : null}
        </div>
      </div>
    </PageShell>
  )
}
