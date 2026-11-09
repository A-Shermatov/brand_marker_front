import type { Page } from "@playwright/test"
import { expect, ruDate, runId, test } from "./support/fixtures"

/** The smallest valid PNG: one pixel. */
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63fcffff3f0300050001ff0a2db4b80000000049454e44ae426082",
  "hex",
)
/** First item the demo seed lists for «Пётр Исполнитель». */
const SERVICE = "Разработка корпоративного сайта"

async function publishServiceRequest(buyer: Page, title: string) {
  await buyer.goto("/customer/rfqs/new")
  await buyer.getByRole("button", { name: "Услуги" }).click()
  await buyer.locator("#rfq-title").fill(title)
  await buyer.locator("#rfq-category").selectOption({ label: "Ремонт помещений" })
  await buyer.locator("#rfq-description").fill("Покраска стен в переговорной, 30 м².")
  await buyer.getByRole("button", { name: /Далее/ }).click()
  await buyer.locator("#deadline").fill(ruDate(20))
  await buyer.locator("#start-date").fill(ruDate(25))
  await buyer.locator("#duration").fill("1 неделя")
  await buyer.getByRole("button", { name: /Далее/ }).click()
  await buyer.getByRole("button", { name: "Опубликовать заявку" }).click()
  await expect(buyer).toHaveURL(/\/customer\/rfqs\/[0-9a-f-]{36}$/)
}

test("a buyer cancels a request with a reason, archives it and brings it back", async ({ pageAs }) => {
  const title = `E2E отмена и архив ${runId}`
  const buyer = await pageAs("buyer")
  await publishServiceRequest(buyer, title)

  await test.step("cancel with a reason from the request page", async () => {
    await buyer.getByRole("button", { name: "Отменить заявку" }).click()
    const dialog = buyer.getByRole("dialog", { name: "Отменить заявку?" })
    await dialog.getByRole("button", { name: "Нашли поставщика сами" }).click()
    await dialog.getByRole("button", { name: "Отменить заявку" }).click()
    await expect(buyer.getByRole("status").filter({ hasText: "Заявка отменена" })).toContainText(
      "Причина: Нашли поставщика сами",
    )
  })

  await test.step("archive it from the list: it leaves «Закрытые» for «Архив»", async () => {
    await buyer.goto("/customer/rfqs?status=closed")
    const card = buyer.getByRole("listitem").filter({ hasText: title })
    await card.getByRole("button", { name: `Действия с заявкой «${title}»` }).click()
    await buyer.getByRole("menuitem", { name: "В архив" }).click()
    await expect(card).toHaveCount(0)

    await buyer.getByRole("tab", { name: /Архив/ }).click()
    await expect(buyer.getByRole("listitem").filter({ hasText: title })).toBeVisible()
  })

  await test.step("bring it back from the archive", async () => {
    const card = buyer.getByRole("listitem").filter({ hasText: title })
    await card.getByRole("button", { name: `Действия с заявкой «${title}»` }).click()
    await buyer.getByRole("menuitem", { name: "Вернуть из архива" }).click()
    await expect(card).toHaveCount(0)
    await buyer.getByRole("tab", { name: /Закрытые/ }).click()
    await expect(buyer.getByRole("listitem").filter({ hasText: title })).toBeVisible()
  })
})

test("a profile photo shows in the menu and next to the person's messages", async ({ pageAs }) => {
  const buyer = await pageAs("buyer")
  const supplier = await pageAs("supplier")
  const text = `Здравствуйте! Есть вопрос по сайту (${runId})`

  await test.step("the buyer uploads a photo in the profile", async () => {
    await buyer.goto("/customer/profile")
    await buyer.getByLabel("Выбрать фото профиля").setInputFiles({
      name: "me.png",
      mimeType: "image/png",
      buffer: PNG,
    })
    await expect(buyer.getByText("Фото профиля обновлено")).toBeVisible()
    await expect(buyer.getByRole("button", { name: "Сменить фото" })).toBeVisible()
    await expect(buyer.getByRole("button", { name: "Аккаунт" }).locator("img")).toBeVisible()
  })

  await test.step("the buyer writes to the supplier from the product page", async () => {
    await buyer.goto("/customer/catalog")
    await buyer.getByRole("searchbox", { name: "Поиск товаров и услуг" }).fill(SERVICE)
    await buyer.getByRole("heading", { name: SERVICE }).getByRole("link").first().click()
    await buyer.getByRole("button", { name: "Написать поставщику" }).click()
    await expect(buyer).toHaveURL(/\/customer\/messages\?supplier=\d+/)
    await buyer.getByRole("textbox", { name: "Текст сообщения" }).fill(text)
    await buyer.keyboard.press("Enter")
    await expect(buyer.getByRole("log", { name: "Сообщения" }).getByText(text)).toBeVisible()
  })

  await test.step("the supplier sees the buyer's photo in the list and next to the message", async () => {
    await supplier.goto("/supplier/messages")
    const dialogs = supplier.getByRole("complementary", { name: "Диалоги" })
    const row = dialogs.getByRole("button", { name: /Открыть переписку с/ }).filter({ hasText: text })
    await expect(row.locator("img")).toBeVisible()
    await row.click()
    const message = supplier.getByRole("log", { name: "Сообщения" }).getByRole("listitem").filter({ hasText: text })
    await expect(message.locator("img")).toBeVisible()
  })
})

test("the landing page shows buyers' requests with their budgets arriving", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Покупатели ищут поставщиков каждый день" })).toBeVisible()
  const feed = page.getByRole("list", { name: "Свежие заявки покупателей" })
  await expect(feed.getByRole("listitem")).toHaveCount(4)
  await expect(feed).toContainText("TJS")
  const first = await feed.getByRole("listitem").first().innerText()
  // The next request slides in at the top.
  await expect.poll(async () => feed.getByRole("listitem").first().innerText(), { timeout: 8000 }).not.toBe(first)
})

test("the admin manages the Telegram bot in the settings", async ({ pageAs }) => {
  const admin = await pageAs("admin")
  await admin.goto("/admin/settings")
  // The bot is a tab of the settings section.
  await admin.getByRole("tab", { name: "Telegram-бот" }).click()
  await expect(admin).toHaveURL(/\/admin\/telegram$/)
  await expect(admin.getByRole("tab", { name: "Telegram-бот" })).toHaveAttribute("aria-selected", "true")
  await expect(admin.getByText("Так выглядит пост")).toBeVisible()

  // A token that is not a bot token is refused before anything is sent to Telegram.
  await admin.getByLabel("Токен бота").fill("not-a-token")
  await admin.getByRole("textbox", { name: "Канал" }).fill("@brend_zayavki")
  await admin.getByRole("button", { name: "Сохранить" }).click()
  await expect(admin.getByText(/Токен бота выглядит неверно/)).toBeVisible()
})
