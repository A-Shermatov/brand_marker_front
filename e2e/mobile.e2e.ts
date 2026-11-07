import type { Page } from "@playwright/test"
import { expect, test } from "./support/fixtures"
import { watchPageHealth } from "./support/page-health"

/** Runs in the "mobile" project, on a phone-sized screen with touch. */

async function expectNoSideScroll(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState("networkidle")
  const extra = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(extra, `${path} scrolls sideways by ${extra}px`).toBeLessThanOrEqual(1)
}

test.describe("on a phone", () => {
  for (const path of ["/", "/services", "/performers", "/tariffs", "/login", "/register"]) {
    test(`${path} fits the screen`, async ({ page }) => {
      await expectNoSideScroll(page, path)
    })
  }

  test("the buyer cabinet fits the screen and its bottom menu works", async ({ pageAs }) => {
    const page = await pageAs("buyer")
    const health = watchPageHealth(page)
    for (const path of ["/customer", "/customer/rfqs", "/customer/contracts"]) {
      await expectNoSideScroll(page, path)
    }

    await page.goto("/customer")
    const menu = page.getByRole("navigation", { name: "Разделы" })
    await expect(menu).toBeVisible()
    await menu.getByRole("link", { name: "Сделки" }).click()
    await expect(page).toHaveURL(/\/customer\/contracts/)
    await menu.getByRole("link", { name: "Закупки" }).click()
    await expect(page).toHaveURL(/\/customer\/rfqs/)
    expect(health.take()).toEqual([])
  })

  test("the supplier cabinet fits the screen", async ({ pageAs }) => {
    const page = await pageAs("supplier")
    for (const path of ["/supplier", "/supplier/rfqs", "/supplier/finance"]) {
      await expectNoSideScroll(page, path)
    }
  })
})
