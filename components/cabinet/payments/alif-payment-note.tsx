import { InlineHint } from "@/components/process"
import { cn } from "@/lib/utils"

export const ALIF_PAY_LABEL = "Оплатить через Alif"
export const ALIF_CONFIRM_LABEL = "Перейти к оплате в Alif"

type AlifBadgeProps = {
  className?: string
}

export const AlifBadge = ({ className }: AlifBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border border-brand-300 bg-brand-50 px-2 py-0.5 text-[11px] font-bold leading-none text-brand-700",
      className,
    )}
    aria-label="Оплата через Alif"
  >
    Alif
  </span>
)

type AlifPaymentNoteProps = {
  className?: string
}

export const AlifPaymentNote = ({ className }: AlifPaymentNoteProps) => (
  <InlineHint variant="escrow" className={className}>
    Оплата картой через защищённую страницу <span className="font-semibold">Alif</span>.
    Данные карты не передаются площадке. После оплаты средства резервируются до приёмки
    и уйдут поставщику, когда вы подтвердите результат работы.
  </InlineHint>
)

type AlifCurrencyWarningProps = {
  currency: string
  className?: string
}

export const AlifCurrencyWarning = ({ currency, className }: AlifCurrencyWarningProps) => (
  <InlineHint variant="warning" className={className}>
    Оплата через Alif доступна только в {currency}.
  </InlineHint>
)

export const isAlifCurrencySupported = (
  viaAlif: boolean,
  alifCurrency: string | null | undefined,
  dealCurrency: string,
) => !viaAlif || !alifCurrency || alifCurrency === dealCurrency
