import type { Page } from "@playwright/test"
import { expect, ruDate, runId, test } from "./support/fixtures"

/**
 * What a paid plan does for a buyer: their request stands out in the
 * suppliers' feed. Without a plan the buyer is shown the offer once; with one,
 * the same place confirms it works.
 */

async function publishServiceRequest(buyer: Page, title: string) {
  await buyer.goto("/customer/rfqs/new")
  await buyer.getByRole("button", { name: "Услуги" }).click()
  await buyer.locator("#rfq-title").fill(title)
  await buyer.locator("#rfq-category").selectOption({ label: "Ремонт помещений" })
  await buyer.locator("#rfq-description").fill("Покраска стен в переговорной, 30 м².")
  await buyer.getByRole("button", { name: /Далее/ }).click()
  await buyer.locator("#deadline").fill(ruDate(20))
  await buyer.locator("#start-date").fill(ruDate(25))
  await buyer.locator("#work-deadline").fill(ruDate(32))
  await buyer.getByRole("button", { name: /Далее/ }).click()
  await buyer.getByRole("button", { name: "Опубликовать заявку" }).click()
  await expect(buyer).toHaveURL(/\/customer\/rfqs\/[0-9a-f-]{36}$/)
}

test("a buyer's plan lifts their request in the suppliers' feed and colours it", async ({ pageAs }) => {
  test.setTimeout(120_000)
  const title = `E2E заявка с подпиской ${runId}`
  const buyer = await pageAs("buyer")
  const supplier = await pageAs("supplier")
  const plan = buyer.getByTestId("current-plan")

  /** The request's card in the supplier's feed, found by its title. */
  const cardInFeed = async () => {
    await supplier.goto("/supplier/rfqs")
    await supplier.getByRole("main").getByRole("searchbox", { name: "Поиск по заявкам покупателей" }).fill(title)
    const card = supplier.getByRole("list", { name: "Заявки покупателей" }).getByRole("listitem").filter({ hasText: title })
    await expect(card).toBeVisible()
    return card
  }

  await test.step("without a plan the request is an ordinary card and the buyer sees the offer", async () => {
    await buyer.goto("/customer/plan")
    await expect(plan).toHaveText("Подписка не подключена")
    await publishServiceRequest(buyer, title)

    const card = await cardInFeed()
    await expect(card).not.toHaveAttribute("data-promoted", "true")
    await expect(card.getByTestId("promoted-tag")).toHaveCount(0)

    await buyer.goto("/customer/rfqs")
    await expect(buyer.getByTestId("plan-upsell")).toContainText("Поднимите заявки на первое место")
  })

  await test.step("the buyer connects a plan from the offer", async () => {
    await buyer.getByTestId("plan-upsell").getByRole("link", { name: "Посмотреть тарифы" }).click()
    await expect(buyer).toHaveURL(/\/customer\/plan$/)
    await buyer.getByRole("button", { name: "Подключить «Старт»" }).click()
    await expect(plan).toHaveText("Тариф «Старт»")

    // The offer is gone; the same place says the plan works, and the request carries the tag.
    await buyer.goto("/customer/rfqs")
    await expect(buyer.getByTestId("plan-active-note")).toContainText("Тариф «Старт» работает")
    await expect(buyer.getByTestId("plan-upsell")).toHaveCount(0)
    const own = buyer.getByRole("list", { name: "Мои заявки" }).getByRole("listitem").filter({ hasText: title })
    await expect(own.getByTestId("promoted-tag")).toBeVisible()
  })

  await test.step("suppliers see the request highlighted", async () => {
    const card = await cardInFeed()
    await expect(card).toHaveAttribute("data-promoted", "true")
    await expect(card.getByTestId("promoted-tag")).toHaveText("В топе")
  })

  await test.step("cancelling the plan makes the request ordinary again", async () => {
    await buyer.goto("/customer/plan")
    await buyer.getByRole("button", { name: "Отменить подписку" }).click()
    await expect(plan).toHaveText("Подписка не подключена")
    const card = await cardInFeed()
    await expect(card).not.toHaveAttribute("data-promoted", "true")
  })
})
