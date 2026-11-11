import { companyRoleLabel } from "@/lib/company-team"
import { cn } from "@/lib/utils"

type ContactPersonProps = {
  /** The employee who wrote the request or the offer. */
  name?: string | null
  /** Their role in the company now; empty for someone who has left it. */
  role?: string | null
  className?: string
}

/** "Алишер Рахимов, менеджер" — who speaks for the company; "" when unknown. */
export const contactPersonLabel = (name?: string | null, role?: string | null): string => {
  const person = name?.trim()
  if (!person) return ""
  return role ? `${person}, ${companyRoleLabel(role).toLowerCase()}` : person
}

/**
 * The line under a company's name in a request or an offer: the other side
 * deals with the company, and sees which of its people to talk to.
 */
export const ContactPerson = ({ name, role, className }: ContactPersonProps) => {
  const label = contactPersonLabel(name, role)
  if (!label) return null
  return (
    <p className={cn("text-[13px] text-mute", className)} data-testid="contact-person">
      Контактное лицо: <span className="font-medium text-ink-soft">{label}</span>
    </p>
  )
}
