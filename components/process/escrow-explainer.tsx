import { cn } from "@/lib/utils"

const STEPS = [
  { title: "Вы оплачиваете", text: "Картой или по счёту — деньги уходят в банк‑партнёр" },
  { title: "Банк удерживает", text: "Поставщик видит: оплата есть, можно отгружать" },
  { title: "Поставщик отгружает", text: "Накладная появляется в сделке" },
  { title: "Вы принимаете", text: "Только тогда деньги переходят поставщику" },
] as const

export const EscrowExplainer = ({ className }: { className?: string }) => (
  <section
    className={cn("grid gap-4 rounded-2xl bg-contrast p-5 text-white md:p-6", className)}
    aria-labelledby="escrow-explainer-title"
  >
    <div>
      <h2 id="escrow-explainer-title" className="text-[20px] font-bold tracking-[-0.02em]">
        Как защищены ваши деньги
      </h2>
      <p className="mt-1 text-[14.5px] text-white/70">
        Площадка не держит средства у себя — их удерживает банк‑партнёр до вашей приёмки.
      </p>
    </div>
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li key={step.title} className="grid content-start gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-4">
          <span className="text-[13px] font-semibold text-brand-300">Шаг {index + 1}</span>
          <p className="font-bold text-[15px]">{step.title}</p>
          <p className="text-[13.5px] text-white/65">{step.text}</p>
        </li>
      ))}
    </ol>
  </section>
)
