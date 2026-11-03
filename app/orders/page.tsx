"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ClockIcon as Clock, FileTextIcon as FileText, MapPinIcon as MapPin, UsersIcon as Users } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { getRecentRequests } from "@/lib/mock/marketplace-requests"
import { getIcon } from "@/lib/icon-map"
import { supplierRfqRedirect } from "@/lib/marketplace-routes"
import { createRfqHref } from "@/lib/create-rfq-href"
import { isApiEnabled } from "@/lib/api/config"
import { usePublicRfqsQuery } from "@/hooks/api/use-public-query"
import { mapRfqToRequest } from "@/lib/marketplace-hybrid"

export default function OrdersPage() {
  const useApi = isApiEnabled()
  const { data: apiRfqs } = usePublicRfqsQuery(useApi)
  const mockOrders = getRecentRequests()

  const orders = useMemo(() => {
    if (!useApi) return mockOrders
    const items = apiRfqs?.items ?? []
    if (!items.length) return []
    return items.map(mapRfqToRequest)
  }, [useApi, apiRfqs, mockOrders])

  return (
    <PageShell>
      <section className="bg-white border-b border-border py-9">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Свежие заказы</h1>
                <p className="text-sm text-muted-foreground">Актуальные B2B-запросы от компаний</p>
              </div>
            </div>
            <Link
              href={createRfqHref()}
              className="text-sm font-bold bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
              Разместить заказ
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => {
              const Icon = getIcon(order.icon)
              return (
                <div
                  key={order.id}
                  className="border border-border rounded-2xl p-5 bg-white hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-foreground leading-snug">{order.title}</h2>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={10} className="text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{order.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div>
                      <div className="text-sm font-bold text-primary">{order.budget}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <MapPin size={9} />
                        {order.city}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary justify-end">
                        <Users size={11} />
                        {order.offers} предложений
                      </div>
                      <Link
                        href={supplierRfqRedirect()}
                        className="text-[10px] text-primary font-semibold mt-1 inline-block hover:underline"
                      >
                        Откликнуться
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </PageShell>
  )
}
