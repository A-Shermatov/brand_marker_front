import type { Page } from "@playwright/test"
import { expect, ruDate, runId, test } from "./support/fixtures"

/** A supplier finds the request on the board and answers it with a proposal. */
async function sendProposal(page: Page, title: string, price: string, days: string, note: string) {
  await page.goto("/supplier/rfqs")
  const board = page.getByRole("main")
  await board.getByRole("searchbox", { name: "Поиск по заявкам покупателей" }).fill(title)
  await board.getByRole("link", { name: title }).first().click()

  await expect(page.getByRole("heading", { level: 1 })).toContainText(title)
  await page.getByLabel("Цена, TJS").fill(price)
  await page.getByLabel("Срок, дней").fill(days)
  await page.getByLabel("Комментарий для покупателя").fill(note)
  await page.getByRole("button", { name: "Отправить КП" }).click()
  await expect(page.getByRole("heading", { name: "Ваше КП" })).toBeVisible()
}

/** The card of a request in My proposals. */
const myProposalCard = (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title })

/**
 * The main path of the marketplace, through the real UI of every party:
 * a buyer publishes a request, two suppliers answer, the buyer picks one,
 * both suppliers see who got the order, the buyer pays into escrow (mock
 * gateway), the supplier hands in the work, the buyer accepts it, the money
 * is released and the buyer leaves a review.
 */
test("a deal goes from a published request to a paid, reviewed contract", async ({ pageAs }) => {
  test.setTimeout(180_000)
  const title = `E2E ремонт офиса ${runId}`
  const review = `Всё сделали в срок, рекомендую (${runId})`
  const buyer = await pageAs("buyer")
  const supplier = await pageAs("supplier")
  const rival = await pageAs("bothSupplier")

  await test.step("buyer publishes a service request", async () => {
    await buyer.goto("/customer/rfqs/new")
    await buyer.getByRole("button", { name: "Услуги" }).click()
    await buyer.locator("#rfq-title").fill(title)
    await buyer.locator("#rfq-category").selectOption({ label: "Ремонт помещений" })
    await buyer.locator("#rfq-description").fill("Покраска стен и замена напольного покрытия в офисе 120 м².")
    await buyer.getByRole("button", { name: /Далее/ }).click()

    await buyer.getByRole("button", { name: "Точная сумма" }).click()
    await buyer.locator("#budget-from").fill("15000")
    await buyer.locator("#deadline").fill(ruDate(30))
    await buyer.locator("#start-date").fill(ruDate(35))
    await buyer.locator("#duration").fill("2 недели")
    await buyer.getByRole("button", { name: /Далее/ }).click()

    // The review step repeats what was entered.
    await expect(buyer.getByRole("definition").filter({ hasText: title })).toBeVisible()
    await expect(buyer.getByRole("definition").filter({ hasText: /15\s000\sTJS/ })).toBeVisible()
    await buyer.getByRole("button", { name: "Опубликовать заявку" }).click()

    await expect(buyer).toHaveURL(/\/customer\/rfqs\/[0-9a-f-]{36}$/)
    await expect(buyer.getByRole("heading", { level: 1 })).toContainText(title)
    await expect(buyer.getByRole("heading", { name: "КП пока нет" })).toBeVisible()
  })
  const rfqUrl = buyer.url()

  await test.step("supplier finds the request and sends a proposal", async () => {
    await sendProposal(supplier, title, "14500", "12", "Материалы входят в цену, работаем в выходные.")
    await expect(supplier.getByRole("main")).toContainText(/Ваше КП\s*Отправлено\s*14\s500\sTJS/)
  })

  await test.step("a second supplier answers too and sees the buyer is still choosing", async () => {
    await sendProposal(rival, title, "16000", "20", "Сделаем за 20 дней, гарантия год.")
    await rival.goto("/supplier/proposals")
    await expect(myProposalCard(rival, title)).toContainText("Покупатель ещё выбирает")
  })

  await test.step("buyer picks the first supplier and a contract is created", async () => {
    await buyer.goto(rfqUrl)
    await expect(buyer.getByRole("columnheader", { name: /Пётр Исполнитель/ })).toBeVisible()
    await expect(buyer.getByRole("cell", { name: /14\s500\sTJS/ })).toBeVisible()
    // One column per proposal; the first header is the row titles. Headers are
    // set in capitals by CSS, so innerText comes back upper-case.
    const headers = (await buyer.getByRole("columnheader").allInnerTexts()).slice(1)
    const column = headers.findIndex((text) => text.toLowerCase().includes("пётр исполнитель"))
    expect(column).toBeGreaterThanOrEqual(0)
    await buyer.getByRole("button", { name: "Выбрать", exact: true }).nth(column).click()

    const dialog = buyer.getByRole("dialog")
    await expect(dialog).toContainText(/Сумма сделки — 14\s500\sTJS/)
    await dialog.getByRole("button", { name: /Да, выбрать за 14\s500\sTJS/ }).click()

    await expect(buyer).toHaveURL(/\/customer\/contracts\/\d+$/)
    await expect(buyer.getByRole("heading", { level: 1 })).toHaveText(title)
    await expect(buyer.getByRole("list", { name: "Этапы сделки. Сейчас: Работа" })).toBeVisible()
  })
  const contractId = buyer.url().split("/").pop()!

  await test.step("both suppliers see who got the order", async () => {
    await supplier.goto("/supplier/proposals")
    const won = myProposalCard(supplier, title)
    await expect(won).toContainText("Покупатель выбрал вас")
    await expect(won.getByRole("link", { name: "Открыть сделку" })).toHaveAttribute(
      "href",
      `/supplier/contracts/${contractId}`,
    )

    await rival.goto("/supplier/proposals")
    const lost = myProposalCard(rival, title)
    await expect(lost).toContainText("Выбран другой поставщик")
    await expect(lost).toContainText("Заказ получил «Пётр Исполнитель»")
  })

  await test.step("buyer pays into escrow", async () => {
    await buyer.getByRole("button", { name: "Оплатить безопасно" }).click()
    const confirm = buyer.getByRole("alertdialog", { name: /Оплатить 14\s500\sTJS\?/ })
    await confirm.getByRole("button", { name: "Оплатить", exact: true }).click()

    await expect(buyer.getByText("На гарантии площадки")).toBeVisible()
    await expect(buyer.getByText("Оплачено", { exact: true })).toBeVisible()
    await expect(buyer.getByRole("button", { name: "Оплатить безопасно" })).toHaveCount(0)
  })

  await test.step("supplier hands in the work", async () => {
    await supplier.goto(`/supplier/contracts/${contractId}`)
    await expect(supplier.getByRole("heading", { name: "Выполните и сдайте работу" })).toBeVisible()
    await supplier.getByRole("tab", { name: "Сдача работы" }).click()
    await supplier.getByRole("textbox", { name: "Комментарий к отправке" }).fill("Работы выполнены, фотоотчёт по ссылке.")
    await supplier.getByRole("button", { name: "Тип вложения: Ссылка" }).click()
    await supplier.getByRole("textbox", { name: "Ссылка на результат работы" }).fill("https://example.com/report")
    await supplier.getByRole("textbox", { name: "Название ссылки" }).fill("Фотоотчёт")
    await supplier.getByRole("button", { name: "Добавить ссылку" }).click()
    await supplier.getByRole("button", { name: "Отправить на проверку" }).click()

    const panel = supplier.getByRole("tabpanel")
    await expect(panel.getByText("На проверке")).toBeVisible()
    await expect(panel.getByRole("link", { name: /Фотоотчёт/ })).toBeVisible()
  })

  await test.step("buyer accepts the work and the deal completes", async () => {
    await buyer.reload()
    await buyer.getByRole("tab", { name: /Сдача работы/ }).click()
    await expect(buyer.getByRole("tabpanel").getByText("Работы выполнены, фотоотчёт по ссылке.")).toBeVisible()
    await buyer.getByRole("button", { name: "Принять сдачу" }).click()

    const confirm = buyer.getByRole("alertdialog", { name: "Принять работу?" })
    await expect(confirm).toContainText(/13\s775\sTJS/) // 14 500 minus the 5% fee
    await confirm.getByRole("button", { name: "Да, принять" }).click()

    await expect(buyer.getByRole("heading", { name: "Сделка завершена" })).toBeVisible()
    await expect(buyer.getByRole("list", { name: "Этапы сделки. Сейчас: Завершено" })).toBeVisible()
  })

  await test.step("supplier sees the money released", async () => {
    await supplier.goto(`/supplier/contracts/${contractId}`)
    await expect(supplier.getByRole("heading", { name: "Деньги зачислены" })).toBeVisible()
    await supplier.goto("/supplier/finance")
    // The invoice of this deal: its card links to the deal.
    const invoice = supplier
      .getByRole("list", { name: "Счета" })
      .getByRole("listitem")
      .filter({ has: supplier.locator(`a[href="/supplier/contracts/${contractId}"]`) })
    await expect(invoice).toContainText(/14\s500\sTJS/)
    await expect(invoice).toContainText("Оплачен")
    // The fee shown is the one the deal was charged: 725 of 14 500 is 5%.
    await expect(supplier.getByRole("region", { name: "Баланс" })).toContainText(/Комиссия площадки\s*5%/)
  })

  await test.step("buyer reviews the supplier and the supplier sees it", async () => {
    await buyer.goto(`/customer/contracts/${contractId}`)
    await buyer.getByRole("button", { name: "Оставить отзыв" }).click()
    const dialog = buyer.getByRole("dialog", { name: "Оставить отзыв" })
    await dialog.getByRole("button", { name: "Сроки: 4" }).click()
    await dialog.getByRole("button", { name: "Надёжный" }).click()
    await dialog.getByRole("textbox", { name: "Что понравилось, что можно улучшить" }).fill(review)
    await dialog.getByRole("button", { name: "Отправить отзыв" }).click()
    await expect(dialog).toBeHidden()

    await supplier.goto("/supplier/reviews")
    await expect(supplier.getByText(review).filter({ visible: true }).first()).toBeVisible()
  })
})
