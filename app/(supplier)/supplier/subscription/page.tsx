"use client"

import { useState } from "react"
import { CheckIcon, CircleNotchIcon, LockKeyIcon } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { CompanyName, FreePlanMark, PlanMark } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSubscriptionStore } from "@/lib/store/subscription-store"
import { useNotificationsStore } from "@/lib/store/notifications-store"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSupplierMarks } from "@/hooks/use-supplier-marks"
import { getApiErrorMessage } from "@/lib/api/client"
import { isApiEnabled } from "@/lib/api/config"
import {
  useActivateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useSubscriptionPaymentConfigQuery,
  useSupplierSubscriptionQuery,
} from "@/hooks/api/use-supplier-subscription-query"
import { formatPrice } from "@/lib/format"
import { plans, planName } from "@/lib/subscription"
import { useAuthStore } from "@/lib/store/auth-store"
import type { SubscriptionPlan } from "@/lib/store/subscription-store"
import type { SubscriptionPaymentMethodId } from "@/lib/api/supplier/subscription"

const FALLBACK_METHODS: {
  id: SubscriptionPaymentMethodId
  label: string
  supported: boolean
  hint: string
}[] = [
  { id: "alif", label: "Alif", supported: true, hint: "Оплата картой через Alif" },
  { id: "dc", label: "DC", supported: false, hint: "Пока не поддерживается" },
  { id: "eskhata", label: "Eskhata", supported: false, hint: "Пока не поддерживается" },
]

export default function SubscriptionPage() {
  const hydrated = useHydrated()
  const useApi = isApiEnabled()
  const user = useAuthStore((s) => s.user)
  const marks = useSupplierMarks()
  const localPlan = useSubscriptionStore((s) => s.plan)
  const activeUntil = useSubscriptionStore((s) => s.activeUntil)
  const activate = useSubscriptionStore((s) => s.activate)
  const cancel = useSubscriptionStore((s) => s.cancel)
  const isActive = useSubscriptionStore((s) => s.isActive)
  const notify = useNotificationsStore((s) => s.add)
  const [method, setMethod] = useState<SubscriptionPaymentMethodId>("alif")
  const [pendingPlan, setPendingPlan] = useState<string | null>(null)

  const { data: apiSub } = useSupplierSubscriptionQuery(hydrated && useApi)
  const { data: payConfig } = useSubscriptionPaymentConfigQuery(hydrated && useApi)
  const activateMutation = useActivateSubscriptionMutation()
  const cancelMutation = useCancelSubscriptionMutation()

  const plan = (useApi ? (apiSub?.plan ?? "none") : localPlan) as SubscriptionPlan
  const active = useApi ? Boolean(apiSub?.is_active) : hydrated && isActive()
  const until = useApi ? apiSub?.active_until : activeUntil
  const methods = payConfig?.methods?.length ? payConfig.methods : FALLBACK_METHODS
  const isAlifLive = payConfig?.provider === "alif"
  const companyTitle = marks.title ?? user?.company ?? "Ваша компания"

  const handleActivate = async (planId: (typeof plans)[number]["id"], name: string) => {
    const selected = methods.find((m) => m.id === method)
    if (selected && !selected.supported) {
      toast.error(selected.hint || "Пока не поддерживается")
      return
    }

    if (!useApi) {
      activate(planId)
      notify({
        type: "payment",
        title: "Подписка оформлена",
        body: `Тариф «${name}» активирован на 30 дней.`,
        href: "/supplier/subscription",
      })
      return
    }

    setPendingPlan(planId)
    try {
      const result = await activateMutation.mutateAsync({ plan: planId, method })
      if (result.payment_url) {
        window.location.assign(result.payment_url)
        return
      }
      if (result.is_active || result.payment_status === "paid") {
        toast.success(result.message || `Тариф «${name}» активирован`)
        notify({
          type: "payment",
          title: "Подписка оформлена",
          body: `Тариф «${name}» активирован на 30 дней.`,
          href: "/supplier/subscription",
        })
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Не удалось оформить подписку"))
    } finally {
      setPendingPlan(null)
    }
  }

  const handleCancel = async () => {
    if (useApi) {
      await cancelMutation.mutateAsync()
      return
    }
    cancel()
  }

  return (
    <div className="grid gap-5">
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {active ? (
            <PlanMark plan={plan} size={48} />
          ) : (
            <FreePlanMark size={48} />
          )}
          <div className="min-w-0">
            <p className="text-[15.5px] font-semibold text-ink">
              {active ? `Тариф «${planName(plan)}»` : "Подписка не подключена"}
            </p>
            <p className="text-[13.5px] text-mute">
              {active && until
                ? `Действует до ${new Date(until).toLocaleDateString("ru-RU")}. Значок тарифа уже стоит рядом с названием компании.`
                : "Тариф поднимает товары в каталоге и добавляет значок рядом с названием компании."}
            </p>
          </div>
        </div>
        {active ? (
          <Button
            type="button"
            variant="ghost"
            className="self-start text-mute sm:self-auto"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            Отменить подписку
          </Button>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[13.5px] text-mute">Оплата</span>
        <div role="radiogroup" aria-label="Способ оплаты" className="inline-flex gap-1 rounded-lg bg-surface-muted p-1">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={method === m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                "h-8 rounded-md px-3 text-[13.5px] font-medium transition-colors",
                method === m.id
                  ? "bg-card text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                  : "text-mute hover:text-ink",
              )}
            >
              {m.label}
              {!m.supported ? <span className="ml-1 text-faint">скоро</span> : null}
            </button>
          ))}
        </div>
        <span className="text-[12.5px] text-mute">{methods.find((m) => m.id === method)?.hint}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((p) => {
          const current = hydrated && active && plan === p.id
          const busy = pendingPlan === p.id && activateMutation.isPending
          return (
            <article
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-5",
                p.highlighted ? "border-brand-600 shadow-[0_0_0_1px_var(--brand-600)]" : "border-line",
              )}
            >
              {p.highlighted ? (
                <span className="absolute -top-2.5 left-5 rounded-full bg-brand-600 px-2 py-0.5 text-[11.5px] font-semibold text-white">
                  Чаще выбирают
                </span>
              ) : null}
              <div className="flex items-center gap-3">
                <PlanMark plan={p.id} size={40} />
                <div>
                  <h2 className="text-[17px] font-semibold leading-tight text-ink">{p.name}</h2>
                  <p className="text-[13px] text-mute">{p.tagline}</p>
                </div>
              </div>
              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-[28px] font-semibold tracking-[-0.02em] text-ink tnum">
                  {formatPrice(p.price)}
                </span>
                <span className="text-[13.5px] text-mute">в месяц</span>
              </p>
              <div className="mt-3 rounded-lg bg-canvas px-3 py-2">
                <p className="mb-0.5 text-[11.5px] text-mute">Рядом с названием</p>
                <CompanyName
                  name={companyTitle}
                  verified={marks.verified}
                  tier={marks.tier}
                  plan={p.id}
                  size="sm"
                />
              </div>
              <ul className="mt-4 grid flex-1 content-start gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[14px] text-ink-soft">
                    <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                onClick={() => handleActivate(p.id, p.name)}
                disabled={current || busy}
                variant={current ? "secondary" : p.highlighted ? "default" : "outline"}
                className="mt-5 w-full"
              >
                {busy ? <CircleNotchIcon className="size-4 animate-spin" /> : null}
                {current ? "Текущий тариф" : `Подключить «${p.name}»`}
              </Button>
            </article>
          )
        })}
      </div>

      <p className="flex items-center gap-2 text-[12.5px] text-mute">
        <LockKeyIcon className="size-4 shrink-0 text-brand-600" aria-hidden />
        {isAlifLive
          ? "Оплата через Alif. Подписка включается после успешного платежа и действует 30 дней."
          : "Демо-оплата: деньги не списываются. Подписка действует 30 дней."}
      </p>
    </div>
  )
}
