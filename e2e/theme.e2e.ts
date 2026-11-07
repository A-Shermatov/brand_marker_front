import { expect, test } from "./support/fixtures"

/**
 * Night theme: the sun or moon in the bar switches the look, the choice
 * outlives a reload and a sign-in, and "Как на устройстве" follows the
 * computer's own setting.
 */

test.use({ colorScheme: "light" })

test("the theme switch turns the night look on, keeps it and follows the device", async ({ page, pageAs }) => {
  const html = page.locator("html")

  await test.step("the site starts in the device's light look", async () => {
    await page.goto("/")
    await expect(html).not.toHaveClass(/\bdark\b/)
  })

  await test.step("choosing «Тёмная» turns the page dark", async () => {
    await page.getByRole("button", { name: /^Тема: светлая/ }).click()
    await page.getByRole("menuitem", { name: "Тёмная" }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(page.getByRole("button", { name: /^Тема: тёмная/ })).toBeVisible()
    // The page itself goes navy, not just a class on the root.
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(background).toBe("rgb(10, 17, 34)")
  })

  await test.step("the choice survives a reload", async () => {
    await page.reload()
    await expect(html).toHaveClass(/\bdark\b/)
  })

  await test.step("«Как на устройстве» follows the computer", async () => {
    await page.getByRole("button", { name: /^Тема: тёмная/ }).click()
    await page.getByRole("menuitem", { name: "Как на устройстве" }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    await page.emulateMedia({ colorScheme: "dark" })
    await expect(html).toHaveClass(/\bdark\b/)
  })

  await test.step("the cabinet has the same switch", async () => {
    const buyer = await pageAs("buyer")
    await buyer.goto("/customer")
    await buyer.getByRole("button", { name: /^Тема:/ }).click()
    await buyer.getByRole("menuitem", { name: "Тёмная" }).click()
    await expect(buyer.locator("html")).toHaveClass(/\bdark\b/)
  })
})
