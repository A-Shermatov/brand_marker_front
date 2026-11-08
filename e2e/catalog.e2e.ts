import { expect, runId, test } from "./support/fixtures"

/**
 * Buying from the catalog inside the cabinet, through the real UI of both
 * parties: the buyer finds a service in the cabinet catalog, puts it in the
 * cart, checks out paying at once, the supplier accepts, the buyer pays and
 * the money goes straight to the supplier, the work is accepted and the buyer
 * leaves a review of that very service.
 *
 * The service is the first one the demo seed lists for «Пётр Исполнитель».
 */
const SERVICE = "Разработка корпоративного сайта"

test("a buyer buys from the cabinet catalog, pays at once and reviews the item", async ({ pageAs }) => {
  test.setTimeout(240_000)
  const buyer = await pageAs("buyer")
  const supplier = await pageAs("supplier")
  const review = `Сайт сделали аккуратно и быстро (${runId})`
  let itemPath = ""
  let contractId = ""

  await test.step("the catalog is a main menu section and opens inside the cabinet", async () => {
    await buyer.goto("/customer")
    const menu = buyer.getByRole("navigation", { name: "Меню кабинета" })
    await menu.getByRole("link", { name: "Каталог товаров" }).click()
    await expect(buyer).toHaveURL(/\/customer\/catalog$/)
    // Company moved under "Ещё".
    await expect(menu.getByRole("link", { name: "Компания" })).toHaveAttribute("href", "/customer/company")
  })

  await test.step("the buyer opens the service in the cabinet", async () => {
    await buyer.getByRole("searchbox", { name: "Поиск товаров и услуг" }).fill(SERVICE)
    // The title link covers the whole card.
    await buyer.getByRole("heading", { name: SERVICE }).getByRole("link").first().click()
    await expect(buyer).toHaveURL(/\/customer\/catalog\/\d+$/)
    itemPath = new URL(buyer.url()).pathname
    await expect(buyer.getByRole("heading", { level: 1 })).toHaveText(SERVICE)
    await expect(buyer.getByRole("navigation", { name: "Вы здесь" })).toContainText("Каталог товаров")
  })

  await test.step("the photo magnifies under the cursor", async () => {
    const photo = buyer.getByTestId("product-photo")
    const image = photo.locator("img")
    if (await image.count()) {
      await photo.hover({ position: { x: 40, y: 40 } })
      await expect(image).toHaveAttribute("style", /scale\(/)
    }
  })

  await test.step("the service goes to the cart", async () => {
    await buyer.getByRole("button", { name: "В корзину", exact: true }).click()
    await expect(buyer.getByRole("link", { name: "Корзина: 1" })).toBeVisible()
    await buyer.getByRole("link", { name: "Корзина: 1" }).click()
    await expect(buyer).toHaveURL(/\/customer\/cart$/)
    await expect(buyer.getByRole("link", { name: SERVICE }).first()).toBeVisible()
    await expect(buyer.getByRole("main")).toContainText(/К оплате\s*2\s500\sTJS/)
  })

  await test.step("checkout paying at once creates the order", async () => {
    await buyer.getByRole("radio", { name: /Оплатить сразу/ }).click()
    await buyer.getByRole("button", { name: "Оформить заказ" }).click()
    await expect(buyer).toHaveURL(/\/customer\/rfqs\?status=all$/)
    await buyer.getByRole("link", { name: SERVICE }).first().click()
    await expect(buyer.getByRole("main")).toContainText("Оплата сразу поставщику")
  })

  await test.step("the supplier accepts the order and a deal opens", async () => {
    await supplier.goto("/supplier/rfqs")
    await supplier.getByRole("main").getByRole("searchbox", { name: "Поиск по заявкам покупателей" }).fill(SERVICE)
    const card = supplier.getByRole("main").getByRole("listitem").filter({ hasText: "оплата сразу" }).first()
    await card.getByRole("link", { name: SERVICE }).click()
    await expect(supplier.getByRole("main")).toContainText("Сразу вам: деньги приходят в момент оплаты")
    await supplier.getByRole("button", { name: "Принять и открыть сделку" }).click()
    await expect(supplier).toHaveURL(/\/supplier\/contracts\/\d+$/)
    contractId = supplier.url().split("/").pop()!
    await expect(supplier.getByText("Оплата сразу").first()).toBeVisible()
  })

  await test.step("the buyer pays and the money goes straight to the supplier", async () => {
    await buyer.goto(`/customer/contracts/${contractId}`)
    await expect(buyer.getByRole("heading", { name: "Оплатите заказ — деньги сразу получит поставщик" })).toBeVisible()
    await buyer.getByRole("button", { name: "Оплатить поставщику" }).click()
    const confirm = buyer.getByRole("alertdialog", { name: /Оплатить 2\s500\sTJS\?/ })
    await expect(confirm).toContainText("Вы выбрали оплату сразу")
    await confirm.getByRole("button", { name: "Оплатить", exact: true }).click()
    await expect(buyer.getByText("Выплачен", { exact: true }).first()).toBeVisible()
    await expect(buyer.getByRole("main")).toContainText("Оплата уже у исполнителя")
  })

  await test.step("the supplier hands in the work and the buyer accepts it", async () => {
    await supplier.reload()
    await supplier.getByRole("tab", { name: "Сдача работы" }).click()
    await supplier.getByRole("textbox", { name: "Комментарий к отправке" }).fill("Сайт готов, ссылка на макет.")
    await supplier.getByRole("button", { name: "Тип вложения: Ссылка" }).click()
    await supplier.getByRole("textbox", { name: "Ссылка на результат работы" }).fill("https://example.com/site")
    await supplier.getByRole("textbox", { name: "Название ссылки" }).fill("Макет сайта")
    await supplier.getByRole("button", { name: "Добавить ссылку" }).click()
    await supplier.getByRole("button", { name: "Отправить на проверку" }).click()
    await expect(supplier.getByRole("tabpanel").getByText("На проверке")).toBeVisible()

    await buyer.reload()
    await buyer.getByRole("tab", { name: /Сдача работы/ }).click()
    await buyer.getByRole("button", { name: "Принять сдачу" }).click()
    const confirm = buyer.getByRole("alertdialog", { name: "Принять работу?" })
    await expect(confirm).toContainText("уже получил оплату")
    await confirm.getByRole("button", { name: "Да, принять" }).click()
    await expect(buyer.getByRole("heading", { name: "Сделка завершена" })).toBeVisible()
  })

  await test.step("the buyer reviews the item on its page and the review is listed there", async () => {
    await buyer.goto(itemPath)
    const reviews = buyer.getByRole("region", { name: "Отзывы о товаре" })
    await reviews.getByRole("button", { name: "Оставить отзыв" }).click()
    const dialog = buyer.getByRole("dialog", { name: "Оставить отзыв" })
    await dialog.getByRole("button", { name: "Качество: 5" }).click()
    await dialog.getByRole("textbox", { name: "Что понравилось, что можно улучшить" }).fill(review)
    await dialog.getByRole("button", { name: "Отправить отзыв" }).click()
    await expect(dialog).toBeHidden()

    await expect(reviews.getByText(review)).toBeVisible()
    await expect(reviews.getByRole("button", { name: "Оставить отзыв" })).toHaveCount(0)
    await expect(reviews).toContainText("Оценка поставщика")
  })
})
