"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ClockIcon as Clock, CircleNotchIcon as Loader2, XCircleIcon as XCircle } from "@phosphor-icons/react/dist/ssr"
import { SuccessCheck } from "@/components/ui/success-check"
import { PageEmptyState, PageFrame, PageHeader, PageSurface } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/use-hydrated"
import { useSyncSubscriptionOrderMutation } from "@/hooks/api/use-supplier-subscription-query"

const POLL_INTERVAL_MS = 3000
const MAX_ATTEMPTS = 10
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

type ViewState = "checking" | "pending" | "ok" | "failed" | "canceled" | "timeout" | "error" | "invalid"

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
      "Alif пока не подтвердил платёж. Подписка активируется, как только придёт уведомление.",
    icon: <Clock />,
  },
  ok: {
    title: "Подписка оплачена",
    description: "Тариф активирован на 30 дней. Ваши предложения получают приоритет в каталоге.",
    icon: <SuccessCheck />,
  },
  failed: {
    title: "Оплата не прошла",
    description: "Списания не было. Попробуйте оформить подписку ещё раз.",
    icon: <XCircle />,
  },
  canceled: {
    title: "Платёж отменён",
    description: "Подписка не активирована.",
    icon: <XCircle />,
  },
  error: {
    title: "Не удалось проверить оплату",
    description: "Попробуйте обновить страницу позже или откройте раздел подписки.",
    icon: <XCircle />,
  },
  invalid: {
    title: "Платёж не найден",
    description: "Ссылка возврата некорректна.",
    icon: <XCircle />,
  },
}

const SubscriptionReturnContent = () => {
  const hydrated = useHydrated()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id") ?? ""
  const isValidOrder = ORDER_ID_PATTERN.test(orderId)
  const { mutateAsync: syncOrder } = useSyncSubscriptionOrderMutation()
  const [view, setView] = useState<ViewState>(isValidOrder ? "checking" : "invalid")

  useEffect(() => {
    if (!hydrated || !isValidOrder) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async (attempt: number) => {
      try {
        const result = await syncOrder(orderId)
        if (cancelled) return
        if (result.is_active || result.payment_status === "ok") {
          setView("ok")
          return
        }
        if (result.payment_status === "failed") {
          setView("failed")
          return
        }
        if (result.payment_status === "canceled") {
          setView("canceled")
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
  const isSuccess = view === "ok"
  const waiting = view === "pending" || view === "timeout"
  const tone = isSuccess ? "success" : view === "checking" ? "brand" : waiting ? "wait" : "danger"

  return (
    <PageFrame>
      <PageHeader title="Оплата подписки" backHref="/supplier/subscription" backLabel="К подписке" />
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
              <Link href="/supplier/subscription">К подписке</Link>
            </Button>
          }
        />
      </PageSurface>
    </PageFrame>
  )
}

export default function SubscriptionReturnPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionReturnContent />
    </Suspense>
  )
}
