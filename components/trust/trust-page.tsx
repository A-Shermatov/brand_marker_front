"use client"

import Link from "next/link"
import { CheckIcon, LockSimpleIcon, SealCheckIcon } from "@phosphor-icons/react/dist/ssr"
import {
  CompanyName,
  SurfaceCard,
  TrustLevelsGrid,
  TrustMark,
} from "@/components/bm"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store/auth-store"
import { PLAN_SIDE_COPY, type PlanSide } from "@/lib/subscription"
import {
  TRUST_LEVELS,
  TRUST_MARK_NAME,
  type ReputationTier,
  type TrustLevelMeta,
} from "@/lib/trust-levels"
import { cn } from "@/lib/utils"

type CondItem = {
  key: string
  label: string
  value: string
  ok: boolean
  pct: number
}

function conditionsFor(
  target: TrustLevelMeta,
  stats: {
    verified: boolean
    completed: number
    rating: number
    onTime: number | null
  },
): CondItem[] {
  return [
    {
      key: "verified",
      label: "Компания проверена по документам",
      value: stats.verified ? "проверена" : "на проверке",
      ok: stats.verified,
      pct: stats.verified ? 1 : 0,
    },
    {
      key: "deals",
      label: `Завершённых сделок: от ${target.minCompleted}`,
      value: `${stats.completed} из ${target.minCompleted}`,
      ok: stats.completed >= target.minCompleted,
      pct: Math.min(1, stats.completed / Math.max(1, target.minCompleted)),
    },
    {
      key: "rating",
      label: `Рейтинг: от ${target.minRating.toFixed(1)}`,
      value: stats.rating > 0 ? stats.rating.toFixed(1) : "нет оценок",
      ok: stats.rating >= target.minRating,
      pct: Math.min(1, stats.rating / Math.max(0.1, target.minRating)),
    },
    ...(target.minOnTime != null
      ? [
          {
            key: "onTime",
            label: `Сделок без споров: от ${target.minOnTime}%`,
            value:
              stats.onTime == null ? "нет данных" : `${Math.round(stats.onTime)}%`,
            ok: stats.onTime != null && stats.onTime >= target.minOnTime,
            pct:
              stats.onTime == null
                ? 0
                : Math.min(1, stats.onTime / target.minOnTime),
          } satisfies CondItem,
        ]
      : []),
  ]
}

export type TrustStats = {
  verified: boolean
  completed: number
  rating: number
  /** Share of finished deals without a dispute, % */
  onTime: number | null
}

type TrustPageProps = {
  /** The cabinet the page is opened in; the mark itself is one for both. */
  side: PlanSide
  title: string | null
  tier: ReputationTier
  stats: TrustStats
}

/**
 * The reliability mark of the account: the level now, what is left to the next
 * one, all levels. The mark is counted from every deal and review of the
 * owner, buying and selling alike, so both cabinets show the same page.
 */
export function TrustPage({ side, title, tier, stats }: TrustPageProps) {
  const user = useAuthStore((s) => s.user)
  const readers = side === "buyer" ? "поставщики" : "покупатели"

  const currentIndex = TRUST_LEVELS.findIndex((t) => t.id === tier)
  const currentMeta = currentIndex >= 0 ? TRUST_LEVELS[currentIndex] : null
  const nextMeta = TRUST_LEVELS[currentIndex + 1] ?? null
  const nextConditions = nextMeta ? conditionsFor(nextMeta, stats) : []
  const nextPassed = nextConditions.filter((c) => c.ok).length
  const companyTitle = title ?? user?.company ?? "Ваша компания"

  return (
    <div className="grid gap-5">
      <SurfaceCard padded={false} className="grid overflow-hidden lg:grid-cols-[1fr_1.1fr]">
        <div className="flex items-center gap-5 p-6">
          <TrustMark tier={tier} size={88} />
          <div className="min-w-0">
            <p className="text-[13px] text-mute">{TRUST_MARK_NAME}</p>
            <h2 className="mt-0.5 text-[24px] font-semibold leading-tight text-ink">
              {currentMeta ? currentMeta.name : "Пока без знака"}
            </h2>
            <p className="mt-1 max-w-sm text-[14px] text-mute">
              {currentMeta
                ? "Пересчитывается автоматически. Знак остаётся, пока условия выполняются."
                : "Знак появится рядом с названием компании, когда вы выполните условия первого уровня."}
            </p>
          </div>
        </div>

        <div className="border-t border-line bg-canvas/60 p-6 lg:border-t-0 lg:border-l">
          {nextMeta ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <TrustMark tier={nextMeta.id} size={30} still decorative />
                <b className="flex-1 text-[15px] font-semibold text-ink">
                  До знака «{nextMeta.name}»
                </b>
                <span className="text-[13px] text-mute tnum">
                  {nextPassed} из {nextConditions.length}
                </span>
              </div>
              <ul className="grid gap-3.5">
                {nextConditions.map((c) => (
                  <li key={c.key} className="grid gap-1.5">
                    <span className="flex items-center gap-2 text-[14px]">
                      <span
                        className={cn(
                          "grid size-[18px] shrink-0 place-items-center rounded-full",
                          c.ok ? "bg-brand-600 text-white" : "border border-line-strong bg-card",
                        )}
                        aria-hidden
                      >
                        {c.ok ? <CheckIcon weight="bold" className="size-3" /> : null}
                      </span>
                      <span className={cn("flex-1", c.ok ? "text-mute" : "text-ink")}>{c.label}</span>
                      <span className={cn("tnum", c.ok ? "text-mute" : "font-semibold text-ink")}>
                        {c.value}
                      </span>
                    </span>
                    {!c.ok && c.key !== "verified" ? (
                      <span className="ml-[26px] h-1 overflow-hidden rounded-full bg-line">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(3, Math.round(c.pct * 100))}%`,
                            background: nextMeta.accent,
                          }}
                        />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {nextConditions.every((c) => c.ok) ? (
                <p className="mt-4 text-[13.5px] text-mute">
                  Условия выполнены, знак обновится при следующем пересчёте.
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center gap-3 text-[14.5px] text-ink">
              <TrustMark tier="diamond" size={30} still decorative />
              У вас высший знак площадки. Его видят все {readers}.
            </div>
          )}
        </div>
      </SurfaceCard>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-ink">Уровни</h2>
          <p className="text-[13px] text-mute">
            «Сделки без споров»: доля завершённых сделок, по которым не открывали спор
          </p>
        </div>
        <TrustLevelsGrid currentTier={tier === "none" ? null : tier} />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <SurfaceCard className="grid content-start gap-3">
          <h2 className="text-[15px] font-semibold text-ink">Как вас видят {readers}</h2>
          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <CompanyName
              name={companyTitle}
              verified={stats.verified}
              tier={tier}
              size="lg"
            />
            <p className="mt-1 text-[13px] text-mute">
              В каталоге, заявках, сделках и чатах знак стоит рядом с названием
            </p>
          </div>
          <ul className="grid gap-1.5 text-[13px] text-mute">
            <li className="flex items-center gap-2">
              <SealCheckIcon weight="fill" className="size-[18px] text-brand-600" aria-hidden />
              Проверка документов
            </li>
            <li className="flex items-center gap-2">
              <TrustMark tier="gold" size={18} still decorative />
              {TRUST_MARK_NAME}: зарабатывается сделками
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard className="grid content-start gap-3">
          <div className="flex items-center gap-2">
            <LockSimpleIcon className="size-[18px] text-mute" aria-hidden />
            <h2 className="text-[15px] font-semibold text-ink">Знак нельзя купить</h2>
          </div>
          <p className="text-[14px] text-mute">
            Знак один на оба кабинета: он считается по всем вашим сделкам и отзывам, и как
            покупателя, и как поставщика. Подписка работает отдельно: она поднимает{" "}
            {PLAN_SIDE_COPY[side].lifted} в списках и выделяет их цветом. На знак она не влияет.
          </p>
          <Button asChild variant="outline" className="justify-self-start">
            <Link href={PLAN_SIDE_COPY[side].href}>Тарифы подписки</Link>
          </Button>
        </SurfaceCard>
      </section>
    </div>
  )
}
