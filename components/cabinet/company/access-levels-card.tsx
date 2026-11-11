import { COMPANY_ROLE_ACCESS, COMPANY_ROLE_LABELS } from "@/lib/company-team"
import { COMPANY_ROLES } from "@/types"
import { cn } from "@/lib/utils"

/** "Who can do what": every access level in plain words. */
export const AccessLevelsCard = ({ className }: { className?: string }) => (
  <section className={cn("rounded-2xl border border-line bg-card p-5", className)}>
    <h2 className="text-[15.5px] font-semibold">Уровни доступа</h2>
    <dl className="mt-3 grid gap-3.5">
      {COMPANY_ROLES.map((role) => {
        const access = COMPANY_ROLE_ACCESS[role]
        return (
          <div key={role}>
            <dt className="text-[14px] font-semibold">{COMPANY_ROLE_LABELS[role]}</dt>
            <dd className="text-[13.5px] leading-snug text-mute">
              {access.can}.
              {access.cannot ? (
                <>
                  {" "}
                  <span className="text-ink-soft">Не может:</span>{" "}
                  {access.cannot.charAt(0).toLowerCase() + access.cannot.slice(1)}.
                </>
              ) : null}
            </dd>
          </div>
        )
      })}
    </dl>
    <p className="mt-4 border-t border-line pt-3 text-[13px] leading-snug text-mute">
      Руководитель в компании один. Чтобы передать компанию другому человеку, напишите в
      поддержку.
    </p>
  </section>
)
