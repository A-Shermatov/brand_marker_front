import Link from "next/link"
import { ChatTextIcon as MessageSquare } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { loginRedirect } from "@/lib/marketplace-routes"

const FAQ = [
  {
    q: "Кто держит деньги до приёмки?",
    a: "Банк‑партнёр. Площадка не хранит средства клиентов и не видит полные данные карт.",
  },
  {
    q: "Сколько стоит площадка для покупателя?",
    a: "Для покупателя бесплатно. Комиссия 4% удерживается с поставщика при выплате.",
  },
  {
    q: "Что если поставщик не отгрузит товар?",
    a: "Вы не нажимаете «Принять» — деньги остаются в банке и возвращаются вам по правилам спора.",
  },
  {
    q: "Можно ли платить вне площадки?",
    a: "Нет. Оплата вне площадки снимает гарантию сделки и защиту документов.",
  },
  {
    q: "Как проверяют поставщиков?",
    a: "По документам компании: ИНН, устав, реквизиты. Значок «Проверенная компания» появляется после проверки.",
  },
]

export const LandingFaq = () => (
  <section className="mx-auto mt-16 max-w-[1200px] px-4 lg:px-8">
    <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
      <div className="grid content-start gap-3">
        <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">Частые вопросы</h2>
        <p className="text-[15px] text-mute">
          Не нашли ответ? Напишите в поддержку — ответим в течение часа в рабочее время.
        </p>
        <Button asChild variant="outline" className="justify-self-start">
          <Link href={loginRedirect("/customer?support=1")}>
            <MessageSquare className="size-4" />
            Написать в поддержку
          </Link>
        </Button>
      </div>
      <div className="grid gap-2">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-2xl border border-line bg-white open:pb-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[16px] font-semibold text-ink marker:content-none">
              {item.q}
              <span className="text-mute transition group-open:rotate-45">+</span>
            </summary>
            <p className="px-5 text-[15px] leading-relaxed text-mute">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
)
