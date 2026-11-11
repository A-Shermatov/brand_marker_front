"use client"

import Link from "next/link"
import { BuildingsIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { useSideProfiles } from "@/components/company/profile-switch-menu"
import { useHydrated } from "@/hooks/use-hydrated"

/**
 * For a person who works under their own name: what a company would add, and
 * the way to create one. A private person has no "Компания" page in the menu
 * — there is nothing to manage there — so the offer lives in the profile.
 * Hidden for anyone working from a company profile.
 */
export function CreateCompanyCard({ side }: { side: "buyer" | "supplier" }) {
  const hydrated = useHydrated()
  const { profiles, active } = useSideProfiles(side)
  if (!hydrated || active?.kind !== "individual") return null

  const company = profiles.find((profile) => profile.kind === "company")
  const newHref = side === "supplier" ? "/supplier/company/new" : "/customer/company/new"

  return (
    <section
      aria-label="Работа от имени компании"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:p-6"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden>
        <BuildingsIcon weight="duotone" className="size-6" />
      </span>
      {company ? (
        <div className="min-w-0 flex-1">
          <h2 className="text-[15.5px] font-semibold text-ink">Сейчас вы работаете как частное лицо</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-mute">
            Вы также состоите в компании «{company.display_name}». Переключиться на неё можно в меню аккаунта —
            справа вверху, «От чьего имени работаю».
          </p>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15.5px] font-semibold text-ink">Работаете как компания или ИП?</h2>
            <p className="mt-1 text-[14px] leading-relaxed text-mute">
              Создайте компанию: появятся сотрудники с разными правами, реквизиты для договоров
              {side === "supplier" ? " и страница компании для покупателей" : ""}. Личный профиль останется, между
              ними можно переключаться.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href={newHref}>
              <PlusIcon weight="bold" className="size-4" />
              Создать компанию
            </Link>
          </Button>
        </>
      )}
    </section>
  )
}
