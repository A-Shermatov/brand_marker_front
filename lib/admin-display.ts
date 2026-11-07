export const adminReportStatusLabels: Record<string, string> = {
  open: "Открыта",
  resolved: "Решена",
  dismissed: "Отклонена",
}

export const adminRfqVisibilityLabels: Record<string, string> = {
  public: "Публичная",
  invited_only: "Только приглашённые",
}

export const adminActorKindLabels: Record<string, string> = {
  individual: "Физлицо",
  company: "Компания",
}

export const adminReportReasonLabels: Record<string, string> = {
  spam: "Спам",
  fraud: "Мошенничество",
  counterfeit: "Подделка",
  abuse: "Оскорбления",
  other: "Другое",
}

export const adminReportTargetLabels: Record<string, string> = {
  catalog: "Каталог",
  rfq: "Заявка",
  proposal: "Предложение",
}

export const adminHistoryActionLabels: Record<string, string> = {
  "admin.catalog.approve": "Одобрение позиции",
  "admin.catalog.hide": "Скрытие позиции",
  "admin.catalog.reject": "Отклонение позиции",
  "admin.catalog.delete": "Удаление позиции",
  "admin.catalog.restore": "Восстановление позиции",
  "admin.catalog.update": "Редактирование позиции",
  "admin.catalog.media.add": "Добавление файла",
  "admin.catalog.media.delete": "Удаление файла",
  "admin.catalog.media.reorder": "Изменение порядка файлов",
  "admin.rfq.hide": "Скрытие заявки",
  "admin.rfq.close": "Закрытие заявки",
  "admin.rfq.delete": "Удаление заявки",
  "admin.rfq.warn_buyer": "Предупреждение покупателя",
  "admin.proposal.delete": "Удаление предложения",
  "admin.proposal.investigate": "Расследование жалобы",
  "admin.proposal.block_supplier": "Блокировка исполнителя",
  "admin.contract.freeze": "Заморозка escrow",
  "admin.contract.cancel": "Отмена контракта",
  "admin.contract.force_complete": "Принудительное завершение",
  "admin.contract.open_investigation": "Открытие расследования",
  "admin.dispute.release_funds": "Выплата исполнителю",
  "admin.dispute.refund_buyer": "Возврат покупателю",
  "admin.dispute.partial_refund": "Частичный возврат",
  "admin.dispute.request_evidence": "Запрос доказательств",
  "admin.dispute.close_case": "Закрытие спора",
  "dispute.open": "Открытие спора",
  "admin.finance.mark_paid": "Отметка оплаты",
  "admin.finance.retry": "Повтор платежа",
  "admin.finance.refund": "Возврат платежа",
  "admin.report.dismiss": "Отклонение жалобы",
  "admin.report.warn": "Предупреждение по жалобе",
  "admin.report.suspend": "Приостановка по жалобе",
  "admin.report.delete": "Удаление по жалобе",
  "admin.company.approve": "Одобрение компании",
  "admin.company.reject": "Отклонение компании",
  "admin.company.request_documents": "Запрос документов",
  "admin.company.block": "Блокировка компании",
  "admin.company.deactivate": "Деактивация компании",
  "admin.company.reactivate": "Реактивация компании",
}

export const adminDisputeStatusMeta: Record<
  string,
  { label: string; className: string }
> = {
  open: { label: "Открыт", className: "bg-warning/10 text-warning" },
  under_review: {
    label: "На рассмотрении",
    className: "bg-info/10 text-info",
  },
  resolved: {
    label: "Решён",
    className: "bg-success/10 text-success",
  },
  appealed: { label: "Апелляция", className: "bg-destructive/10 text-destructive" },
}

export const adminDisputeResolutionLabels: Record<string, string> = {
  release_funds: "Выплата исполнителю",
  refund_buyer: "Возврат покупателю",
  partial_refund: "Частичный возврат",
  close_case: "Закрытие дела",
}

export const adminFinanceTypeLabels: Record<string, string> = {
  platform_revenue: "Выручка",
  subscription: "Подписка",
  commission: "Комиссия",
  refund: "Возврат",
  payout: "Выплата",
}

export const adminFinanceStatusMeta: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Ожидает", className: "bg-warning/10 text-warning" },
  processing: { label: "В обработке", className: "bg-info/10 text-info" },
  paid: { label: "Оплачен", className: "bg-success/10 text-success" },
  failed: { label: "Ошибка", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Возвращён", className: "bg-info/10 text-info" },
  cancelled: {
    label: "Отменён",
    className: "bg-muted text-muted-foreground",
  },
}

export const adminFinanceGatewayLabels: Record<string, string> = {
  manual: "Вручную",
  mock: "Mock",
  stripe: "Stripe",
  yookassa: "ЮKassa",
}

export const adminLabel = (
  map: Record<string, string>,
  value: string | null | undefined,
  fallback = "—",
) => {
  if (!value) return fallback
  return map[value] ?? value
}
