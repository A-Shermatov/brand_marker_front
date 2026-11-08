import { expect, test } from "./support/fixtures"

/**
 * Night theme: one click on the moon turns the page dark at once, one click on
 * the sun turns it light again. The choice outlives a reload, and the
 * computer's own dark setting no longer decides it.
 */

test.use({ colorScheme: "dark" })

test("one click switches the night look on and off and the choice stays", async ({ page, pageAs }) => {
  const html = page.locator("html")

  await test.step("the site starts light even when the computer is dark", async () => {
    await page.goto("/")
    await expect(html).not.toHaveClass(/\bdark\b/)
  })

  await test.step("one click on the moon turns the page dark", async () => {
    await page.getByRole("button", { name: "Включить тёмную тему" }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    // The page itself goes navy, not just a class on the root.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(background).toBe("rgb(10, 17, 34)")
  })

  await test.step("the choice survives a reload", async () => {
    await page.reload()
    await expect(html).toHaveClass(/\bdark\b/)
  })

  await test.step("one click on the sun turns it light again", async () => {
    await page.getByRole("button", { name: "Включить светлую тему" }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
  })

  await test.step("the cabinet has the same switch", async () => {
    const buyer = await pageAs("buyer")
    await buyer.goto("/customer")
    await buyer.getByRole("button", { name: "Включить тёмную тему" }).click()
    await expect(buyer.locator("html")).toHaveClass(/\bdark\b/)
  })
})
