"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { PlanMark, TrustMark } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  adminApi,
  type AdminMarks,
  type AdminPlanCode,
  type AdminPlanSide,
  type AdminSupplierMark,
  type AdminTierChoice,
} from "@/lib/api/admin"
import { planName, plans } from "@/lib/subscription"
import { reputationTierLabel, TRUST_MARK_NAME } from "@/lib/trust-levels"
import type { SubscriptionPlan } from "@/lib/store/subscription-store"

type AdminMarksCardProps = { userId: number; companyId?: never } | { companyId: number; userId?: never }

const MONTHS = [1, 3, 6, 12]
const SIDES: { value: AdminPlanSide; label: string }[] = [
  { value: "supplier", label: "Кабинет поставщика" },
  { value: "buyer", label: "Кабинет покупателя" },
]
const TIER_CHOICES: { value: AdminTierChoice; label: string }[] = [
  { value: "auto", label: "Авто, по сделкам" },
  { value: "none", label: "Снять знак" },
  { value: "silver", label: "Серебро" },
  { value: "gold", label: "Золото" },
  { value: "diamond", label: "Алмаз" },
]

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : ""

/** Where the mark shows: one mark per owner, on all their profiles. */
const sidesLabel = (mark: AdminSupplierMark) => {
  const sides = mark.sides ?? []
  const both = sides.includes("supplier") && sides.includes("buyer")
  const where = both
    ? "в профилях покупателя и поставщика"
    : sides.includes("buyer")
      ? "в профиле покупателя"
      : "в профиле поставщика"
  const names = [...new Set((mark.profiles ?? []).map((p) => p.display_name))]
  return names.length > 1 ? `Виден ${where}: ${names.join(", ")}` : `Виден ${where}`
}

/** Admin: give or remove a paid plan and pin or remove the reliability mark. */
export function AdminMarksCard(props: AdminMarksCardProps) {
  const queryClient = useQueryClient()
  const key = props.userId ? ["admin-marks", "user", props.userId] : ["admin-marks", "company", props.companyId]
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () =>
      props.userId ? adminApi.userMarks(props.userId) : adminApi.companyMarks(props.companyId!),
  })

  if (isLoading || !data) {
    return <section className="h-40 animate-pulse rounded-2xl border border-line bg-card" aria-busy />
  }

  const refresh = (next: Partial<AdminMarks>) =>
    queryClient.setQueryData<AdminMarks>(key, (old) => (old ? { ...old, ...next } : old))

  return (
    <section className="grid gap-4 rounded-2xl border border-line bg-card p-5 lg:grid-cols-2">
      <SubscriptionBlock
        data={data}
        onChange={(side, subscription) =>
          refresh({
            subscriptions: { ...data.subscriptions, [side]: subscription },
            ...(side === "supplier" ? { subscription } : {}),
          })
        }
      />
      <div className="grid content-start gap-3 border-line lg:border-l lg:pl-5">
        <h2 className="text-[15.5px] font-semibold text-ink">{TRUST_MARK_NAME}</h2>
        {data.suppliers.length === 0 ? (
          <p className="text-[13.5px] text-mute">У пользователя нет профилей покупателя или поставщика.</p>
        ) : (
          data.suppliers.map((supplier) => (
            <ReputationRow
              key={supplier.actor_id}
              supplier={supplier}
              onChange={(next) =>
                refresh({
                  suppliers: data.suppliers.map((s) => (s.actor_id === next.actor_id ? next : s)),
                })
              }
            />
          ))
        )}
      </div>
    </section>
  )
}

function SubscriptionBlock({
  data,
  onChange,
}: {
  data: AdminMarks
  onChange: (side: AdminPlanSide, subscription: AdminMarks["subscription"]) => void
}) {
  // A plan belongs to one cabinet: the selling and the buying one are granted separately.
  const [side, setSide] = useState<AdminPlanSide>("supplier")
  const current =
    data.subscriptions?.[side] ??
    (side === "supplier" ? data.subscription : { plan: "none", active_until: null, is_active: false })
  const [plan, setPlan] = useState<AdminPlanCode>(
    current.is_active ? (current.plan as AdminPlanCode) : "pro",
  )
  const [months, setMonths] = useState(1)
  const [reason, setReason] = useState("")
  const mutation = useMutation({
    mutationFn: (payload: { plan: AdminPlanCode; months?: number; reason?: string }) =>
      adminApi.setUserSubscription(data.user_id, { ...payload, side }),
    onSuccess: (next, payload) => {
      onChange(side, next)
      setReason("")
      toast.success(
        payload.plan === "none"
          ? "Подписка снята"
          : `Тариф «${planName(payload.plan as SubscriptionPlan)}» выдан до ${formatDate(next.active_until)}`,
      )
    },
  })

  return (
    <div className="grid content-start gap-3">
      <h2 className="text-[15.5px] font-semibold text-ink">Тариф подписки</h2>
      <div
        role="radiogroup"
        aria-label="Кабинет, для которого тариф"
        className="inline-flex gap-1 justify-self-start rounded-lg bg-surface-muted p-1"
      >
        {SIDES.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={side === option.value}
            onClick={() => setSide(option.value)}
            className={
              side === option.value
                ? "h-8 rounded-md bg-card px-3 text-[13.5px] font-medium text-ink shadow-[0_1px_2px_rgba(28,28,26,.1)]"
                : "h-8 rounded-md px-3 text-[13.5px] font-medium text-mute hover:text-ink"
            }
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-[12.5px] text-mute">
        Тариф действует в одном кабинете. Тому, кто и покупает, и продаёт, он выдаётся для каждого отдельно.
      </p>
      <div className="flex items-center gap-3 rounded-lg bg-canvas px-3 py-2.5">
        {current.is_active ? (
          <PlanMark plan={current.plan} size={32} />
        ) : (
          <span className="grid size-8 place-items-center rounded-lg border border-dashed border-line-strong text-[11px] text-faint">
            —
          </span>
        )}
        <div className="min-w-0 text-[14px]">
          <p className="font-semibold text-ink">
            {current.is_active ? `«${planName(current.plan as SubscriptionPlan)}»` : "Не подключён"}
          </p>
          {current.is_active && current.active_until ? (
            <p className="text-[12.5px] text-mute">до {formatDate(current.active_until)}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select value={plan} onValueChange={(v) => setPlan(v as AdminPlanCode)}>
          <SelectTrigger className="w-full" aria-label="Тариф">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <SelectTrigger className="w-full sm:w-36" aria-label="Срок">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m === 1 ? "1 месяц" : m < 5 ? `${m} месяца` : `${m} месяцев`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Причина, видна в журнале действий"
        maxLength={300}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ plan, months, reason })}
        >
          {current.is_active ? "Выдать заново" : "Выдать тариф"}
        </Button>
        {current.is_active ? (
          <Button
            type="button"
            size="sm"
            variant="destructive-outline"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ plan: "none", reason })}
          >
            Снять подписку
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function ReputationRow({
  supplier,
  onChange,
}: {
  supplier: AdminSupplierMark
  onChange: (next: AdminSupplierMark) => void
}) {
  const [tier, setTier] = useState<AdminTierChoice>(
    (supplier.tier_override as AdminTierChoice | null) ?? "auto",
  )
  const [reason, setReason] = useState("")
  const mutation = useMutation({
    mutationFn: () => adminApi.setSupplierReputation(supplier.actor_id, { tier, reason }),
    onSuccess: (next) => {
      onChange(next)
      setReason("")
      toast.success(
        next.tier_override
          ? next.tier === "none"
            ? "Знак снят"
            : `Выдан знак «${reputationTierLabel(next.tier)}»`
          : "Знак снова считается по сделкам",
      )
    },
  })
  const pinned = supplier.tier_override !== null

  return (
    <div className="grid gap-2.5 rounded-lg border border-line p-3">
      <div className="flex items-center gap-3">
        <TrustMark tier={supplier.tier} size={32} still />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink">{supplier.display_name}</p>
          <p className="text-[12.5px] text-mute">{sidesLabel(supplier)}</p>
          <p className="text-[12.5px] text-mute">
            {reputationTierLabel(supplier.tier)}
            {pinned
              ? ` · вручную${supplier.override_reason ? `: ${supplier.override_reason}` : ""}`
              : " · по сделкам"}
            {pinned ? ` · по сделкам было бы «${reputationTierLabel(supplier.tier_auto)}»` : ""}
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Select value={tier} onValueChange={(v) => setTier(v as AdminTierChoice)}>
          <SelectTrigger className="w-full" aria-label="Уровень знака">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIER_CHOICES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" size="sm" className="h-10" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          Сохранить
        </Button>
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Причина, видна в журнале действий"
          maxLength={300}
          className="sm:col-span-2"
        />
      </div>
    </div>
  )
}
