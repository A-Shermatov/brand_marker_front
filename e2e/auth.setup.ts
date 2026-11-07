import { test as setup } from "@playwright/test"
import { accounts, sessions } from "./support/accounts"
import { signIn, signInAdmin } from "./support/login"

// Every role signs in once through the real forms; the tests reuse the sessions.

setup("buyer signs in", async ({ page }) => {
  await signIn(page, accounts.buyer, "customer")
  await page.context().storageState({ path: sessions.buyer })
})

setup("supplier signs in", async ({ page }) => {
  await signIn(page, accounts.supplier, "supplier")
  await page.context().storageState({ path: sessions.supplier })
})

setup("person with both profiles signs in to each", async ({ browser }) => {
  for (const [role, path] of [
    ["customer", sessions.bothBuyer],
    ["supplier", sessions.bothSupplier],
  ] as const) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await signIn(page, accounts.both, role)
    await context.storageState({ path })
    await context.close()
  }
})

setup("admin signs in", async ({ page }) => {
  await signInAdmin(page, accounts.admin)
  await page.context().storageState({ path: sessions.admin })
})
