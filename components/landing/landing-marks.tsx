import Link from "next/link"
import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr"
import { CompanyName, PlanMark, TrustMark } from "@/components/bm"
import { TRUST_LEVELS, TRUST_MARK_NAME } from "@/lib/trust-levels"
import { plans } from "@/lib/subscription"
import { forSuppliersUrl } from "@/lib/marketplace-routes"

/** Explains the marks buyers see next to supplier names. */
export const LandingMarks = () => (
  <section id="marks" className="mx-auto mt-16 max-w-[1200px] px-4 lg:px-8">
    <div className="grid gap-8 rounded-2xl border border-line bg-white p-6 md:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="grid content-start gap-4">
        <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink">
          Что значат значки рядом с названием
        </h2>
        <p className="text-[15.5px] text-mute">
          Они стоят в каталоге, заявках, сделках и чатах. Наведите на значок, чтобы
          увидеть, за что он выдан.
        </p>
        <div className="rounded-xl border border-line bg-canvas/60 p-4">
          <CompanyName name="ТехноСнаб" verified tier="diamond" plan="business" size="lg" />
          <p className="mt-1 text-[13px] text-mute">Так выглядит поставщик с высшим знаком</p>
        </div>
      </div>

      <dl className="grid gap-5">
        <div className="grid grid-cols-[44px_1fr] gap-3">
          <dt className="grid size-11 place-items-center rounded-lg bg-brand-50">
            <SealCheckIcon weight="fill" className="size-6 text-brand-600" aria-hidden />
          </dt>
          <dd>
            <b className="text-[15px] font-semibold text-ink">Проверена по документам</b>
            <p className="text-[14px] text-mute">Площадка сверила регистрацию и реквизиты компании.</p>
          </dd>
        </div>
        <div className="grid grid-cols-[44px_1fr] gap-3">
          <dt className="flex items-center">
            <TrustMark tier="gold" size={40} still decorative />
          </dt>
          <dd>
            <b className="text-[15px] font-semibold text-ink">{TRUST_MARK_NAME}</b>
            <p className="text-[14px] text-mute">
              {TRUST_LEVELS.map((l) => l.name).join(", ")}. Зарабатывается завершёнными
              сделками, рейтингом и сделками без споров. Купить нельзя.
            </p>
            <div className="mt-2 flex items-center gap-2">
              {TRUST_LEVELS.map((l) => (
                <TrustMark key={l.id} tier={l.id} size={26} />
              ))}
            </div>
          </dd>
        </div>
        <div className="grid grid-cols-[44px_1fr] gap-3">
          <dt className="flex items-center">
            <PlanMark plan="pro" size={36} decorative />
          </dt>
          <dd>
            <b className="text-[15px] font-semibold text-ink">Тариф подписки</b>
            <p className="text-[14px] text-mute">
              {plans.map((p) => p.name).join(", ")}: платное продвижение в каталоге. На
              надёжность не влияет.{" "}
              <Link href={forSuppliersUrl()} className="font-medium text-brand-700 hover:underline">
                Тарифы для поставщиков
              </Link>
            </p>
            <div className="mt-2 flex items-center gap-2">
              {plans.map((p) => (
                <PlanMark key={p.id} plan={p.id} size={22} />
              ))}
            </div>
          </dd>
        </div>
      </dl>
    </div>
  </section>
)
