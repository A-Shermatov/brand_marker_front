"use client"

import {
  CheckIcon as Check,
  HandshakeIcon as Handshake,
  PaperPlaneTiltIcon as Send,
  ScalesIcon as Scales,
  ShieldCheckIcon as ShieldCheck,
} from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type WizardStepItem = { step: number; label: string }

/** What each step asks for, under its name. */
const STEP_HINT: Record<number, string> = {
  1: "Что нужно и сколько",
  2: "Бюджет, сроки, оплата",
  3: "Проверить и отправить",
}

/**
 * The three steps of a request as numbered stops: done ones carry a tick,
 * the current one is outlined, the rest wait in grey.
 */
export const RfqWizardSteps = ({
  steps,
  current,
}: {
  steps: WizardStepItem[]
  current: number
}) => (
  <ol className="mb-6 grid grid-cols-3 gap-2" aria-label="Шаги создания заявки">
    {steps.map((item, index) => {
      const done = item.step < current
      const active = item.step === current
      return (
        <li
          key={item.step}
          className="flex min-w-0 items-start gap-2.5"
          aria-current={active ? "step" : undefined}
        >
          <span
            className={cn(
              "relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tnum",
              done && "bg-brand-600 text-white",
              active && "bg-card text-brand-700 ring-2 ring-brand-600",
              !done && !active && "bg-surface-muted text-mute",
            )}
          >
            {done ? <Check weight="bold" className="size-3.5" aria-hidden /> : item.step}
          </span>
          <span className="grid min-w-0 pt-0.5">
            <span
              className={cn(
                "truncate text-[13.5px]",
                active ? "font-semibold text-ink" : done ? "font-medium text-ink-soft" : "text-mute",
              )}
            >
              {item.label}
            </span>
            <span className="hidden truncate text-[12px] text-mute sm:block">{STEP_HINT[item.step]}</span>
          </span>
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                "mt-3.5 hidden h-0.5 min-w-4 flex-1 rounded-full sm:block",
                done ? "bg-brand-500" : "bg-line",
              )}
            />
          ) : null}
        </li>
      )
    })}
  </ol>
)

const HOW_IT_WORKS = [
  {
    Icon: Send,
    title: "Поставщики пришлют цены",
    text: "Заявку увидят поставщики из вашей категории. Предложения приходят в «Мои заявки».",
  },
  {
    Icon: Scales,
    title: "Вы сравните и выберете",
    text: "Цена, сроки и рейтинг рядом. Можно задать вопрос в чате до выбора.",
  },
  {
    Icon: ShieldCheck,
    title: "Деньги под защитой",
    text: "Банк держит оплату, пока вы не примете товар или работу.",
  },
] as const

/** A quiet column beside the form: what happens after the request is sent. */
export const RfqHowItWorks = () => (
  <aside className="hidden xl:block" aria-label="Как работает заявка">
    <div className="sticky top-24 grid gap-4 rounded-2xl border border-line bg-card p-5">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        <Handshake className="size-5 text-brand-600" aria-hidden />
        Как работает заявка
      </p>
      <ul className="grid gap-4">
        {HOW_IT_WORKS.map(({ Icon, title, text }) => (
          <li key={title} className="grid grid-cols-[32px_1fr] gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="grid gap-0.5">
              <b className="text-[13.5px] font-semibold text-ink">{title}</b>
              <span className="text-[12.5px] leading-[1.45] text-mute">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-line pt-3 text-[12.5px] text-mute">
        Публикация бесплатна. Цену можно не указывать — тогда её назовут поставщики.
      </p>
    </div>
  </aside>
)
