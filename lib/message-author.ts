import { companyRoleLabel } from "@/lib/company-team"

type AuthorFields = {
  sender_name?: string | null
  sender_role?: string | null
  sender_company?: string | null
}

/**
 * "Руководитель, ООО «Сомон Трейд»": who stands behind a message in a B2B chat.
 * Empty for a private person or when the server did not send it.
 */
export const messageAffiliation = (message: AuthorFields): string =>
  [message.sender_role ? companyRoleLabel(message.sender_role) : null, message.sender_company?.trim()]
    .filter(Boolean)
    .join(", ")
