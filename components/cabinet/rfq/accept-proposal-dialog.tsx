"use client"

import { useCallback, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePlatformSettingsQuery } from "@/hooks/api/use-public-query"
import { exceedsContractLimit } from "@/lib/commission"
import { formatCurrency } from "@/lib/format"
import { PaymentTermsBuilder } from "@/components/cabinet/rfq/payment-terms-builder"
import type { Currency, ProposalAcceptInput } from "@/types"

type AcceptProposalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierName: string
  price: number
  currency: Currency
  onConfirm: (terms: ProposalAcceptInput) => void
}

export const AcceptProposalDialog = ({
  open,
  onOpenChange,
  supplierName,
  price,
  currency,
  onConfirm,
}: AcceptProposalDialogProps) => {
  const [terms, setTerms] = useState<ProposalAcceptInput>({
    payment_type: "full_postpayment",
  })
  const [isValid, setIsValid] = useState(true)
  const { data: platformSettings } = usePlatformSettingsQuery(open)
  const overLimit = platformSettings ? exceedsContractLimit(price, currency, platformSettings) : false
  const canConfirm = isValid && !overLimit

  const handleTermsChange = useCallback(
    (value: ProposalAcceptInput, valid: boolean) => {
      setTerms(value)
      setIsValid(valid)
    },
    [],
  )

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm(terms)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выбрать {supplierName}?</DialogTitle>
          <DialogDescription>
            Сумма сделки — {formatCurrency(price, currency)}.
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-sm font-bold">Что будет дальше</p>
          <ol className="mt-2 grid list-decimal gap-2 pl-5 text-[15px]">
            <li>Создадим сделку и договор на {formatCurrency(price, currency)}.</li>
            <li>Исполнитель выполнит работу, а вы проверите результат.</li>
            <li>
              Вы оплатите сделку до приёмки — деньги удерживает банк‑партнёр, исполнитель
              получит их только после того, как вы примете работу.
            </li>
            <li>Остальные предложения по заявке будут закрыты.</li>
          </ol>
        </div>

        {overLimit && platformSettings?.max_contract_amount != null && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Сумма превышает максимальную сумму сделки на платформе
            ({formatCurrency(platformSettings.max_contract_amount, currency)}).
            Попросите исполнителя изменить цену предложения.
          </p>
        )}

        <div className="py-1">
          <PaymentTermsBuilder
            price={price}
            currency={currency}
            onChange={handleTermsChange}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Да, выбрать за {formatCurrency(price, currency)}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
