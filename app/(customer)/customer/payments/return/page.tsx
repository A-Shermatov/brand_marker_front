"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ClockIcon as Clock, CircleNotchIcon as Loader2, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { SuccessCheck } from "@/components/ui/success-check"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSyncAlifOrderMutation } from "@/hooks/api/use-payments-query"
import type { AlifOrderSyncResponse, GatewayPaymentStatus } from "@/lib/api/payments"

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 10
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

type ViewState = GatewayPaymentStatus | "checking" | "timeout" | "error" | "invalid"

const SUCCESS_VIEWS = new Set<ViewState>(["ok", "to_approve", "partially_approved"])

const resolveViewFromSync = (result: AlifOrderSyncResponse): ViewState | "pending" => {
  const status = result.payment_status
  if (status === "pending") {
    // Milestone already funded means hold succeeded even if gateway status lags.
    if (result.milestone_status === "funded") return "to_approve"
    return "pending"
  }
  if (status === "partially_approved") return "to_approve"
  if (
    result.milestone_status === "funded" &&
    (status === "ok" || status === "to_approve")
  ) {
    return status === "ok" ? "ok" : "to_approve"
  }
  if (result.milestone_status === "funded" && !["failed", "canceled"].includes(status)) {
    return "to_approve"
  }
  return status
}

const viewCopy: Record<ViewState, { title: string; description: string; icon: React.ReactNode }> = {
  checking: {
    title: "Проверяем оплату",
    description: "Получаем статус платежа от Alif…",
    icon: <Loader2 className="animate-spin" />,
  },
  pending: {
    title: "Ожидаем подтверждение",
    description: "Платёж ещё обрабатывается. Страница обновится автоматически.",
    icon: <Clock />,
  },
  timeout: {
    title: "Ожидаем подтверждение",
    description:
      "Alif пока не подтвердил платёж. Статус этапа обновится, как только придёт уведомление.",
    icon: <Clock />,
  },
  ok: {
    title: "Оплата прошла",
    description:
      "Средства зарезервированы на безопасной сделке. Исполнитель получит их после того, как вы примете работу.",
    icon: <SuccessCheck />,
  },
  to_approve: {
    title: "Оплата прошла",
    description:
      "Средства зарезервированы до приёмки. Они уйдут исполнителю, когда вы подтвердите результат работы.",
    icon: <SuccessCheck />,
  },
  partially_approved: {
    title: "Оплата прошла",
    description:
      "Средства зарезервированы до приёмки. Они уйдут исполнителю, когда вы подтвердите результат работы.",
    icon: <SuccessCheck />,
  },
  failed: {
    title: "Оплата не прошла",
    description: "Списания не было. Попробуйте оплатить этап ещё раз.",
    icon: <XCircle />,
  },
  canceled: {
    title: "Платёж отменён",
    description: "Средства возвращены на карту.",
    icon: <XCircle />,
  },
  error: {
    title: "Не удалось проверить оплату",
    description: "Попробуйте обновить страницу позже или откройте сделку.",
    icon: <XCircle />,
  },
  invalid: {
    title: "Платёж не найден",
    description: "Ссылка возврата некорректна.",
    icon: <XCircle />,
  },
}

const PaymentReturnContent = () => {
  const hydrated = useHydrated()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id") ?? ""
  const contractIdParam = Number(searchParams.get("contract_id"))
  const isValidOrder = ORDER_ID_PATTERN.test(orderId)
  const { mutateAsync: syncOrder } = useSyncAlifOrderMutation()
  const [view, setView] = useState<ViewState>(isValidOrder ? "checking" : "invalid")
  const [contractId, setContractId] = useState<number | null>(
    Number.isInteger(contractIdParam) && contractIdParam > 0 ? contractIdParam : null,
  )

  useEffect(() => {
    if (!hydrated || !isValidOrder) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async (attempt: number) => {
      try {
        const result = await syncOrder(orderId)
        if (cancelled) return
        setContractId(result.contract_id)
        const next = resolveViewFromSync(result)
        if (next !== "pending") {
          setView(next)
          return
        }
        if (attempt >= MAX_ATTEMPTS) {
          setView("timeout")
          return
        }
        setView("pending")
        timer = setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS)
      } catch {
        if (!cancelled) setView("error")
      }
    }

    poll(1)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [hydrated, isValidOrder, orderId, syncOrder])

  const copy = viewCopy[view] ?? viewCopy.error
  const isSuccess = SUCCESS_VIEWS.has(view)
  const waiting = view === "pending" || view === "timeout"
  const tone = isSuccess ? "success" : view === "checking" ? "brand" : waiting ? "wait" : "danger"
  const backHref = contractId ? `/customer/contracts/${contractId}` : "/customer/payments"
  const backLabel = contractId ? "Вернуться к сделке" : "К платежам"

  return (
    <PageFrame>
      <PageHeader title="Результат оплаты" backHref={backHref} backLabel={backLabel} />
      <PageSurface aria-live="polite" aria-busy={view === "checking" || view === "pending"}>
        <PageEmptyState
          // Remounted per state, so the tick is drawn when the payment is confirmed.
          key={view}
          tone={tone}
          icon={copy.icon}
          title={copy.title}
          description={copy.description}
          action={
            <Button asChild variant={isSuccess ? "default" : "outline"}>
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          }
        />
      </PageSurface>
    </PageFrame>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturnContent />
    </Suspense>
  )
}
