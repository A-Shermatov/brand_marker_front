import type { BudgetType, RfqStatus, RfqType, RfqWithRelations } from "@/types"

export const rfqStatusMeta: Record<
  RfqStatus,
  { label: string; className: string }
> = {
  draft: { label: "Черновик", className: "bg-muted text-muted-foreground" },
  published: { label: "Опубликована", className: "bg-info/10 text-info" },
  receiving_proposals: {
    label: "Приём предложений",
    className: "bg-primary/10 text-primary",
  },
  supplier_selected: {
    label: "Поставщик выбран",
    className: "bg-info/10 text-info",
  },
  contract_created: {
    label: "Идёт сделка",
    className: "bg-muted text-muted-foreground",
  },
  in_progress: { label: "Идёт сделка", className: "bg-info/10 text-info" },
  completed: { label: "Завершена", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Закрыта", className: "bg-muted text-muted-foreground" },
  expired: { label: "Срок истёк", className: "bg-warning/10 text-warning" },
  disputed: { label: "Спор", className: "bg-destructive/10 text-destructive" },
  archived: { label: "Архив", className: "bg-muted text-muted-foreground" },
}

export const budgetTypeMeta: Record<BudgetType, string> = {
  fixed: "Фиксированный",
  range: "Диапазон",
  open: "По предложениям",
}

export const OPEN_RFQ_STATUSES: RfqStatus[] = ["published", "receiving_proposals"]

export const rfqTypeLabel: Record<RfqType, string> = {
  product: "Товар",
  service: "Услуга",
}

export const isRfqInvitedFor = (rfq: RfqWithRelations, supplierActorId: number): boolean => {
  if (rfq.is_invited !== undefined) return rfq.is_invited
  return (
    rfq.visibility === "invited_only"
    && (rfq.invited_supplier_ids ?? []).includes(supplierActorId)
  )
}
