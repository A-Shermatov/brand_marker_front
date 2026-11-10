import Link from "next/link"
import { SealCheckIcon as BadgeCheck, CertificateIcon as FileCheck, BuildingsIcon as Building2, ShieldIcon as Shield } from "@phosphor-icons/react/dist/ssr"
import { PageShell } from "@/components/marketplace/page-shell"
import { TrustLevelsGrid } from "@/components/bm/trust-levels-grid"
import { TRUST_LEVELS } from "@/lib/trust-levels"
import { performersUrl } from "@/lib/marketplace-routes"

export default function VerificationPage() {
  return (
    <PageShell>
      <section className="bg-background py-12">
        <div className="mx-auto max-w-[800px] px-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <BadgeCheck size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Доверие на платформе
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Уровни бесплатные — их дают за проверку и честную работу
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-6 rounded-2xl border border-border bg-card p-8">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Building2 size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Что мы проверяем</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>— Регистрационные данные компании или ИП</li>
                <li>— Банковские реквизиты и контактные данные</li>
                <li>— Документы, подтверждающие право оказания услуг</li>
                <li>— Историю отзывов и репутацию на платформе</li>
              </ul>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <FileCheck size={18} className="text-primary" />
                <h2 className="text-lg font-bold text-foreground">Значок верификации</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                «Проверенный» — первый уровень: документы прошли проверку. Это не
                гарантия каждой сделки, но подтверждение, что поставщик реален.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Знак надёжности</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              После проверки знак выдаётся автоматически: за завершённые сделки, рейтинг
              и сделки без споров. Оплата не нужна.
            </p>
            <TrustLevelsGrid />
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {TRUST_LEVELS.map((level) => (
                <li key={level.id}>
                  <span className="font-semibold text-foreground">{level.name}.</span>{" "}
                  {level.description}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={performersUrl({ verified: true })}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Смотреть проверенных поставщиков
          </Link>
        </div>
      </section>
    </PageShell>
  )
}
