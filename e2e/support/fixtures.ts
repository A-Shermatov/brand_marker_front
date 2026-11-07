import { test as base, type BrowserContext, type Page } from "@playwright/test"
import { sessions } from "./accounts"

export type Role = keyof typeof sessions

type Fixtures = {
  /**
   * A page signed in as the role, in its own browser context, so several roles
   * can act in one test. Playwright traces and screenshots these contexts too.
   */
  pageAs: (role: Role) => Promise<Page>
}

export const test = base.extend<Fixtures>({
  pageAs: async ({ browser }, use) => {
    const opened: BrowserContext[] = []
    await use(async (role) => {
      const context = await browser.newContext({ storageState: sessions[role] })
      opened.push(context)
      return context.newPage()
    })
    await Promise.all(opened.map((context) => context.close()))
  },
})

export { expect } from "@playwright/test"

/** A date `days` from today as the site's date fields take it: дд.мм.гггг. */
export function ruDate(days: number) {
  const d = new Date(Date.now() + days * 86_400_000)
  return [d.getDate(), d.getMonth() + 1].map((n) => String(n).padStart(2, "0")).join(".") + `.${d.getFullYear()}`
}

/** A short suffix that keeps names created by this run apart from earlier runs. */
export const runId = Date.now().toString(36).slice(-5)
