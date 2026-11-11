import { expect, test } from "./support/fixtures"

/**
 * "Мой профиль": the person on top with what is left to fill in, and one thing
 * per tab under it. A step of the checklist opens the tab it is done on, and
 * doing it moves the progress.
 */
test("the profile shows what is left to fill in and leads to it", async ({ pageAs }) => {
  const page = await pageAs("supplier")
  await page.goto("/supplier/profile")

  const hero = page.getByRole("region", { name: "Ваш профиль" })
  const progress = page.getByTestId("profile-progress")
  await expect(hero.getByRole("heading", { level: 2 })).toBeVisible()
  await expect(progress).toContainText(/Профиль заполнен на \d+%/)

  await test.step("tabs keep one thing each, and the address remembers the tab", async () => {
    const tabs = page.getByRole("tablist", { name: "Разделы профиля" })
    await expect(tabs.getByRole("tab")).toHaveText(["Основное", "Моя страничка", "Проверка", "Безопасность", "Telegram"])
    await expect(page.getByRole("form", { name: "Контактные данные" })).toBeVisible()

    await tabs.getByRole("tab", { name: "Безопасность" }).click()
    await expect(page).toHaveURL(/\/supplier\/profile\?tab=security$/)
    await expect(page.getByRole("button", { name: "Сменить пароль" })).toBeVisible()
    await expect(page.getByRole("form", { name: "Контактные данные" })).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole("button", { name: "Сменить пароль" })).toBeVisible()

    await tabs.getByRole("tab", { name: "Telegram" }).click()
    await expect(page.getByRole("heading", { name: "Brand Market в Telegram" })).toBeVisible()
  })

  await test.step("a step of the checklist opens its tab, and doing it counts", async () => {
    const before = Number((await progress.textContent())?.match(/(\d+) из \d+/)?.[1])
    await progress.getByRole("button", { name: /Указать телефон/ }).click()
    await expect(page).toHaveURL(/\/supplier\/profile$/)
    const form = page.getByRole("form", { name: "Контактные данные" })
    await form.getByLabel("Телефон").fill("+992 90 123 45 67")
    await form.getByRole("button", { name: "Сохранить изменения" }).click()
    await expect(form.getByRole("status")).toHaveText("Сохранено")

    await expect(hero).toContainText("+992 90 123 45 67")
    await expect(progress.getByRole("button", { name: /Указать телефон/ })).toHaveCount(0)
    await expect(progress).toContainText(`${before + 1} из`)
  })

  await test.step("the buyer's profile has no public page tab", async () => {
    const buyer = await pageAs("buyer")
    await buyer.goto("/customer/profile")
    await expect(buyer.getByRole("tablist", { name: "Разделы профиля" }).getByRole("tab")).toHaveText([
      "Основное",
      "Проверка",
      "Безопасность",
      "Telegram",
    ])
  })
})
