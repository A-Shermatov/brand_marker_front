import type { ContractListTab } from "@/lib/contract-display"

export type BuyerContractListTab = Extract<ContractListTab, "active" | "completed">

export const BUYER_CONTRACT_LIST_TABS: {
  value: BuyerContractListTab
  label: string
}[] = [
  { value: "active", label: "В работе" },
  { value: "completed", label: "Завершённые" },
]

export const buyerContractEmptyMessages: Record<BuyerContractListTab, string> = {
  active: "Сделка появится, когда вы выберете предложение поставщика в заявке или купите товар в каталоге.",
  completed: "Здесь будут сделки, которые вы приняли и по которым поставщик получил оплату.",
}
