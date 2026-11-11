import Link from "next/link"
import { CheckIcon, LockIcon as Lock, LockSimpleIcon, CertificateIcon as FileCheck, TrayIcon as Inbox } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { FreePlanMark, PlanMark, TrustLevelsGrid } from "@/components/bm"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { plans } from "@/lib/subscription"
import { TRUST_MARK_NAME } from "@/lib/trust-levels"
import { loginRedirect, registerUrl } from "@/lib/marketplace-routes"
import { cn } from "@/lib/utils"

const BENEFITS = [
  {
    Icon: Inbox,
    title: "Заявки покупателей",
    text: "Отвечайте ценой прямо из кабинета.",
  },
  {
    Icon: Lock,
    title: "Оплата гарантирована",
    text: "Отгружайте только после того, как деньги в банке.",
  },
  {
    Icon: FileCheck,
    title: "Документы сами",
    text: "Договор, счёт, накладная и акт формируются в сделке.",
  },
] as const

// Limits mirror the backend (app/modules/subscription/services/common.py).
const COMPARE: readonly (readonly [string, ...string[]])[] = [
  ["Цена в месяц", "0 TJS", ...plans.map((p) => formatPrice(p.price))],
  ["Активных позиций", "10", "10", "50", "без лимита"],
  ["Компаний в аккаунте", "1", "2", "5", "без лимита"],
  ["Место в каталоге и в списке предложений", "по порядку", "выше обычных", "выше «Старта»", "первое"],
  ["Выделение цветом и метка «В топе»", "—", "да", "да", "да"],
]

const HOW_TO = [
  ["1", "Выберите тариф", "В кабинете продавца → «Подписка»."],
  [
    "2",
    "Оплатите",
    "Картой — тариф включится сразу. По счёту — после поступления денег.",
  ],
  [
    "3",
    "Вы подниметесь в списках",
    "Товары, услуги и предложения встанут первыми и будут выделены цветом.",
  ],
] as const

export default function ForSuppliersPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-10 lg:px-8">
        <section className="max-w-[960px]">
          <h1 className="text-[40px] font-semibold leading-[1.08] tracking-[-0.035em] text-balance text-ink md:text-[48px]">
            Продавайте компаниям по всему Таджикистану
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] text-mute">
            Покупатель оплачивает заказ до отгрузки — вы видите, что деньги есть, и
            отгружаете без риска.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href={registerUrl()}>Зарегистрировать компанию</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={loginRedirect("/supplier")}>Открыть кабинет продавца</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {BENEFITS.map(({ Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-line bg-card p-5"
              >
                <Icon weight="duotone" className="mb-4 size-7 text-brand-700" aria-hidden />
                <b className="text-[16px] font-semibold text-ink">{title}</b>
                <p className="mt-1 text-[14.5px] text-mute">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tariffs" className="scroll-mt-28 pt-14">
          <div className="mb-8 grid max-w-3xl gap-3">
            <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-balance text-ink md:text-[40px]">
              Тарифы для поставщиков
            </h2>
            <p className="text-[16.5px] text-mute">
              Начать можно без подписки. Тариф ставит товары, услуги и предложения первыми
              в списках, выделяет их цветом и расширяет лимиты. Рядом с названием остаётся
              только знак надёжности: его купить нельзя, его выдаёт площадка за сделки.
            </p>
          </div>

          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="grid content-start gap-4 rounded-2xl border border-dashed border-line-strong bg-card/60 p-5">
              <FreePlanMark size={40} />
              <div>
                <b className="text-[18px] font-semibold text-ink">Без подписки</b>
                <p className="mt-1 text-[14px] text-mute">Чтобы попробовать площадку</p>
                <p className="mt-3 text-[24px] font-semibold text-ink tnum">0 TJS</p>
              </div>
              <ul className="grid gap-2 text-[14px] text-ink-soft">
                <li className="flex gap-2">
                  <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  До 10 активных позиций
                </li>
                <li className="flex gap-2">
                  <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  Одна компания
                </li>
                <li className="flex gap-2">
                  <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  Ответы на заявки и сделки с гарантией
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-auto">
                <Link href={registerUrl()}>Зарегистрироваться</Link>
              </Button>
            </article>

            {plans.map((plan) => (
              <article
                key={plan.id}
                className={cn(
                  "relative grid content-start gap-4 rounded-2xl border bg-card p-5",
                  plan.highlighted
                    ? "border-brand-600 shadow-[0_0_0_1px_var(--brand-600)]"
                    : "border-line",
                )}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-2.5 left-5 rounded-full bg-brand-600 px-2 py-0.5 text-[11.5px] font-semibold text-white">
                    Чаще выбирают
                  </span>
                ) : null}
                <PlanMark plan={plan.id} size={40} />
                <div>
                  <b className="text-[18px] font-semibold text-ink">{plan.name}</b>
                  <p className="mt-1 text-[14px] text-mute">{plan.tagline}</p>
                  <p className="mt-3 flex items-baseline gap-1">
                    <span className="text-[24px] font-semibold text-ink tnum">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-[13.5px] text-mute">в месяц</span>
                  </p>
                </div>
                <ul className="grid gap-2 text-[14px] text-ink-soft">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan.highlighted ? "default" : "outline"} className="mt-auto">
                  <Link href={loginRedirect("/supplier/subscription")}>Подключить</Link>
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead>
                <tr className="border-b border-line bg-canvas/60">
                  <th className="px-4 py-3 font-medium text-mute">Что входит</th>
                  <th className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-semibold text-ink">
                      <FreePlanMark size={18} />
                      Без подписки
                    </span>
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-ink">
                        <PlanMark plan={plan.id} size={18} decorative still />
                        {plan.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {COMPARE.map(([label, ...cells]) => (
                  <tr key={label}>
                    <td className="px-4 py-3 text-mute">{label}</td>
                    {cells.map((cell, i) => (
                      <td key={i} className="px-4 py-3 font-medium text-ink">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14 grid gap-6 rounded-2xl border border-line bg-card p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:p-8">
          <div className="grid gap-3">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-mute">
              <LockSimpleIcon className="size-4" aria-hidden />
              Не продаётся
            </span>
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
              {TRUST_MARK_NAME}: серебро, золото, алмаз
            </h2>
            <p className="text-[15.5px] text-ink-soft">
              Тариф даёт продвижение, знак надёжности показывает заслуженное доверие.
              Площадка выдаёт его автоматически даже без подписки и повышает уровень за
              завершённые сделки, рейтинг и сделки без споров.
            </p>
          </div>
          <TrustLevelsGrid className="lg:justify-self-stretch" />
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3">
          {HOW_TO.map(([n, title, text]) => (
            <div
              key={n}
              className="rounded-2xl border border-line bg-card p-5"
            >
              <span className="text-[13px] font-medium text-mute tnum">Шаг {n}</span>
              <b className="mt-1 block text-[16px] font-semibold text-ink">{title}</b>
              <p className="mt-1 text-[14px] text-mute">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </PageShell>
  )
}
