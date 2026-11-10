"use client"

import { SegmentedControl } from "@/components/layout"

export type BuyerPaymentsTab =
  | "outgoing"
  | "escrow"
  | "invoices"
  | "refunds"

export const BUYER_PAYMENTS_TABS: { value: BuyerPaymentsTab; label: string }[] = [
  { value: "outgoing", label: "Мои оплаты" },
  { value: "escrow", label: "Деньги в банке" },
  { value: "invoices", label: "Счета" },
  { value: "refunds", label: "Возвраты" },
]

export const BUYER_PAYMENTS_TAB_VALUES = BUYER_PAYMENTS_TABS.map((option) => option.value)

type BuyerPaymentsTabsProps = {
  tab: BuyerPaymentsTab
  onTabChange: (tab: BuyerPaymentsTab) => void
}

export const BuyerPaymentsTabs = ({ tab, onTabChange }: BuyerPaymentsTabsProps) => (
  <SegmentedControl
    value={tab}
    options={BUYER_PAYMENTS_TABS}
    onChange={onTabChange}
    ariaLabel="Разделы платежей"
  />
)
