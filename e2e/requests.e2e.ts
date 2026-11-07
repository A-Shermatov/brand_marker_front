import { expect, ruDate, runId, test } from "./support/fixtures"

/** A buyer may leave the budget out: suppliers then name their own price. */
test("a buyer publishes a request without a budget", async ({ pageAs }) => {
  const title = `E2E без бюджета ${runId}`
  const buyer = await pageAs("buyer")
  const supplier = await pageAs("supplier")

  await test.step("the budget step starts at «Без бюджета» and needs no amount", async () => {
    await buyer.goto("/customer/rfqs/new")
    await buyer.getByRole("button", { name: "Услуги" }).click()
    await buyer.locator("#rfq-title").fill(title)
    await buyer.locator("#rfq-category").selectOption({ label: "Ремонт помещений" })
    await buyer.locator("#rfq-description").fill("Нужен косметический ремонт переговорной, 30 м².")
    await buyer.getByRole("button", { name: /Далее/ }).click()

    await expect(buyer.getByRole("button", { name: "Без бюджета" })).toHaveAttribute("aria-pressed", "true")
    await expect(buyer.locator("#budget-from")).toHaveCount(0)
    await buyer.locator("#deadline").fill(ruDate(20))
    await buyer.locator("#start-date").fill(ruDate(25))
    await buyer.locator("#duration").fill("1 неделя")
    await buyer.getByRole("button", { name: /Далее/ }).click()

    await expect(buyer.getByRole("definition").filter({ hasText: "Не указан" })).toBeVisible()
    await buyer.getByRole("button", { name: "Опубликовать заявку" }).click()
    await expect(buyer).toHaveURL(/\/customer\/rfqs\/[0-9a-f-]{36}$/)
  })

  await test.step("suppliers see that the budget is not set", async () => {
    await supplier.goto("/supplier/rfqs")
    const board = supplier.getByRole("main")
    await board.getByRole("searchbox", { name: "Поиск по заявкам покупателей" }).fill(title)
    const card = board.getByRole("listitem").filter({ hasText: title })
    await expect(card).toContainText(/Бюджет\s*Не указан/)
  })
})
