import { LockIcon as Lock, TrendUpIcon as TrendingUp, WalletIcon as Wallet } from "@phosphor-icons/react/dist/ssr"
import type { SupplierBalanceSummary } from "@/types"
import { formatCurrency } from "@/lib/format"
import { SurfaceCard } from "@/components/bm"

type BalanceCardsProps = {
  balances: SupplierBalanceSummary
  hydrated: boolean
}

const CARDS = [
  {
    key: "available" as const,
    Icon: Wallet,
    label: "Доступный баланс",
    hint: "Готово к выводу",
    iconClass: "bg-brand-50 text-brand-700",
  },
  {
    key: "pending" as const,
    Icon: TrendingUp,
    label: "В ожидании",
    hint: "Ожидают выплаты по этапам",
    iconClass: "bg-amber-50 text-amber-700",
  },
  {
    key: "escrowLocked" as const,
    Icon: Lock,
    label: "Под защитой",
    hint: "На гарантии площадки до приёмки",
    iconClass: "bg-sky-50 text-sky-700",
  },
]

export const BalanceCards = ({ balances, hydrated }: BalanceCardsProps) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    {CARDS.map(({ key, Icon, label, hint, iconClass }) => (
      <SurfaceCard
        key={key}
        className="flex items-start gap-3 p-4"
        padded={false}
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconClass}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[12.5px] font-semibold text-mute">
            {label}
          </span>
          <span className="tnum block text-[22px] font-bold text-ink">
            {hydrated ? formatCurrency(balances[key], balances.currency) : "—"}
          </span>
          <span className="block text-[12.5px] text-mute">{hint}</span>
        </span>
      </SurfaceCard>
    ))}
  </div>
)
