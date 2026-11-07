"use client"

import { BankIcon as Landmark } from "@phosphor-icons/react/dist/ssr"
import type { WithdrawalDestination } from "@/types"
import { Button } from "@/components/ui/button"

type PayoutAccountCardProps = {
  destination: WithdrawalDestination | null
  onEdit: () => void
}

export const PayoutAccountCard = ({
  destination,
  onEdit,
}: PayoutAccountCardProps) => (
  <aside className="rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(28,28,26,.04)] md:p-6">
    <span className="text-[13px] font-semibold text-mute">Счёт для выплат</span>
    {destination ? (
      <div className="mt-3 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded bg-canvas text-brand-500">
          <Landmark className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <b className="block truncate text-[15px]">{destination.label}</b>
          <div className="truncate text-[13px] text-mute tnum">
            {destination.details}
          </div>
        </div>
      </div>
    ) : (
      <p className="mt-3 text-[14px] text-mute">
        Счёт ещё не добавлен. Без него нельзя вывести деньги.
      </p>
    )}
    <p className="mt-3 text-[12.5px] text-mute">
      Для защиты от мошенников после смены реквизитов выплаты задерживаются на
      48 часов, а руководителю приходит SMS.
    </p>
    <Button
      type="button"
      variant="outline"
      className="mt-3 w-full"
      onClick={onEdit}
    >
      {destination ? "Изменить реквизиты" : "Добавить счёт"}
    </Button>
  </aside>
)
