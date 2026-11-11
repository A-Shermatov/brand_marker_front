/**
 * "You no longer have access to this company": the API refused a request made
 * for a company the person was removed from. Raised by the API client, handled
 * once in CompanyAccessWatcher, which puts the person back in a profile they
 * still have.
 */

export const COMPANY_ACCESS_REVOKED = "company_access_revoked"
export const COMPANY_ROLE_FORBIDDEN = "company_role_forbidden"

type Listener = (message: string) => void
const listeners = new Set<Listener>()

export const onCompanyAccessRevoked = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const notifyCompanyAccessRevoked = (message: string) => {
  for (const listener of listeners) listener(message)
}
