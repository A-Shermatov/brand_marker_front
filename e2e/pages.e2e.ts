import type { Page } from "@playwright/test"
import { expect, test, type Role } from "./support/fixtures"
import { expectPageOpens, watchPageHealth } from "./support/page-health"

/**
 * Smoke pass over the whole site: every public page and every page in the
 * menu of each cabinet opens without a crash, a script error or a server error.
 */

const publicPages = [
  "/",
  "/categories",
  "/services",
  "/performers",
  "/tariffs",
  "/for-suppliers",
  "/guarantee",
  "/help",
  "/verification",
  "/login",
  "/register",
  "/forgot-password",
]

test.describe("public pages", () => {
  for (const path of publicPages) {
    test(`${path} opens`, async ({ page }) => {
      const health = watchPageHealth(page)
      await expectPageOpens(page, path, health)
    })
  }

  test("a visitor can go from the catalog to a service and a supplier profile", async ({ page }) => {
    const health = watchPageHealth(page)
    for (const list of ["/services", "/performers"]) {
      await page.goto(list)
      // A card has several links to the same page; the title link covers the whole card.
      const href = await page.locator(`main a[href^="${list}/"]`).first().getAttribute("href")
      await page.locator(`main a[href="${href}"]`).filter({ hasText: /\S/ }).last().click()
      await expect(page).toHaveURL(new RegExp(`${href}$`))
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    }
    expect(health.take()).toEqual([])
  })

  test("a wrong address says so in Russian and shows the ways back", async ({ page }) => {
    const response = await page.goto("/no-such-page")
    expect(response?.status()).toBe(404)
    await expect(page.getByRole("heading", { level: 1, name: "Такой страницы нет" })).toBeVisible()
    const ways = page.getByRole("list", { name: "Куда можно перейти" })
    await expect(ways.getByRole("link")).toHaveCount(3)
    await ways.getByRole("link", { name: /Каталог/ }).click()
    await expect(page).toHaveURL(/\/services$/)
  })
})

/** Every distinct cabinet page linked from the side menu. */
async function menuPages(page: Page, home: string) {
  await page.goto(home)
  const nav = page.locator("aside").first()
  await expect(nav.locator(`a[href^="${home}"]`).first()).toBeVisible()
  const hrefs = await nav.locator(`a[href^="${home}"]`).evaluateAll((links) =>
    links.map((a) => new URL((a as HTMLAnchorElement).href).pathname),
  )
  return [...new Set([home, ...hrefs])]
}

const cabinets: { role: Role; home: string }[] = [
  { role: "buyer", home: "/customer" },
  { role: "supplier", home: "/supplier" },
  { role: "admin", home: "/admin" },
]

for (const { role, home } of cabinets) {
  test(`every ${role} menu page opens`, async ({ pageAs }) => {
    test.setTimeout(240_000)
    const page = await pageAs(role)
    const health = watchPageHealth(page)
    const pages = await menuPages(page, home)
    expect(pages.length, "menu links found").toBeGreaterThan(3)

    for (const path of pages) {
      await test.step(path, async () => {
        await expectPageOpens(page, path, health)
        // A role must never be bounced out of its own menu.
        expect(new URL(page.url()).pathname.startsWith(home), `${path}: left the cabinet`).toBe(true)
      })
    }
  })
}
