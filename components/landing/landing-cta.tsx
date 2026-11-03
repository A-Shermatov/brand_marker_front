import Link from "next/link"
import { Button } from "@/components/ui/button"
import { forSuppliersUrl, registerUrl, tariffsUrl } from "@/lib/marketplace-routes"

/** Compact CTA — full seller story lives on `/for-suppliers`. */
export const LandingCta = () => (
  <section className="mx-auto mt-16 mb-8 max-w-[1200px] px-4 lg:px-8">
    <div className="grid gap-6 rounded-2xl border border-line bg-white p-6 md:grid-cols-[1.2fr_auto] md:items-center md:p-8">
      <div className="grid gap-2">
        <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
          Продавцам: комиссия 4% только с оплаченных сделок
        </h2>
        <p className="max-w-2xl text-[15px] text-mute">
          Размещение товаров и ответы на заявки бесплатны. Деньги приходят на ваш счёт после приёмки
          покупателем — банк уже видит оплату до отгрузки.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href={registerUrl()}>Начать продавать</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={forSuppliersUrl()}>Подробнее</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={tariffsUrl()}>Тарифы</Link>
        </Button>
      </div>
    </div>
  </section>
)
